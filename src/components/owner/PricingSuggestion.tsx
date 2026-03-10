import { usePricingSuggestion } from "@/hooks/usePricingSuggestion";
import { useDynamicPricing } from "@/hooks/useDynamicPricing";
import { TrendingUp, TrendingDown, Minus, Clock, Sun, Zap } from "lucide-react";

interface PricingSuggestionProps {
  currentRate: number;
  brand: string | undefined;
  location: string | undefined;
  bedrooms?: number;
  checkInDate?: string;
}

function FactorBadge({ icon: Icon, label, pct }: { icon: typeof Clock; label: string; pct: number }) {
  if (pct === 0) return null;
  const isPositive = pct > 0;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full ${
      isPositive ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
    }`}>
      <Icon className="h-2.5 w-2.5" />
      {label} {isPositive ? "+" : ""}{pct}%
    </span>
  );
}

export function PricingSuggestion({ currentRate, brand, location, bedrooms, checkInDate }: PricingSuggestionProps) {
  const suggestion = usePricingSuggestion(brand, location);
  const { suggestion: dynamic } = useDynamicPricing(brand, location, bedrooms, checkInDate);

  if (!suggestion || currentRate <= 0 || !brand || !location) return null;

  const { avgNightlyRate, minNightlyRate, maxNightlyRate, comparableCount } = suggestion;
  const range = maxNightlyRate - minNightlyRate;

  // Position of current rate within range (0-100%)
  const position = range > 0
    ? Math.max(0, Math.min(100, ((currentRate - minNightlyRate) / range) * 100))
    : 50;

  // Color feedback
  let colorClass: string;
  let Icon: typeof TrendingUp;
  let label: string;

  if (currentRate <= avgNightlyRate * 1.05) {
    colorClass = "text-emerald-600";
    Icon = TrendingDown;
    label = "Competitive price";
  } else if (currentRate <= avgNightlyRate * 1.3) {
    colorClass = "text-amber-600";
    Icon = Minus;
    label = "Above average";
  } else {
    colorClass = "text-red-600";
    Icon = TrendingUp;
    label = "Well above market";
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          SmartPrice range ({comparableCount} listings)
        </p>
        <div className={`flex items-center gap-1 text-xs font-medium ${colorClass}`}>
          <Icon className="h-3 w-3" />
          {label}
        </div>
      </div>

      {/* Range bar */}
      <div className="relative">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>${minNightlyRate}</span>
          <span className="text-foreground font-medium">${avgNightlyRate} avg</span>
          <span>${maxNightlyRate}</span>
        </div>
        <div className="h-2 bg-gradient-to-r from-emerald-200 via-amber-200 to-red-200 rounded-full relative">
          <div
            className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-foreground border-2 border-background shadow-sm"
            style={{ left: `calc(${position}% - 6px)` }}
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your rate: <span className="font-medium text-foreground">${currentRate}/night</span>
      </p>

      {/* Dynamic pricing suggestion */}
      {dynamic && (
        <div className="border-t pt-2 mt-1 space-y-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground">
              Suggested rate
            </p>
            <span className="text-xs font-semibold text-foreground">
              ${dynamic.suggestedRate}/night
            </span>
          </div>

          {/* Factor badges */}
          <div className="flex flex-wrap gap-1">
            <FactorBadge icon={Clock} label="Urgency" pct={dynamic.factors.urgencyPct} />
            <FactorBadge icon={Sun} label="Season" pct={dynamic.factors.seasonalPct} />
            <FactorBadge icon={Zap} label="Demand" pct={dynamic.factors.demandPct} />
          </div>

          <p className="text-[10px] text-muted-foreground">
            RAV SmartPrice — based on booking history, seasonality & demand
            {dynamic.confidence === "low" && " (limited data)"}
          </p>
        </div>
      )}
    </div>
  );
}
