import { usePricingSuggestion } from "@/hooks/usePricingSuggestion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PricingSuggestionProps {
  currentRate: number;
  brand: string | undefined;
  location: string | undefined;
}

export function PricingSuggestion({ currentRate, brand, location }: PricingSuggestionProps) {
  const suggestion = usePricingSuggestion(brand, location);

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
    // At or below average (+5% tolerance) = green (competitive)
    colorClass = "text-emerald-600";
    Icon = TrendingDown;
    label = "Competitive price";
  } else if (currentRate <= avgNightlyRate * 1.3) {
    // Up to 30% above average = yellow
    colorClass = "text-amber-600";
    Icon = Minus;
    label = "Above average";
  } else {
    // More than 30% above average = red
    colorClass = "text-red-600";
    Icon = TrendingUp;
    label = "Well above market";
  }

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-muted-foreground">
          Market range ({comparableCount} listings)
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
    </div>
  );
}
