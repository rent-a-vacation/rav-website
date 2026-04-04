import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";

const Privacy = () => {
  usePageMeta({
    title: 'Privacy Policy',
    description: 'How Rent-A-Vacation protects your personal data and privacy.',
    canonicalPath: '/privacy',
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-32 pb-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h1 className="font-display text-4xl font-bold text-foreground mb-4">
              Privacy Policy
            </h1>
            <p className="text-muted-foreground mb-8">Last updated: February 2025</p>

            <div className="prose prose-lg max-w-none">
              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  1. Introduction
                </h2>
                <p className="text-muted-foreground mb-4">
                  Rent-A-Vacation ("we," "our," or "us") is committed to protecting your privacy.
                  This Privacy Policy explains how we collect, use, disclose, and safeguard
                  your information when you use our website and services.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  2. Information We Collect
                </h2>
                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                <p className="text-muted-foreground mb-4">
                  When you create an account or make a booking, we collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2 mb-4">
                  <li>Name and email address</li>
                  <li>Phone number</li>
                  <li>Payment information</li>
                  <li>Government-issued ID (for verification)</li>
                  <li>Property ownership documents (for owners)</li>
                </ul>

                <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
                <p className="text-muted-foreground mb-4">
                  When you use our service, we automatically collect:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Device information (browser type, operating system)</li>
                  <li>IP address and location data</li>
                  <li>Usage data (pages visited, time spent)</li>
                  <li>Cookies and similar tracking technologies</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  3. How We Use Your Information
                </h2>
                <p className="text-muted-foreground mb-4">We use your information to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Provide and maintain our services</li>
                  <li>Process transactions and send related information</li>
                  <li>Verify identity and prevent fraud</li>
                  <li>Send you marketing communications (with your consent)</li>
                  <li>Respond to customer support requests</li>
                  <li>Improve our services and develop new features</li>
                  <li>Comply with legal obligations</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  4. Information Sharing
                </h2>
                <p className="text-muted-foreground mb-4">
                  We may share your information with:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>
                    <strong>Other Users:</strong> Property owners and travelers need certain
                    information to complete bookings
                  </li>
                  <li>
                    <strong>Service Providers:</strong> Third parties who help us operate our
                    platform (payment processors, hosting providers)
                  </li>
                  <li>
                    <strong>Legal Requirements:</strong> When required by law or to protect our
                    rights
                  </li>
                </ul>
                <p className="text-muted-foreground mt-4">
                  We do not sell your personal information to third parties.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  5. Data Security
                </h2>
                <p className="text-muted-foreground mb-4">
                  We implement appropriate technical and organizational measures to protect
                  your information, including:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>SSL/TLS encryption for data in transit</li>
                  <li>Encrypted storage for sensitive data</li>
                  <li>Regular security audits</li>
                  <li>Access controls and authentication</li>
                  <li>PCI DSS compliance for payment processing</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  6. Your Rights
                </h2>
                <p className="text-muted-foreground mb-4">You have the right to:</p>
                <ul className="list-disc list-inside text-muted-foreground space-y-2">
                  <li>Access your personal information</li>
                  <li>Correct inaccurate data</li>
                  <li>Request deletion of your data</li>
                  <li>Opt out of marketing communications</li>
                  <li>Export your data in a portable format</li>
                  <li>Withdraw consent where applicable</li>
                </ul>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  7. Cookies
                </h2>
                <p className="text-muted-foreground mb-4">
                  We use cookies and similar technologies to enhance your experience, analyze
                  usage, and deliver personalized content. You can manage cookie preferences
                  through your browser settings.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  8. Data Retention
                </h2>
                <p className="text-muted-foreground mb-4">
                  We retain your information for as long as your account is active or as
                  needed to provide services. We may retain certain information as required
                  by law or for legitimate business purposes.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  9. Children's Privacy
                </h2>
                <p className="text-muted-foreground mb-4">
                  Our services are not intended for users under 18 years of age. We do not
                  knowingly collect information from children.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  10. International Transfers
                </h2>
                <p className="text-muted-foreground mb-4">
                  Your information may be transferred to and processed in countries other
                  than your own. We ensure appropriate safeguards are in place for such
                  transfers.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  11. Changes to This Policy
                </h2>
                <p className="text-muted-foreground mb-4">
                  We may update this Privacy Policy from time to time. We will notify you of
                  significant changes via email or through our platform.
                </p>
              </section>

              <section className="mb-8">
                <h2 className="font-display text-2xl font-semibold text-foreground mb-4">
                  12. Contact Us
                </h2>
                <p className="text-muted-foreground mb-4">
                  For questions about this Privacy Policy or our data practices, contact us at:
                </p>
                <p className="text-muted-foreground">
                  Email: privacy@rentavacation.com
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

export default Privacy;
