import { Shield, Users, Star, Gavel, Clock, Award, Building2, Globe } from "lucide-react";

const badges = [
  {
    icon: Shield,
    value: "100%",
    label: "Direct from Owners",
  },
  {
    icon: Building2,
    value: "117",
    label: "Partner Resorts",
  },
  {
    icon: Gavel,
    value: "Open",
    label: "Bidding Marketplace",
  },
  {
    icon: Globe,
    value: "10+",
    label: "Countries",
  },
  {
    icon: Award,
    value: "Verified",
    label: "Owner Identity",
  },
  {
    icon: Star,
    value: "20-40%",
    label: "Savings vs. Resort",
  },
];

const TrustBadges = () => {
  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="text-center group">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <badge.icon className="w-7 h-7 opacity-90" />
              </div>
              <div className="font-display text-2xl md:text-3xl font-bold mb-1">{badge.value}</div>
              <div className="text-sm opacity-80">{badge.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
