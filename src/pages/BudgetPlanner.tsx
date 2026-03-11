import { useState, useEffect } from 'react';
import { Wallet, Plane, Car } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePageMeta } from '@/hooks/usePageMeta';
import { trackEvent } from '@/lib/posthog';
import {
  calculateTripBudget,
  BUDGET_DESTINATIONS,
  type SpendingLevel,
  type BudgetResult,
} from '@/lib/budgetPlanner';

const SPENDING_LEVELS: { value: SpendingLevel; label: string }[] = [
  { value: 'budget', label: 'Budget-Friendly' },
  { value: 'moderate', label: 'Moderate' },
  { value: 'splurge', label: 'Splurge' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Accommodation: 'bg-blue-500',
  Flights: 'bg-purple-500',
  'Car Rental': 'bg-orange-500',
  Dining: 'bg-green-500',
  Activities: 'bg-amber-500',
  'Local Transport': 'bg-cyan-500',
  'Shopping & Misc': 'bg-pink-500',
};

export default function BudgetPlanner() {
  usePageMeta(
    'Trip Budget Planner — RAV Tools',
    'Plan your total vacation budget including flights, dining, activities, and accommodation.',
  );

  const [destination, setDestination] = useState('florida');
  const [nights, setNights] = useState(7);
  const [travelers, setTravelers] = useState(2);
  const [accommodationCost, setAccommodationCost] = useState(1200);
  const [spendingLevel, setSpendingLevel] = useState<SpendingLevel>('moderate');
  const [includeFlights, setIncludeFlights] = useState(true);
  const [includeCarRental, setIncludeCarRental] = useState(false);
  const [result, setResult] = useState<BudgetResult | null>(null);

  useEffect(() => {
    setResult(
      calculateTripBudget({
        destination,
        nights,
        travelers,
        accommodationCost,
        spendingLevel,
        includeFlights,
        includeCarRental,
      }),
    );
  }, [destination, nights, travelers, accommodationCost, spendingLevel, includeFlights, includeCarRental]);

  useEffect(() => {
    if (result) {
      trackEvent('tool_budget_planner_completed', {
        destination,
        nights,
        travelers,
        spending_level: spendingLevel,
        total_trip: result.totalTrip,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.totalTrip]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Wallet className="h-4 w-4" />
              Trip Budget Planner
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              What will your whole trip cost?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Plan beyond accommodation — estimate flights, dining, activities, and more
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Inputs */}
            <Card>
              <CardHeader><CardTitle>Trip Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {BUDGET_DESTINATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="bp-nights">Nights</Label>
                    <Input id="bp-nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bp-travelers">Travelers</Label>
                    <Input id="bp-travelers" type="number" min={1} max={10} value={travelers} onChange={(e) => setTravelers(Number(e.target.value) || 1)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bp-accom">Accommodation Total ($)</Label>
                  <Input id="bp-accom" type="number" min={0} value={accommodationCost} onChange={(e) => setAccommodationCost(Number(e.target.value) || 0)} />
                </div>
                <div className="space-y-2">
                  <Label>Spending Style</Label>
                  <Select value={spendingLevel} onValueChange={(v) => setSpendingLevel(v as SpendingLevel)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SPENDING_LEVELS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Plane className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="flights">Include flights?</Label>
                    </div>
                    <Switch id="flights" checked={includeFlights} onCheckedChange={setIncludeFlights} />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Car className="h-4 w-4 text-muted-foreground" />
                      <Label htmlFor="car">Include car rental?</Label>
                    </div>
                    <Switch id="car" checked={includeCarRental} onCheckedChange={setIncludeCarRental} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            {result && (
              <div className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Total Trip Budget</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center pb-4 border-b mb-4">
                      <p className="text-4xl font-bold text-foreground">${result.totalTrip.toLocaleString()}</p>
                      <p className="text-sm text-muted-foreground">
                        ${result.perPerson.toLocaleString()}/person &middot; ${result.perDay.toLocaleString()}/day
                      </p>
                    </div>

                    {/* Stacked bar visual */}
                    <div className="flex rounded-full overflow-hidden h-4 mb-4">
                      {result.categories.map((cat) => (
                        <div
                          key={cat.label}
                          className={`${CATEGORY_COLORS[cat.label] || 'bg-gray-400'} transition-all`}
                          style={{ width: `${cat.percentage}%` }}
                          title={`${cat.label}: ${cat.percentage}%`}
                        />
                      ))}
                    </div>

                    {/* Category breakdown */}
                    <div className="space-y-2">
                      {result.categories.map((cat) => (
                        <div key={cat.label} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${CATEGORY_COLORS[cat.label] || 'bg-gray-400'}`} />
                            <span>{cat.label}</span>
                            <span className="text-xs text-muted-foreground">({cat.percentage}%)</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">${cat.amount.toLocaleString()}</span>
                            <span className="text-xs text-muted-foreground ml-2">${cat.perPerson.toLocaleString()}/pp</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Estimates based on average travel costs for the selected destination and spending level.
            Flight and car rental costs may vary significantly based on booking time and season.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
