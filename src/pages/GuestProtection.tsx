import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DisclaimerBlock } from "@/components/legal/DisclaimerBlock";
import { ShieldCheck, Clock, Banknote, AlertCircle } from "lucide-react";

const GuestProtection = () => {
  usePageMeta({
    title: "RAV Guest Protection — full refund within 5 business days for Host cancellations",
    description:
      "If your Host cancels within 30 days of check-in, RAV refunds 100% of your booking total within 5 business days. The Pay Safe (Stripe-held escrow) architecture means your funds never sit in a RAV bank account.",
    canonicalPath: "/guest-protection",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-3">
              <ShieldCheck className="h-10 w-10 text-primary" />
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight">
                RAV Guest Protection
              </h1>
            </div>
            <p className="text-muted-foreground text-lg mb-10">
              The simple promise: if your Host cancels close to check-in, you get every dollar back fast.
            </p>

            <section className="mb-10 rounded-xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                What this covers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">When</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Host cancellation within 30 days of check-in.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Banknote className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">What you get</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    100% refund of your booking total. RAV's platform fee is also refunded for Host
                    cancellations and verified fraud.
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    <p className="font-semibold text-foreground">How fast</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Within 5 business days. Refund timing on your card is governed by Stripe + the
                    card network.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                Why we can promise this
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Renter funds never sit in a Rent-A-Vacation bank account. Our Pay Safe service routes
                payments through Stripe — a licensed payment processor — and Stripe holds the funds
                until the Host has earned them (after check-in). If the Host cancels, Stripe issues a
                refund directly back to your original payment method.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                We don't have to wait for the Host to forward your money back. Stripe never released
                it to them.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                What this does NOT cover
              </h2>
              <div className="rounded-lg border border-amber-500/30 bg-amber-50 dark:bg-amber-950/20 p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="space-y-2 text-sm">
                  <p className="text-foreground font-medium">
                    Renter-initiated cancellations follow the listing's cancellation policy (Flexible /
                    Moderate / Strict / Super Strict).
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    The policy is shown on every listing page and on the Checkout screen before you
                    pay. Read it before booking. If you need to cancel, the refund amount depends on
                    when you cancel relative to check-in — that's the Host's decision per the policy
                    they chose, not RAV's.
                  </p>
                  <p className="text-muted-foreground leading-relaxed">
                    Issues with the property after check-in (cleanliness, accuracy, access, etc.) are
                    handled through the dispute system — open an issue from your booking page and our
                    team will investigate.
                  </p>
                </div>
              </div>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                The official language
              </h2>
              <DisclaimerBlock id="8.5" variant="full" className="bg-muted/30" />
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                Questions?
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Email{" "}
                <a href="mailto:support@rent-a-vacation.com" className="text-primary underline hover:text-primary/80">
                  support@rent-a-vacation.com
                </a>{" "}
                or open a chat from any page. For the full terms governing your booking, see our{" "}
                <a href="/terms" className="text-primary underline hover:text-primary/80">
                  Terms of Service
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default GuestProtection;
