import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useAuth } from "@/hooks/useAuth";
import { useTextChat } from "@/hooks/useTextChat";
import { TextChatButton } from "@/components/TextChatButton";
import { TextChatPanel } from "@/components/TextChatPanel";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import {
  Search,
  Key,
  DollarSign,
  Home,
  Shield,
  MessageSquare,
  CreditCard,
  CheckCircle,
  ArrowRight,
  Users,
  Star,
  Clock,
  Percent,
  TrendingUp,
  Quote,
} from "lucide-react";

const travelerSteps = [
  {
    icon: Users,
    title: "Sign Up & Get Approved",
    description:
      "Create a free account in seconds. Our team reviews new accounts quickly — you'll receive an approval email, usually within 24 hours.",
  },
  {
    icon: Search,
    title: "Search & Discover",
    description:
      "Browse timeshare rentals at resorts by Marriott, Hilton, Disney, and more. Use text or voice search to find properties by location, dates, price, and amenities.",
  },
  {
    icon: MessageSquare,
    title: "Connect with Owners",
    description:
      "Message hosts directly through our secure platform. Ask questions, confirm details, and finalize your booking with confidence.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description:
      "Pay securely through Rent-A-Vacation. Your payment is protected in escrow until you check in, giving you peace of mind.",
  },
  {
    icon: Key,
    title: "Enjoy Your Stay",
    description:
      "Check in at the resort just like any other guest. Enjoy all resort amenities, pools, restaurants, and activities.",
  },
];

const ownerSteps = [
  {
    icon: Home,
    title: "List Your Property",
    description:
      "Create a free listing in minutes. Add photos, details about your unit, set your price and availability calendar.",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description:
      "Our team verifies your ownership documents to build trust with renters and protect your listing from fraud.",
  },
  {
    icon: MessageSquare,
    title: "Manage Inquiries",
    description:
      "Respond to renter messages, accept or decline booking requests, and manage your calendar all in one dashboard.",
  },
  {
    icon: CreditCard,
    title: "Receive Bookings",
    description:
      "When a renter books, you'll be notified immediately. Review the booking details and prepare for your guest.",
  },
  {
    icon: DollarSign,
    title: "Get Paid",
    description:
      "Receive secure payments directly to your bank account. Offset your maintenance fees and earn extra income.",
  },
];

const pricingItems = [
  {
    label: "Listing Your Property",
    detail: "Free",
    description: "Create and publish your listing at no cost. No monthly fees, no hidden charges.",
  },
  {
    label: "Platform Commission",
    detail: "15%",
    description: "A service fee on successful bookings covers payment processing, customer support, and platform maintenance.",
  },
  {
    label: "Pro Owner Tier",
    detail: "13%",
    description: "Pro owners ($10/mo) get a 2% commission discount, up to 10 listings, and 25 voice searches per day.",
  },
  {
    label: "Business Owner Tier",
    detail: "10%",
    description: "Business owners ($25/mo) get a 5% commission discount, unlimited listings, and unlimited voice searches.",
  },
];

const successStories = [
  {
    quote: "I was paying $1,800/year in maintenance fees and barely using my week. Now I rent it out and cover most of those fees. It's a game-changer.",
    name: "Michael R.",
    role: "Hilton Grand Vacations Owner",
    metric: "Covers 80% of maintenance fees",
  },
  {
    quote: "We booked a 2-bedroom suite at a Marriott resort for half the price of a hotel room. The kids loved the full kitchen and pool access.",
    name: "Sarah & David T.",
    role: "Renters from Austin, TX",
    metric: "Saved 55% vs. direct booking",
  },
  {
    quote: "As a Business tier owner with 6 listings, the reduced commission really adds up. The platform makes managing everything easy.",
    name: "Jennifer L.",
    role: "Multi-property Owner",
    metric: "Earning $12K+/year from timeshare",
  },
];

const faqs = [
  {
    question: "Is it really safe to rent from a stranger?",
    answer:
      "Absolutely! All our owners are verified, payments are secured through our platform, and you're protected by our satisfaction guarantee.",
  },
  {
    question: "How much can I save compared to booking directly?",
    answer:
      "On average, our renters save 50-70% compared to booking the same room directly through the resort.",
  },
  {
    question: "What if something goes wrong with my booking?",
    answer:
      "Our customer support team is available 24/7. If there's any issue, we'll work to resolve it or provide a full refund.",
  },
  {
    question: "Can I really access all resort amenities?",
    answer:
      "Yes! When you rent a timeshare, you're a guest of the owner and have full access to all resort amenities just like any other guest.",
  },
];

const HowItWorksPage = () => {
  usePageMeta({
    title: 'How It Works',
    description: 'Learn how to rent vacation properties at up to 70% off through Rent-A-Vacation marketplace.',
    canonicalPath: '/how-it-works',
  });
  const location = useLocation();
  const { user } = useAuth();
  const isAuthenticated = !!user;
  const [chatOpen, setChatOpen] = useState(false);
  const {
    messages: chatMessages,
    status: chatStatus,
    error: chatError,
    sendMessage: sendChatMessage,
    clearHistory: clearChatHistory,
  } = useTextChat({ context: "general" });

  // Scroll to hash section on page load or hash change
  useEffect(() => {
    if (location.hash) {
      const id = location.hash.replace("#", "");
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            How Rent-A-Vacation Works
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Whether you're looking to book an amazing vacation or earn from your
            timeshare, we make it simple, secure, and rewarding.
          </p>
          <TextChatButton
            onClick={() => setChatOpen(true)}
            isOpen={chatOpen}
            disabled={!isAuthenticated}
            disabledReason={!isAuthenticated ? "Sign in to ask RAVIO" : undefined}
          />
        </div>
      </section>

      {/* For Renters */}
      <section id="for-travelers" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              For Renters
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Book Your Dream Vacation
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Save up to 70% on luxury resort stays by renting directly from timeshare owners
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {travelerSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < travelerSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/rentals">
              <Button size="lg">
                Browse Rentals
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For Owners */}
      <section id="for-owners" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4">
              For Owners
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Earn From Your Timeshare
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Turn your unused weeks into income. Offset maintenance fees and more.
            </p>
          </div>

          <div className="grid md:grid-cols-5 gap-8">
            {ownerSteps.map((step, index) => (
              <div key={index} className="relative text-center">
                <div className="w-16 h-16 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-accent" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-accent text-accent-foreground flex items-center justify-center font-bold text-sm">
                  {index + 1}
                </div>
                <h3 className="font-display font-semibold text-foreground mb-2">
                  {step.title}
                </h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {index < ownerSteps.length - 1 && (
                  <ArrowRight className="hidden md:block absolute top-8 -right-4 w-6 h-6 text-muted-foreground/30" />
                )}
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/list-property">
              <Button size="lg" variant="outline">
                List Your Property
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing & Fees */}
      <section id="pricing" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium mb-4">
              Transparent Pricing
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Pricing & Fees
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              No surprises. No hidden fees. Here's exactly what it costs to use Rent-A-Vacation.
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            {/* Renter pricing */}
            <div className="bg-card rounded-xl p-8 shadow-card mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  For Renters
                </h3>
              </div>
              <div className="grid sm:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-display text-2xl font-bold text-primary mb-1">Free</div>
                  <p className="font-medium text-foreground mb-1">Browsing & Searching</p>
                  <p className="text-sm text-muted-foreground">Browse all listings, use voice search, and save favorites at no cost.</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="font-display text-2xl font-bold text-primary mb-1">Transparent</div>
                  <p className="font-medium text-foreground mb-1">Pricing & Fees</p>
                  <p className="text-sm text-muted-foreground">See the nightly rate, service fee, and total upfront — no hidden charges at checkout.</p>
                </div>
              </div>
            </div>

            {/* Owner pricing */}
            <div className="bg-card rounded-xl p-8 shadow-card">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                  <Percent className="w-5 h-5 text-accent" />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">
                  For Owners
                </h3>
              </div>
              <div className="space-y-4">
                {pricingItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                    <div className="font-display text-xl font-bold text-primary min-w-[60px]">
                      {item.detail}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{item.label}</p>
                      <p className="text-sm text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-sm text-muted-foreground mt-6 text-center">
                Questions about pricing?{" "}
                <Link to="/contact" className="text-primary hover:underline">Contact us</Link>
                {" "}or view{" "}
                <Link to="/faq" className="text-primary hover:underline">FAQs</Link>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section id="stats" className="py-16 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <Home className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="font-display text-4xl font-bold mb-1">117</div>
              <div className="opacity-80">Partner Resorts</div>
            </div>
            <div>
              <Users className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="font-display text-4xl font-bold mb-1">3</div>
              <div className="opacity-80">Major Brands</div>
            </div>
            <div>
              <Star className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="font-display text-4xl font-bold mb-1">351</div>
              <div className="opacity-80">Unit Types</div>
            </div>
            <div>
              <Clock className="w-10 h-10 mx-auto mb-3 opacity-80" />
              <div className="font-display text-4xl font-bold mb-1">10+</div>
              <div className="opacity-80">Countries</div>
            </div>
          </div>
        </div>
      </section>

      {/* Success Stories */}
      <section id="success-stories" className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-accent/20 text-accent-foreground rounded-full text-sm font-medium mb-4">
              Real Results
            </span>
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Success Stories
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Hear from owners and renters who are making the most of Rent-A-Vacation.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {successStories.map((story, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow">
                <Quote className="w-8 h-8 text-primary/30 mb-4" />
                <p className="text-muted-foreground mb-6 italic leading-relaxed">
                  "{story.quote}"
                </p>
                <div className="border-t pt-4">
                  <p className="font-semibold text-foreground">{story.name}</p>
                  <p className="text-sm text-muted-foreground">{story.role}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <TrendingUp className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{story.metric}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link to="/list-property">
              <Button size="lg">
                Start Your Success Story
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section id="faqs" className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card rounded-xl p-6 shadow-card">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-foreground mb-2">{faq.question}</h3>
                    <p className="text-muted-foreground">{faq.answer}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="text-center mt-8">
            <Link to="/faq">
              <Button variant="link">View All FAQs →</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />

      {/* Text Chat Panel */}
      <TextChatPanel
        open={chatOpen}
        onOpenChange={setChatOpen}
        messages={chatMessages}
        status={chatStatus}
        error={chatError}
        context="general"
        onSendMessage={sendChatMessage}
        onClearHistory={clearChatHistory}
      />
    </div>
  );
};

export default HowItWorksPage;
