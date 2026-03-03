import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ChevronDown, Search, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { usePageMeta } from "@/hooks/usePageMeta";

const faqCategories = [
  {
    name: "For Renters",
    faqs: [
      {
        question: "What is a timeshare rental?",
        answer:
          "A timeshare rental is when an owner of vacation property (like a resort condo) rents out their allotted time to renters. Instead of booking directly with the resort at full price, you rent from an owner at a significant discount—often 50-70% less.",
      },
      {
        question: "Is it safe to rent from a stranger?",
        answer:
          "Absolutely! All our property owners go through a verification process. We verify their ownership documents and identity. Additionally, all payments are processed through our secure platform, and you're protected by our satisfaction guarantee.",
      },
      {
        question: "How much can I save compared to booking directly?",
        answer:
          "On average, our renters save 50-70% compared to booking the same room directly through the resort. This is because owners have already paid for their timeshare and are looking to recoup costs, not make a profit.",
      },
      {
        question: "Do I get access to all resort amenities?",
        answer:
          "Yes! When you rent a timeshare, you're a guest of the owner and have full access to all resort amenities including pools, restaurants, fitness centers, and activities—just like any other guest.",
      },
      {
        question: "What if something goes wrong with my booking?",
        answer:
          "Our customer support team is available 24/7. If there's any issue with your booking, we'll work to resolve it quickly. If we can't, you're entitled to a full refund under our satisfaction guarantee.",
      },
      {
        question: "How do I pay for my booking?",
        answer:
          "All payments are processed securely through our platform using credit card or debit card. Your payment is held securely until you check in, giving you peace of mind.",
      },
      {
        question: "Can I cancel my booking?",
        answer:
          "Cancellation policies vary by listing. Most owners offer free cancellation up to 30-60 days before check-in. Always check the specific listing's cancellation policy before booking.",
      },
      {
        question: "Why can't I use voice search?",
        answer:
          "Voice search requires a logged-in, approved account. If the microphone icon is disabled, sign in first. If your account is pending approval, you'll need to wait for the approval email. Voice search limits depend on your membership tier: Free members get 5 searches per day, Plus/Pro get 25 per day, and Premium/Business members get unlimited searches. If you've hit your daily limit, try again tomorrow or use the manual text search which has no limits.",
      },
      {
        question: "What is the daily voice search limit?",
        answer:
          "Voice search limits depend on your membership tier. Free members can perform up to 5 voice searches per day, Plus and Pro members get 25 per day, and Premium and Business members enjoy unlimited voice searches. Limits reset at midnight. A badge near the search bar shows your remaining searches. This tiered approach helps us manage costs while giving everyone fair access to this premium feature.",
      },
    ],
  },
  {
    name: "For Owners",
    faqs: [
      {
        question: "How do I list my timeshare?",
        answer:
          "Listing is free and takes just a few minutes. Create an account, provide your property details, upload photos, and set your pricing and availability. Our team will verify your ownership (usually within 24-48 hours) and then your listing goes live.",
      },
      {
        question: "What does it cost to list my property?",
        answer:
          "Creating a listing is completely free. We charge a 15% service fee when you successfully receive a booking (with tiered discounts for Pro and Business members). There are no upfront costs or monthly fees.",
      },
      {
        question: "How do I get paid?",
        answer:
          "After your guest checks in, payment is released to your bank account via direct deposit. Payments typically arrive within 3-5 business days after check-in.",
      },
      {
        question: "Can I set my own prices?",
        answer:
          "Absolutely! You have full control over your nightly rate. We provide pricing suggestions based on similar properties in your area, but the final price is always your choice.",
      },
      {
        question: "What documents do I need for verification?",
        answer:
          "We typically need proof of ownership (like a deed or confirmation statement), a government-issued ID, and sometimes recent maintenance fee statements. Our team will guide you through the process.",
      },
      {
        question: "Do I have to accept every booking request?",
        answer:
          "No, you have full control. You can review each booking request and choose to accept or decline. You can also set up instant booking for qualified renters if you prefer.",
      },
    ],
  },
  {
    name: "Payments & Security",
    faqs: [
      {
        question: "How are payments protected?",
        answer:
          "All payments are processed through our secure, PCI-compliant payment system. Funds are held in escrow until check-in, protecting both renters and owners.",
      },
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept all major credit cards (Visa, Mastercard, American Express, Discover) as well as debit cards. We do not accept cash, checks, or wire transfers.",
      },
      {
        question: "Is my personal information safe?",
        answer:
          "Yes, we take data security seriously. We use industry-standard encryption, secure servers, and never share your personal information with third parties without your consent.",
      },
      {
        question: "What is your satisfaction guarantee?",
        answer:
          "If your accommodation doesn't match the listing or there's a significant issue that can't be resolved, we'll provide a full refund or help you find alternative accommodation.",
      },
    ],
  },
  {
    name: "Account & Technical",
    faqs: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Sign Up' at the top of any page and register with your email address. After signing up, your account will be reviewed by our team. You'll receive an email once approved (typically within 24 hours). Until then, you'll see a 'Pending Approval' page when you log in.",
      },
      {
        question: "I forgot my password. What do I do?",
        answer:
          "Click 'Forgot Password' on the login page and enter your email address. We'll send you a link to reset your password.",
      },
      {
        question: "How do I contact customer support?",
        answer:
          "You can reach us via email at support@rent-a-vacation.com, by phone at 1-800-RAV-0800, or through the Contact Us page on our website. We're available 24/7.",
      },
    ],
  },
];

const FAQ = () => {
  usePageMeta('FAQ', 'Frequently asked questions about renting and listing vacation properties on Rent-A-Vacation.');

  const [openItems, setOpenItems] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("For Renters");

  // Inject FAQPage JSON-LD structured data
  useEffect(() => {
    const allFaqs = faqCategories.flatMap((cat) => cat.faqs);
    const schema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: allFaqs.map((faq) => ({
        "@type": "Question",
        name: faq.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: faq.answer,
        },
      })),
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.id = "faq-schema";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById("faq-schema");
      if (existing) existing.remove();
    };
  }, []);

  const toggleItem = (question: string) => {
    setOpenItems((prev) =>
      prev.includes(question)
        ? prev.filter((q) => q !== question)
        : [...prev, question]
    );
  };

  const filteredFaqs = faqCategories
    .find((cat) => cat.name === activeCategory)
    ?.faqs.filter(
      (faq) =>
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Frequently Asked Questions
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Find answers to common questions about renting and listing vacation properties
          </p>
          <div className="max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search FAQs..."
              className="pl-12 h-12"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Category Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 bg-card rounded-xl p-4 shadow-card">
                <h3 className="font-semibold mb-4">Categories</h3>
                <nav className="space-y-1">
                  {faqCategories.map((category) => (
                    <button
                      key={category.name}
                      onClick={() => setActiveCategory(category.name)}
                      className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                        activeCategory === category.name
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* FAQ List */}
            <div className="lg:col-span-3">
              <h2 className="font-display text-2xl font-bold text-foreground mb-6">
                {activeCategory}
              </h2>
              <div className="space-y-4">
                {filteredFaqs?.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-xl shadow-card overflow-hidden"
                  >
                    <button
                      onClick={() => toggleItem(faq.question)}
                      className="w-full flex items-center justify-between p-6 text-left"
                    >
                      <span className="font-medium text-foreground pr-4">
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-5 h-5 text-muted-foreground flex-shrink-0 transition-transform ${
                          openItems.includes(faq.question) ? "rotate-180" : ""
                        }`}
                      />
                    </button>
                    {openItems.includes(faq.question) && (
                      <div className="px-6 pb-6 text-muted-foreground animate-fade-in">
                        {faq.answer}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {filteredFaqs?.length === 0 && (
                <div className="text-center py-12 bg-card rounded-xl">
                  <p className="text-muted-foreground mb-4">
                    No FAQs found matching your search.
                  </p>
                  <Button variant="outline" onClick={() => setSearchQuery("")}>
                    Clear Search
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="w-12 h-12 mx-auto text-primary mb-4" />
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Still Have Questions?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Our support team is here to help. Reach out and we'll get back to you
            as soon as possible.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/contact">
              <Button>
                <MessageSquare className="w-4 h-4 mr-2" />
                Contact Support
              </Button>
            </Link>
            <Link to="/how-it-works">
              <Button variant="outline">Learn How It Works</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
