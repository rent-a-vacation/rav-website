import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Calculator, Users, ArrowDown, ArrowLeft, TrendingUp } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { usePageMeta } from '@/hooks/usePageMeta';
import { OwnershipForm } from '@/components/calculator/OwnershipForm';
import { BreakevenResults } from '@/components/calculator/BreakevenResults';
import { CalculatorCTA } from '@/components/calculator/CalculatorCTA';
import {
  calculateBreakeven,
  type CalculatorInputs,
  type CalculatorResult,
} from '@/lib/calculatorLogic';
import {
  estimateYield,
  YIELD_REGIONS,
  type YieldResult,
} from '@/lib/yieldEstimator';
import { supabase } from '@/lib/supabase';
import { trackEvent } from '@/lib/posthog';

export default function MaintenanceFeeCalculator() {
  const [inputs, setInputs] = useState<CalculatorInputs>({
    brand: '',
    unitType: '',
    annualMaintenanceFees: 0,
    weeksOwned: 1,
  });
  const [result, setResult] = useState<CalculatorResult | null>(null);
  const [ownerCount, setOwnerCount] = useState<number | null>(null);
  const [hasScrolledToResults, setHasScrolledToResults] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const [showYield, setShowYield] = useState(false);
  const [region, setRegion] = useState('florida');
  const [yieldResult, setYieldResult] = useState<YieldResult | null>(null);

  // Live calculation on input change
  useEffect(() => {
    setResult(calculateBreakeven(inputs));
  }, [inputs]);

  const isFormComplete = !!(inputs.brand && inputs.unitType && inputs.annualMaintenanceFees > 0);

  // Track calculator completion
  useEffect(() => {
    if (isFormComplete && result) {
      trackEvent("calculator_completed", {
        brand: inputs.brand,
        unit_type: inputs.unitType,
        maintenance_fees: inputs.annualMaintenanceFees,
        weeks_to_breakeven: result.weeksToBreakeven,
      });
    }
  }, [isFormComplete, result?.weeksToBreakeven]);

  const scrollToResults = () => {
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setHasScrolledToResults(true);
  };

  // Compute yield estimate when toggle is on
  useEffect(() => {
    if (!showYield || !isFormComplete) {
      setYieldResult(null);
      return;
    }
    const yr = estimateYield({
      brand: inputs.brand,
      unitType: inputs.unitType,
      weeksOwned: inputs.weeksOwned,
      region,
      annualMaintenanceFees: inputs.annualMaintenanceFees,
    });
    setYieldResult(yr);
    if (yr) {
      trackEvent('smartearn_yield_viewed', {
        brand: inputs.brand,
        unit_type: inputs.unitType,
        region,
        roi: yr.roi,
      });
    }
  }, [showYield, isFormComplete, inputs.brand, inputs.unitType, inputs.weeksOwned, region, inputs.annualMaintenanceFees]);

  // Fetch owner count for social proof
  useEffect(() => {
    supabase
      .from('user_roles')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'property_owner')
      .then(({ count }) => {
        if (count != null && count > 0) setOwnerCount(count);
      });
  }, []);

  usePageMeta(
    'RAV SmartEarn — Break-Even & Yield Calculator',
    'Calculate how many weeks you need to rent your timeshare to cover maintenance fees, plus estimate your annual rental yield. Free tool for Hilton, Marriott, Disney, Wyndham owners.'
  );

  // Inject HowTo JSON-LD structured data
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'RAV SmartEarn — Break-Even & Yield Calculator',
      description:
        'Use RAV SmartEarn to find out how many weeks you need to rent your timeshare to cover maintenance fees, plus estimate your annual rental yield.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Select your brand',
          text: 'Choose your vacation club brand (Hilton, Marriott, Disney, Wyndham, etc.) from the dropdown.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Enter your unit type',
          text: 'Select your unit type (studio, 1-bedroom, 2-bedroom, etc.) to get accurate rental estimates.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Enter your maintenance fees',
          text: 'Enter your annual maintenance fee amount in dollars.',
        },
        {
          '@type': 'HowToStep',
          position: 4,
          name: 'View your break-even results',
          text: 'See your break-even analysis including weeks needed, potential earnings, and ROI percentage.',
        },
        {
          '@type': 'HowToStep',
          position: 5,
          name: 'Toggle yield estimate',
          text: 'Enable the yield toggle to see projected annual rental income based on your region and occupancy rates.',
        },
      ],
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'calculator-howto-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('calculator-howto-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 pt-16 md:pt-20">
        <div className="max-w-5xl mx-auto px-4 py-12">
          {/* Breadcrumb */}
          <Link to="/tools" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-3 w-3" />
            Back to Free Tools
          </Link>

          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <Calculator className="h-4 w-4" />
              RAV SmartEarn
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              Will renting your timeshare cover your maintenance fees?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Find out in 30 seconds — free, no account needed
            </p>
          </div>

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
            <div className="space-y-4">
              <OwnershipForm inputs={inputs} onChange={setInputs} />
              {/* Calculate button — gives user a clear next step */}
              <Button
                onClick={scrollToResults}
                disabled={!isFormComplete}
                className="w-full lg:hidden"
                size="lg"
              >
                <ArrowDown className="h-4 w-4 mr-2" />
                See My Results
              </Button>
              <Button
                onClick={scrollToResults}
                disabled={!isFormComplete}
                className="w-full hidden lg:flex"
                variant={result && !hasScrolledToResults ? 'default' : 'outline'}
                size="lg"
              >
                {result ? 'See My Results' : 'Fill in all fields to calculate'}
              </Button>
            </div>
            <div ref={resultsRef}>
              <BreakevenResults result={result} />
            </div>
          </div>

          {/* Yield Estimate Toggle */}
          <div className="mb-10">
            <div className="flex items-center justify-between bg-muted/50 rounded-lg px-4 py-3 mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" />
                <Label htmlFor="yield-toggle" className="font-medium cursor-pointer">Show annual yield estimate</Label>
              </div>
              <Switch id="yield-toggle" checked={showYield} onCheckedChange={setShowYield} />
            </div>

            {showYield && (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <Label className="whitespace-nowrap">Region</Label>
                  <Select value={region} onValueChange={setRegion}>
                    <SelectTrigger className="max-w-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {YIELD_REGIONS.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {yieldResult ? (
                  <Card className={yieldResult.netProfit > 0 ? 'ring-2 ring-green-500' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">Projected Annual Income</CardTitle>
                        {yieldResult.roi > 0 && <Badge className="bg-green-600">{yieldResult.roi}% ROI</Badge>}
                        {yieldResult.roi < 0 && <Badge variant="destructive">{yieldResult.roi}% ROI</Badge>}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="text-center pb-3 border-b">
                        <p className={`text-3xl font-bold ${yieldResult.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          ${yieldResult.netProfit.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">net annual profit</p>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross weekly income</span>
                          <span>${yieldResult.grossWeeklyIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">RAV commission (15%)</span>
                          <span className="text-muted-foreground">-${(yieldResult.grossWeeklyIncome - yieldResult.netWeeklyIncome).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net per week</span>
                          <span className="font-medium">${yieldResult.netWeeklyIncome.toLocaleString()}</span>
                        </div>
                        <div className="pt-2 border-t flex justify-between">
                          <span className="text-muted-foreground">Occupancy estimate</span>
                          <span>{Math.round(yieldResult.occupancyRate * 100)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Est. weeks rented</span>
                          <span>{yieldResult.estimatedWeeksRented} of {inputs.weeksOwned}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross annual income</span>
                          <span>${yieldResult.grossAnnualIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Net annual income</span>
                          <span>${yieldResult.netAnnualIncome.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between text-destructive">
                          <span>Maintenance fees</span>
                          <span>-${inputs.annualMaintenanceFees.toLocaleString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : showYield && isFormComplete ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Unable to estimate yield for this brand/unit combination.</p>
                ) : showYield ? (
                  <p className="text-sm text-muted-foreground text-center py-4">Fill in the form above to see your yield estimate.</p>
                ) : null}

                {yieldResult && (
                  <Card>
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 text-sm">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span>
                          You need to rent <strong>{yieldResult.breakEvenWeeks} week{yieldResult.breakEvenWeeks !== 1 ? 's' : ''}</strong> to break even on maintenance fees
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>

          {/* Social proof */}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground mb-10">
            <span className="flex items-center gap-1.5">
              <Users className="h-4 w-4" />
              {ownerCount
                ? `Join ${ownerCount} owners already earning on RAV`
                : 'Join hundreds of owners already earning on RAV'}
            </span>
          </div>

          {/* CTA */}
          <CalculatorCTA />
        </div>
      </main>

      <Footer />
    </div>
  );
}
