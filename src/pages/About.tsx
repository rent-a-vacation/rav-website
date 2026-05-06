import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { DisclaimerBlock } from "@/components/legal/DisclaimerBlock";

const About = () => {
  usePageMeta({
    title: "About Rent-A-Vacation",
    description:
      "Rent-A-Vacation is a marketplace that connects timeshare owners with travelers — rentals only, never sales. Independent of any vacation-club brand.",
    canonicalPath: "/about",
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
              About Rent-A-Vacation
            </h1>
            <p className="text-muted-foreground mb-10">
              The marketplace for renting unused timeshare weeks and points — directly from the owners.
            </p>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                What we do
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Rent-A-Vacation lists timeshare rental periods from individual owners and lets travelers
                book them directly. Owners post a Listing or accept Offers on a Wish; travelers browse,
                compare, and book at prices set by the owner. We are an independent secondary
                marketplace — not affiliated with, endorsed by, or sponsored by any vacation-club brand
                whose properties may be listed here.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                Rent-A-Vacation facilitates rentals only. We do not facilitate, broker, or assist in the
                purchase, sale, transfer, or resale of timeshare interests, and we are not a timeshare
                exit company.
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                How payments work — Pay Safe
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-3">
                Rent-A-Vacation never holds renter funds in its own bank account. Our Pay Safe service
                routes payments through Stripe, a licensed payment processor. Funds remain in Stripe's
                custody for the entire booking lifecycle and are released to the host only after
                check-in (subject to the listing's cancellation policy).
              </p>
            </section>

            <section className="mb-10">
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                Our role — and the limits of it
              </h2>
              <DisclaimerBlock
                id="8.3"
                variant="full"
                className="bg-muted/30"
              />
            </section>

            <section>
              <h2 className="font-display text-2xl font-semibold text-foreground mb-3">
                More information
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                For full terms governing your use of the platform, see our{" "}
                <a href="/terms" className="text-primary underline hover:text-primary/80">
                  Terms of Service
                </a>
                . For privacy, see the{" "}
                <a href="/privacy" className="text-primary underline hover:text-primary/80">
                  Privacy Policy
                </a>
                . Questions: <a href="mailto:support@rent-a-vacation.com" className="text-primary underline hover:text-primary/80">support@rent-a-vacation.com</a>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
