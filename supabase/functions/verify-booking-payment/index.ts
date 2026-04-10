import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";
import { Resend } from "npm:resend@2.0.0";
import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

// Calculate 48-hour confirmation deadline from now
const getConfirmationDeadline = (): string => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString();
};

// Calculate check-in confirmation deadline (24 hours after check-in date)
const getCheckinConfirmationDeadline = (checkInDate: string): string => {
  const deadline = new Date(checkInDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline.toISOString();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    logStep("Function started");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    // Rate limit check
    const rateCheck = await checkRateLimit(supabaseClient, user.id, RATE_LIMITS.VERIFY_PAYMENT);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");
    logStep("Request body parsed", { bookingId });

    // Fetch the booking with listing and property details
    const { data: booking, error: bookingError } = await supabaseClient
      .from("bookings")
      .select(`
        *,
        listing:listings(
          *,
          property:properties(*)
        )
      `)
      .eq("id", bookingId)
      .eq("renter_id", user.id)
      .single();

    if (bookingError || !booking) {
      throw new Error("Booking not found");
    }
    logStep("Booking fetched", { bookingId: booking.id, status: booking.status });

    if (booking.status === "confirmed" || booking.status === "completed") {
      logStep("Booking already confirmed");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: booking.status,
          message: "Booking already confirmed" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }

    if (!booking.payment_intent_id) {
      throw new Error("No payment session associated with this booking");
    }

    // Initialize Stripe and verify payment
    const stripe = new Stripe(stripeKey, { apiVersion: "2025-08-27.basil" });
    const session = await stripe.checkout.sessions.retrieve(booking.payment_intent_id);
    logStep("Stripe session retrieved", { 
      sessionId: session.id, 
      paymentStatus: session.payment_status 
    });

    if (session.payment_status === "paid") {
      // Extract tax info from Stripe session
      const taxAmount = session.total_details?.amount_tax
        ? session.total_details.amount_tax / 100
        : 0;
      logStep("Tax info from Stripe", { taxAmount, totalDetails: session.total_details });

      // Update booking to confirmed with tax info
      const { error: updateError } = await supabaseClient
        .from("bookings")
        .update({
          status: "confirmed",
          paid_at: new Date().toISOString(),
          tax_amount: taxAmount,
          total_amount: session.amount_total ? session.amount_total / 100 : booking.total_amount,
        })
        .eq("id", bookingId);

      if (updateError) throw new Error(`Failed to update booking: ${updateError.message}`);

      // Update listing status to booked
      const { error: listingError } = await supabaseClient
        .from("listings")
        .update({ status: "booked" })
        .eq("id", booking.listing_id);

      if (listingError) {
        logStep("Warning: Failed to update listing status", { error: listingError.message });
      }

      // Wire to unified conversation layer
      try {
        const listingData = booking.listing as Record<string, unknown>;
        const ownerId = listingData?.owner_id as string;
        const propertyId = listingData?.property_id as string;
        if (ownerId && propertyId) {
          const { data: convId } = await supabaseClient.rpc("get_or_create_conversation", {
            p_owner_id: ownerId,
            p_traveler_id: booking.renter_id,
            p_property_id: propertyId,
            p_listing_id: booking.listing_id,
            p_context_type: "booking",
            p_context_id: booking.id,
          });
          if (convId) {
            // Update booking with conversation_id
            await supabaseClient
              .from("bookings")
              .update({ conversation_id: convId })
              .eq("id", bookingId);
            // Insert booking_confirmed event
            await supabaseClient.rpc("insert_conversation_event", {
              p_conversation_id: convId,
              p_event_type: "booking_confirmed",
              p_event_data: {
                booking_id: booking.id,
                total: session.amount_total ? session.amount_total / 100 : booking.total_amount,
                check_in: (listingData as Record<string, unknown>).check_in_date,
              },
            });
          }
          logStep("Conversation created for booking", { convId });
        }
      } catch (convError) {
        logStep("Warning: Failed to create conversation", { error: String(convError) });
      }

      // Read owner confirmation window from system_settings
      let ownerConfirmationWindowMinutes = 60; // default
      try {
        const { data: windowSetting } = await supabaseClient
          .from("system_settings")
          .select("setting_value")
          .eq("setting_key", "owner_confirmation_window_minutes")
          .single();
        if (windowSetting?.setting_value?.value) {
          ownerConfirmationWindowMinutes = windowSetting.setting_value.value;
        }
      } catch {
        logStep("Using default owner confirmation window", { minutes: ownerConfirmationWindowMinutes });
      }

      // Calculate owner confirmation deadline
      const ownerConfirmationDeadline = new Date();
      ownerConfirmationDeadline.setMinutes(ownerConfirmationDeadline.getMinutes() + ownerConfirmationWindowMinutes);

      // Create booking_confirmations record with 48-hour deadline (escrow) + owner confirmation
      const confirmationDeadline = getConfirmationDeadline();
      const { data: bookingConfirmation, error: confirmationError } = await supabaseClient
        .from("booking_confirmations")
        .insert({
          booking_id: bookingId,
          listing_id: booking.listing_id,
          owner_id: booking.listing?.owner_id,
          confirmation_deadline: confirmationDeadline,
          escrow_status: "pending_confirmation",
          escrow_amount: booking.total_amount,
          owner_confirmation_status: "pending_owner",
          owner_confirmation_deadline: ownerConfirmationDeadline.toISOString(),
          extensions_used: 0,
        })
        .select()
        .single();

      if (confirmationError) {
        logStep("Warning: Failed to create booking confirmation", { error: confirmationError.message });
      } else {
        logStep("Booking confirmation created", { 
          confirmationId: bookingConfirmation.id,
          deadline: confirmationDeadline 
        });

        // Send email notification to owner about new booking
        try {
          const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation-reminder`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "new_booking",
              bookingConfirmationId: bookingConfirmation.id,
            }),
          });
          logStep("New booking notification sent to owner");
        } catch (emailError) {
          logStep("Warning: Failed to send new booking notification", { error: String(emailError) });
        }

        // Send owner confirmation request notification
        try {
          const notificationUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/send-booking-confirmation-reminder`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({
              type: "owner_confirmation_request",
              bookingConfirmationId: bookingConfirmation.id,
            }),
          });
          logStep("Owner confirmation request notification sent");
        } catch (emailError) {
          logStep("Warning: Failed to send owner confirmation request", { error: String(emailError) });
        }
      }

      // Create checkin_confirmations record for traveler check-in (24h after arrival)
      const checkInDate = booking.listing?.check_in_date;
      if (checkInDate) {
        const checkinDeadline = getCheckinConfirmationDeadline(checkInDate);
        const { error: checkinError } = await supabaseClient
          .from("checkin_confirmations")
          .insert({
            booking_id: bookingId,
            traveler_id: user.id,
            confirmation_deadline: checkinDeadline,
          });

        if (checkinError) {
          logStep("Warning: Failed to create checkin confirmation", { error: checkinError.message });
        } else {
          logStep("Checkin confirmation created", { deadline: checkinDeadline });
        }
      }

      // Contribute to platform guarantee fund (3% of commission)
      const guaranteeFundContribution = Math.round(booking.rav_commission * 0.03 * 100) / 100;
      const { error: fundError } = await supabaseClient
        .from("platform_guarantee_fund")
        .insert({
          booking_id: bookingId,
          contribution_amount: guaranteeFundContribution,
          contribution_percentage: 3,
        });

      if (fundError) {
        logStep("Warning: Failed to add to guarantee fund", { error: fundError.message });
      } else {
        logStep("Guarantee fund contribution added", { amount: guaranteeFundContribution });
      }

      // Send booking confirmation email to traveler
      try {
        const resortName = booking.listing?.property?.resort_name || "Your Resort";
        const location = booking.listing?.property?.location || "";
        const checkIn = new Date(booking.listing?.check_in_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        const checkOut = new Date(booking.listing?.check_out_date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
        const nights = Math.ceil((new Date(booking.listing?.check_out_date).getTime() - new Date(booking.listing?.check_in_date).getTime()) / (1000 * 60 * 60 * 24));
        const unitType = booking.listing?.unit_type || "Standard";

        // Fetch traveler profile for name
        const { data: travelerProfile } = await supabaseClient
          .from("profiles")
          .select("full_name, email")
          .eq("id", user.id)
          .single();

        const travelerName = travelerProfile?.full_name || "Traveler";
        const travelerEmail = travelerProfile?.email || user.email;

        if (travelerEmail) {
          const html = buildEmailHtml({
            recipientName: travelerName,
            heading: "Booking Confirmed!",
            body: `
              <p>Congratulations! Your booking has been confirmed and payment received.</p>
              <p>Here are the details of your reservation:</p>
              <div style="background: #f7fafc; padding: 16px 20px; border-radius: 6px; margin: 16px 0;">
                ${detailRow("Booking ID", bookingId.slice(0, 8).toUpperCase())}
                ${detailRow("Resort", resortName)}
                ${location ? detailRow("Location", location) : ""}
                ${detailRow("Unit Type", unitType)}
                ${detailRow("Dates", `${checkIn} – ${checkOut}`)}
                ${detailRow("Duration", `${nights} night${nights !== 1 ? "s" : ""}`)}
                ${detailRow("Total Paid", `$${booking.total_amount?.toLocaleString()}`)}
              </div>
              <p>The property owner will confirm your reservation with the resort shortly. We'll notify you once that's complete.</p>
              <p>You can also share this with your travel companions and start planning your trip!</p>
            `,
            cta: { label: "View My Booking", url: `https://rentavacation.lovable.app/booking-success?booking_id=${bookingId}` },
          });

          await resend.emails.send({
            from: "Rent-A-Vacation <notifications@updates.rent-a-vacation.com>",
            to: [travelerEmail],
            subject: `Booking Confirmed – ${resortName}`,
            html,
          });

          logStep("Traveler confirmation email sent", { travelerEmail });
        }
      } catch (emailError) {
        logStep("Warning: Failed to send traveler confirmation email", { error: String(emailError) });
      }

      logStep("Booking confirmed successfully with escrow");
      return new Response(
        JSON.stringify({ 
          success: true, 
          status: "confirmed",
          message: "Payment verified and booking confirmed with escrow",
          escrow: {
            deadline: confirmationDeadline,
            amount: booking.total_amount,
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    } else {
      logStep("Payment not completed", { paymentStatus: session.payment_status });
      return new Response(
        JSON.stringify({ 
          success: false, 
          status: booking.status,
          message: "Payment not completed" 
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        }
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
