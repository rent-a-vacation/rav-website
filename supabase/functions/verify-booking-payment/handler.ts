// Core logic for verify-booking-payment. Extracted from index.ts for #371.
// `index.ts` stays as a thin Deno.serve wrapper that injects production deps.

import { buildEmailHtml, detailRow } from "../_shared/email-template.ts";
import { disclaimerHtml } from "../_shared/disclaimers.ts";
import { checkRateLimit, rateLimitResponse, RATE_LIMITS } from "../_shared/rate-limit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const logStep = (step: string, details?: Record<string, unknown>) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : "";
  console.log(`[VERIFY-BOOKING-PAYMENT] ${step}${detailsStr}`);
};

const getConfirmationDeadline = (): string => {
  const deadline = new Date();
  deadline.setHours(deadline.getHours() + 48);
  return deadline.toISOString();
};

const getCheckinConfirmationDeadline = (checkInDate: string): string => {
  const deadline = new Date(checkInDate);
  deadline.setHours(deadline.getHours() + 24);
  return deadline.toISOString();
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type SupabaseLike = any;

export interface StripeLike {
  checkout: {
    sessions: {
      retrieve: (id: string) => Promise<{
        id: string;
        payment_status: string;
        amount_total?: number;
        total_details?: { amount_tax?: number };
      }>;
    };
  };
}

export interface ResendLike {
  emails: {
    send: (args: {
      from: string;
      to: string[];
      subject: string;
      html: string;
    }) => Promise<unknown>;
  };
}

export interface Deps {
  supabase: SupabaseLike;
  stripe: StripeLike;
  resend: ResendLike;
  env: Record<string, string | undefined>;
}

export async function handler(req: Request, deps: Deps): Promise<Response> {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const { supabase, stripe, resend, env } = deps;

  try {
    logStep("Function started");

    if (!env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY is not set");
    logStep("Stripe key verified");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header provided");

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError) throw new Error(`Authentication error: ${userError.message}`);
    const user = userData.user;
    if (!user) throw new Error("User not authenticated");
    logStep("User authenticated", { userId: user.id });

    const rateCheck = await checkRateLimit(supabase, user.id, RATE_LIMITS.VERIFY_PAYMENT);
    if (!rateCheck.allowed) {
      logStep("Rate limited", { userId: user.id });
      return rateLimitResponse(rateCheck.retryAfterSeconds);
    }

    const { bookingId } = await req.json();
    if (!bookingId) throw new Error("Booking ID is required");
    logStep("Request body parsed", { bookingId });

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(
        `
        *,
        listing:listings(
          *,
          property:properties(*)
        )
      `,
      )
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
          message: "Booking already confirmed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    if (!booking.payment_intent_id) {
      throw new Error("No payment session associated with this booking");
    }

    const session = await stripe.checkout.sessions.retrieve(booking.payment_intent_id);
    logStep("Stripe session retrieved", {
      sessionId: session.id,
      paymentStatus: session.payment_status,
    });

    if (session.payment_status !== "paid") {
      logStep("Payment not completed", { paymentStatus: session.payment_status });
      return new Response(
        JSON.stringify({
          success: false,
          status: booking.status,
          message: "Payment not completed",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
      );
    }

    // ── Paid path ──────────────────────────────────────────────────────────
    const taxAmount = session.total_details?.amount_tax ? session.total_details.amount_tax / 100 : 0;
    logStep("Tax info from Stripe", { taxAmount, totalDetails: session.total_details });

    const { error: updateError } = await supabase
      .from("bookings")
      .update({
        status: "confirmed",
        paid_at: new Date().toISOString(),
        tax_amount: taxAmount,
        total_amount: session.amount_total ? session.amount_total / 100 : booking.total_amount,
      })
      .eq("id", bookingId);

    if (updateError) throw new Error(`Failed to update booking: ${updateError.message}`);

    const { error: listingError } = await supabase
      .from("listings")
      .update({ status: "booked" })
      .eq("id", booking.listing_id);

    if (listingError) {
      logStep("Warning: Failed to update listing status", { error: listingError.message });
    }

    // Conversation creation
    try {
      const listingData = booking.listing as Record<string, unknown>;
      const ownerId = listingData?.owner_id as string;
      const propertyId = listingData?.property_id as string;
      if (ownerId && propertyId) {
        const { data: convId } = await supabase.rpc("get_or_create_conversation", {
          p_owner_id: ownerId,
          p_traveler_id: booking.renter_id,
          p_property_id: propertyId,
          p_listing_id: booking.listing_id,
          p_context_type: "booking",
          p_context_id: booking.id,
        });
        if (convId) {
          await supabase
            .from("bookings")
            .update({ conversation_id: convId })
            .eq("id", bookingId);
          await supabase.rpc("insert_conversation_event", {
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

    let ownerConfirmationWindowMinutes = 60;
    try {
      const { data: windowSetting } = await supabase
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

    // DEC-034 source_type branching
    const sourceType: "pre_booked" | "wish_matched" =
      booking.source_type === "wish_matched" ? "wish_matched" : "pre_booked";
    logStep("Source type determined", { sourceType });

    const confirmationDeadline = getConfirmationDeadline();
    const ownerConfirmationDeadline = new Date();
    ownerConfirmationDeadline.setMinutes(
      ownerConfirmationDeadline.getMinutes() + ownerConfirmationWindowMinutes,
    );

    const confirmationInsertBody =
      sourceType === "pre_booked"
        ? {
            booking_id: bookingId,
            listing_id: booking.listing_id,
            owner_id: booking.listing?.owner_id,
            confirmation_deadline: confirmationDeadline,
            escrow_status: "pending_confirmation",
            escrow_amount: booking.total_amount,
            owner_confirmation_status: "owner_confirmed",
            owner_confirmed_at: new Date().toISOString(),
            owner_confirmation_deadline: null,
            extensions_used: 0,
          }
        : {
            booking_id: bookingId,
            listing_id: booking.listing_id,
            owner_id: booking.listing?.owner_id,
            confirmation_deadline: confirmationDeadline,
            escrow_status: "pending_confirmation",
            escrow_amount: booking.total_amount,
            owner_confirmation_status: "pending_owner",
            owner_confirmation_deadline: ownerConfirmationDeadline.toISOString(),
            extensions_used: 0,
          };

    const { data: bookingConfirmation, error: confirmationError } = await supabase
      .from("booking_confirmations")
      .insert(confirmationInsertBody)
      .select()
      .single();

    if (confirmationError) {
      logStep("Warning: Failed to create booking confirmation", { error: confirmationError.message });
    } else if (bookingConfirmation) {
      logStep("Booking confirmation created", {
        confirmationId: bookingConfirmation.id,
        deadline: confirmationDeadline,
      });

      // New-booking notification via fetch (legacy email reminder)
      try {
        const notificationUrl = `${env.SUPABASE_URL}/functions/v1/send-booking-confirmation-reminder`;
        await fetch(notificationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
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

      // In-app notification to owner (notification-dispatcher)
      try {
        const ownerId = (booking.listing as Record<string, unknown>)?.owner_id as string | undefined;
        const resortName = ((booking.listing as Record<string, unknown>)?.property as Record<string, unknown>)?.resort_name as string | undefined;
        if (ownerId) {
          await supabase.functions.invoke("notification-dispatcher", {
            body: {
              type_key: "booking_confirmed",
              user_id: ownerId,
              payload: {
                title: "New booking received",
                message: resortName
                  ? `Booking confirmed for ${resortName}`
                  : "A new booking has been confirmed on your listing",
                booking_id: booking.id,
                listing_id: booking.listing_id,
              },
            },
          });
          logStep("In-app notification dispatched to owner", { ownerId });
        }
      } catch (dispatchError) {
        logStep("Warning: Failed to dispatch in-app notification", { error: String(dispatchError) });
      }

      // DEC-034: only send "please confirm at the resort" + traveler waiting notification for wish_matched
      if (sourceType === "wish_matched") {
        try {
          const notificationUrl = `${env.SUPABASE_URL}/functions/v1/send-booking-confirmation-reminder`;
          await fetch(notificationUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${env.SUPABASE_ANON_KEY}`,
            },
            body: JSON.stringify({
              type: "owner_confirmation_request",
              bookingConfirmationId: bookingConfirmation.id,
            }),
          });
          logStep("Owner confirmation request notification sent (wish_matched)");
        } catch (emailError) {
          logStep("Warning: Failed to send owner confirmation request", { error: String(emailError) });
        }

        try {
          const resortName = ((booking.listing as Record<string, unknown>)?.property as Record<string, unknown>)?.resort_name as string | undefined;
          await supabase.functions.invoke("notification-dispatcher", {
            body: {
              type_key: "wish_owner_confirming",
              user_id: booking.renter_id,
              payload: {
                title: "Owner confirming your booking",
                message: resortName
                  ? `Your Wish-Matched booking at ${resortName} is waiting on the owner's resort confirmation. We'll notify you as soon as they confirm.`
                  : "Your Wish-Matched booking is waiting on the owner's resort confirmation. We'll notify you as soon as they confirm.",
                booking_id: booking.id,
                listing_id: booking.listing_id,
                deadline: ownerConfirmationDeadline.toISOString(),
              },
            },
          });
          logStep("Wish-Matched traveler notification dispatched", { renterId: booking.renter_id });
        } catch (dispatchError) {
          logStep("Warning: Failed to dispatch wish_owner_confirming", { error: String(dispatchError) });
        }
      } else {
        logStep("Skipping owner-confirmation email — booking is pre_booked");
      }
    }

    // Checkin confirmation
    const checkInDate = booking.listing?.check_in_date;
    if (checkInDate) {
      const checkinDeadline = getCheckinConfirmationDeadline(checkInDate);
      const { error: checkinError } = await supabase
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

    // Guarantee fund (3% of commission)
    const guaranteeFundContribution = Math.round(booking.rav_commission * 0.03 * 100) / 100;
    const { error: fundError } = await supabase
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

    // Traveler confirmation email
    try {
      const resortName = booking.listing?.property?.resort_name || "Your Resort";
      const location = booking.listing?.property?.location || "";
      const checkInStr = new Date(booking.listing?.check_in_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const checkOutStr = new Date(booking.listing?.check_out_date).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      const nights = Math.ceil(
        (new Date(booking.listing?.check_out_date).getTime() -
          new Date(booking.listing?.check_in_date).getTime()) /
          (1000 * 60 * 60 * 24),
      );
      const unitType = booking.listing?.unit_type || "Standard";

      const { data: travelerProfile } = await supabase
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
              ${detailRow("Dates", `${checkInStr} – ${checkOutStr}`)}
              ${detailRow("Duration", `${nights} night${nights !== 1 ? "s" : ""}`)}
              ${detailRow("Total Paid", `$${booking.total_amount?.toLocaleString()}`)}
            </div>
            <p>The property owner will confirm your reservation with the resort shortly. We'll notify you once that's complete.</p>
            <p>You can also share this with your travel companions and start planning your trip!</p>

            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
            <p style="font-size: 12px; color: #4a5568; margin: 0 0 12px 0; font-weight: 600;">Important information about your booking</p>
            ${disclaimerHtml("8.4")}
            ${disclaimerHtml("8.5")}
            ${disclaimerHtml("8.8")}
          `,
          cta: {
            label: "View My Booking",
            url: `https://rentavacation.lovable.app/booking-success?booking_id=${bookingId}`,
          },
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
        },
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 },
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
}
