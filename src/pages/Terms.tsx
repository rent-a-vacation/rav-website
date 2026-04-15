import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Terms = () => {
  usePageMeta({
    title: 'Terms of Service',
    description: 'Terms and conditions for using Rent-A-Vacation marketplace.',
    canonicalPath: '/terms',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-24 md:pt-28 pb-16 md:pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-3">
              Terms of Service
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: February 2025</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Acceptance of Terms
                </h2>
                <p className="text-muted-foreground mb-4">
                  By accessing or using Rent-A-Vacation's website and services, you agree to be bound
                  by these Terms of Service. If you do not agree to these terms, please do not
                  use our services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. Description of Service
                </h2>
                <p className="text-muted-foreground mb-4">
                  Rent-A-Vacation provides an online marketplace connecting vacation property owners
                  (timeshare owners) with travelers seeking accommodations. We facilitate the
                  listing, discovery, and booking of vacation rentals but do not own or operate
                  any properties ourselves.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. User Accounts
                </h2>
                <p className="text-muted-foreground mb-4">
                  To use certain features of our service, you must create an account. You are
                  responsible for maintaining the confidentiality of your account credentials
                  and for all activities that occur under your account.
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>You must provide accurate and complete information</li>
                  <li>You must be at least 18 years old to create an account</li>
                  <li>You are responsible for all activity under your account</li>
                  <li>You must notify us immediately of any unauthorized use</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Property Listings
                </h2>
                <p className="text-muted-foreground mb-4">
                  Property owners are solely responsible for the accuracy of their listings,
                  including descriptions, photos, pricing, and availability. Rent-A-Vacation reserves
                  the right to remove any listing that violates these terms or our policies.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. Bookings and Payments
                </h2>
                <p className="text-muted-foreground mb-4">
                  All bookings made through Rent-A-Vacation are subject to the owner's approval
                  (unless instant booking is enabled). Payments are processed securely through
                  our platform and held until check-in confirmation.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  6. Cancellation Policy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Cancellation policies are set by individual property owners. Please review
                  the specific cancellation policy for each listing before booking. Standard
                  policies range from flexible to strict.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  7. Prohibited Activities
                </h2>
                <p className="text-muted-foreground mb-4">Users may not:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide false or misleading information</li>
                  <li>Use the service for any illegal purpose</li>
                  <li>Interfere with or disrupt the service</li>
                  <li>Circumvent our payment system</li>
                  <li>Harass other users or staff</li>
                  <li>Post content that infringes intellectual property rights</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  8. Limitation of Liability
                </h2>
                <p className="text-muted-foreground mb-4">
                  Rent-A-Vacation acts as an intermediary between owners and travelers. We are not
                  responsible for the condition of properties, the conduct of users, or any
                  damages arising from the use of our service beyond what is required by law.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  9. Dispute Resolution
                </h2>
                <p className="text-muted-foreground mb-4">
                  Any disputes between users should first be attempted to be resolved directly.
                  If unsuccessful, Rent-A-Vacation's customer support team can assist with mediation.
                  Unresolved disputes may be subject to binding arbitration.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  10. Changes to Terms
                </h2>
                <p className="text-muted-foreground mb-4">
                  We reserve the right to modify these terms at any time. Users will be
                  notified of significant changes via email or through the platform. Continued
                  use of the service after changes constitutes acceptance.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  11. Contact Information
                </h2>
                <p className="text-muted-foreground mb-4">
                  For questions about these Terms of Service, please contact us at:
                </p>
                <p className="text-muted-foreground">
                  Email: legal@rentavacation.com
                </p>
              </section>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Terms;
