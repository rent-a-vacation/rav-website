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
    label: "Resorts",
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
    <section className="py-12 md:py-14 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-3 md:grid-cols-6 gap-6 md:gap-8">
          {badges.map((badge, index) => (
            <div key={index} className="text-center group">
              <div className="w-12 h-12 md:w-14 md:h-14 mx-auto mb-2 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <badge.icon className="w-6 h-6 md:w-7 md:h-7 opacity-90" />
              </div>
              <div className="font-display text-xl md:text-2xl font-bold leading-tight">{badge.value}</div>
              <div className="text-xs md:text-sm opacity-80 mt-0.5">{badge.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustBadges;
