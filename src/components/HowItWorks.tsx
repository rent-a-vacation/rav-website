import { Search, Calendar, Key, DollarSign, Home, Shield, MessageSquare, Gavel, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const renterSteps = [
  {
    icon: Search,
    title: "Browse or Make an Offer",
    description: "Search owner-listed timeshare rentals across 117+ resorts, or send an Offer on properties open for flexible pricing.",
  },
  {
    icon: Send,
    title: "Post Your Travel Plans",
    description: "Tell us where and when you want to travel. Owners will send you personalized proposals — you pick the best offer.",
  },
  {
    icon: MessageSquare,
    title: "Deal Direct with Owners",
    description: "No middlemen. Connect directly with verified timeshare owners to ask questions and finalize your booking.",
  },
  {
    icon: Key,
    title: "Enjoy Your Stay",
    description: "Check in at the resort and enjoy your luxury vacation at 20-40% less than booking through the resort.",
  },
];

const ownerSteps = [
  {
    icon: Home,
    title: "List Your Property",
    description: "Create a free listing in minutes. Add photos, details, and set your price — or open it up for bidding.",
  },
  {
    icon: Gavel,
    title: "Accept or Send Offers",
    description: "Open your listing for flexible pricing, or send Offers on renter Wishes with your property.",
  },
  {
    icon: Shield,
    title: "Get Verified",
    description: "Our team verifies your ownership to build trust with renters and protect your listing.",
  },
  {
    icon: DollarSign,
    title: "Earn More Money",
    description: "Set your price or let the market decide. Get paid securely and offset those maintenance fees.",
  },
];

const HowItWorks = () => {
  const [activeTab, setActiveTab] = useState<"renters" | "owners">("renters");
  const steps = activeTab === "renters" ? renterSteps : ownerSteps;

  return (
    <section className="py-14 md:py-20 bg-gradient-warm border-t border-border/60">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-10 md:mb-12 max-w-2xl mx-auto">
          <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-3">
            How Direct-from-Owner Rentals Work
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Skip the resort markup. Rent directly from verified owners, bid on listings, 
            or post your travel needs and let owners compete for your booking.
          </p>

          {/* Tab Toggle */}
          <div className="inline-flex bg-muted p-1 rounded-xl">
            <button
              onClick={() => setActiveTab("renters")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "renters"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Renters
            </button>
            <button
              onClick={() => setActiveTab("owners")}
              className={`px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === "owners"
                  ? "bg-card text-foreground shadow-card"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              For Owners
            </button>
          </div>
        </div>

        {/* Steps Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {steps.map((step, index) => (
            <div
              key={index}
              className="relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300"
            >
              {/* Step Number */}
              <div className="absolute -top-3 -left-3 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>
              
              {/* Icon */}
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                <step.icon className="w-7 h-7 text-primary" />
              </div>

              {/* Content */}
              <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {step.description}
              </p>

              {/* Connector Line (except last) */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-1/2 -right-4 w-8 h-0.5 bg-border" />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link to={activeTab === "renters" ? "/rentals" : "/list-property"}>
            <Button variant="hero" size="xl">
              {activeTab === "renters" ? "Start Searching" : "List Your Property"}
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
