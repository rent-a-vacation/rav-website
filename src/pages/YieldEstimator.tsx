import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, BarChart3 } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  estimateYield,
  YIELD_REGIONS,
  VACATION_CLUB_BRANDS,
  UNIT_TYPES,
  type YieldResult,
} from '@/lib/yieldEstimator';

export default function YieldEstimator() {
  usePageMeta(
    'Rental Yield Estimator — RAV Tools',
    'Project your annual timeshare rental income based on your resort, unit type, and local demand.',
  );

  const [brand, setBrand] = useState('');
  const [unitType, setUnitType] = useState('');
  const [weeksOwned, setWeeksOwned] = useState(2);
  const [region, setRegion] = useState('florida');
  const [maintenanceFees, setMaintenanceFees] = useState(1500);
  const [result, setResult] = useState<YieldResult | null>(null);

  useEffect(() => {
    setResult(estimateYield({ brand, unitType, weeksOwned, region, annualMaintenanceFees: maintenanceFees }));
  }, [brand, unitType, weeksOwned, region, maintenanceFees]);

  const isComplete = brand && unitType && weeksOwned > 0 && maintenanceFees > 0;

  useEffect(() => {
    if (isComplete && result) {
      trackEvent('tool_yield_estimator_completed', {
        brand,
        unit_type: unitType,
        region,
        roi: result.roi,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.roi]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-5xl mx-auto px-4 py-12">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <DollarSign className="h-4 w-4" />
              Rental Yield Estimator
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
              How much could your timeshare earn?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Estimate your annual rental income based on your resort brand, unit type, and market demand
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Form */}
            <Card>
              <CardHeader><CardTitle>Your Ownership Details</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Brand</Label>
                  <Select value={brand} onValueChange={setBrand}>
                    <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                    <SelectContent>
                      {VACATION_CLUB_BRANDS.map((b) => (
                        <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Unit Type</Label>
                  <Select value={unitType} onValueChange={setUnitType}>
                    <SelectTrigger><SelectValue placeholder="Select unit type" /></SelectTrigger>
                    <SelectContent>
                      {UNIT_TYPES.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YIELD_REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weeks">Weeks Owned</Label>
                    <Input id="weeks" type="number" min={1} max={52} value={weeksOwned} onChange={(e) => setWeeksOwned(Number(e.target.value) || 1)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fees">Annual Fees ($)</Label>
                    <Input id="fees" type="number" min={0} value={maintenanceFees} onChange={(e) => setMaintenanceFees(Number(e.target.value) || 0)} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Results */}
            <div className="space-y-4">
              {result ? (
                <>
                  <Card className={result.netProfit > 0 ? 'ring-2 ring-green-500' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Projected Annual Income</CardTitle>
                        {result.roi > 0 && <Badge className="bg-green-600">{result.roi}% ROI</Badge>}
                        {result.roi < 0 && <Badge variant="destructive">{result.roi}% ROI</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center pb-3 border-b">
                        <p className={`text-3xl font-bold ${result.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${result.netProfit.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">net annual profit</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross weekly income</span>
                          <span>${result.grossWeeklyIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RAV commission (15%)</span>
                          <span className="text-muted-foreground">-${(result.grossWeeklyIncome - result.netWeeklyIncome).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net per week</span>
                          <span className="font-medium">${result.netWeeklyIncome.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between">
                          <span className="text-muted-foreground">Occupancy estimate</span>
                          <span>{Math.round(result.occupancyRate * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. weeks rented</span>
                          <span>{result.estimatedWeeksRented} of {weeksOwned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross annual income</span>
                          <span>${result.grossAnnualIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net annual income</span>
                          <span>${result.netAnnualIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span>Maintenance fees</span>
                          <span>-${maintenanceFees.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>
                          You need to rent <strong>{result.breakEvenWeeks} week{result.breakEvenWeeks !== 1 ? 's' : ''}</strong> to break even on maintenance fees
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="pt-6 text-center text-muted-foreground">
                    <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select your brand and unit type to see projected income</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center mt-8">
            Estimates are based on industry averages and regional occupancy data.
            Actual income may vary based on specific property, seasonal demand, and pricing strategy.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
