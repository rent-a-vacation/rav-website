import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, Users, Moon, MapPin, ArrowLeft } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
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
import { useJsonLd } from '@/hooks/useJsonLd';
import { buildBreadcrumbJsonLd } from '@/lib/breadcrumbSchema';
import { trackEvent } from '@/lib/posthog';
import {
  compareAccommodationCosts,
  COMPARATOR_DESTINATIONS,
  type CostComparisonResult,
} from '@/lib/costComparator';

export default function CostComparator() {
  usePageMeta({
    title: 'RAV SmartCompare — RAV Tools',
    description: 'Compare the total cost of a timeshare rental vs. hotel vs. Airbnb for your destination.',
    canonicalPath: '/tools/cost-comparator',
  });
  useJsonLd('breadcrumb-schema', buildBreadcrumbJsonLd([
    { name: 'Home', path: '/' },
    { name: 'RAV Tools', path: '/tools' },
    { name: 'SmartCompare', path: '/tools/cost-comparator' },
  ]));

  const schemaRef = useRef(false);
  useEffect(() => {
    if (schemaRef.current) return;
    schemaRef.current = true;
    const script = document.createElement('script');
    script.id = 'cost-comparator-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'RAV SmartCompare',
      url: 'https://rent-a-vacation.com/tools/cost-comparator',
      applicationCategory: 'TravelApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      description: 'Compare the total cost of a timeshare rental vs. hotel vs. Airbnb for your destination.',
      provider: { '@type': 'Organization', name: 'Rent-A-Vacation', url: 'https://rent-a-vacation.com' },
    });
    document.head.appendChild(script);
    return () => { document.getElementById('cost-comparator-schema')?.remove(); };
  }, []);

  const [destination, setDestination] = useState('florida');
  const [nights, setNights] = useState(7);
  const [guests, setGuests] = useState(2);
  const [ravRate, setRavRate] = useState(150);
  const [result, setResult] = useState<CostComparisonResult | null>(null);

  useEffect(() => {
    if (destination && nights > 0 && ravRate > 0) {
      setResult(
        compareAccommodationCosts({ destination, nights, guests, ravNightlyRate: ravRate }),
      );
    }
  }, [destination, nights, guests, ravRate]);

  const isComplete = destination && nights > 0 && ravRate > 0;

  useEffect(() => {
    if (isComplete && result) {
      trackEvent('tool_cost_comparator_completed', {
        destination,
        nights,
        guests,
        savings_vs_hotel: result.savings.vsHotel,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result?.savings.vsHotel]);

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
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
              <BarChart3 className="h-4 w-4" />
              RAV SmartCompare
            </div>
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-3">
              How much can you save with a timeshare rental?
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Compare RAV timeshare rentals against hotels and Airbnb — same destination, same dates
            </p>
          </div>

          {/* Input Form */}
          <Card className="mb-8">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Destination</Label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COMPARATOR_DESTINATIONS.map((d) => (
                        <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nights">Nights</Label>
                  <Input id="nights" type="number" min={1} max={30} value={nights} onChange={(e) => setNights(Number(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guests">Guests</Label>
                  <Input id="guests" type="number" min={1} max={10} value={guests} onChange={(e) => setGuests(Number(e.target.value) || 1)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ravRate">Your RAV Rate ($/night)</Label>
                  <Input id="ravRate" type="number" min={50} value={ravRate} onChange={(e) => setRavRate(Number(e.target.value) || 0)} />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Results */}
          {result && (
            <>
              {/* Savings Banner */}
              {result.savings.vsHotel > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-center">
                  <p className="text-green-800 font-semibold text-lg">
                    You could save ${result.savings.vsHotel.toLocaleString()} vs. a hotel
                    {result.savings.vsAirbnb > 0 && ` and $${result.savings.vsAirbnb.toLocaleString()} vs. Airbnb`}
                  </p>
                </div>
              )}

              {/* Comparison Cards */}
              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {[result.rav, result.hotel, result.airbnb].map((acc) => {
                  const isRav = acc.label === 'Rent-A-Vacation';
                  return (
                    <Card key={acc.label} className={isRav ? 'ring-2 ring-primary' : ''}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{acc.label}</CardTitle>
                          {isRav && <Badge className="bg-primary text-primary-foreground">Best Value</Badge>}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="text-center pb-3 border-b">
                          <p className="text-3xl font-bold">${acc.total.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">${acc.perNight}/night total</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">{nights} nights @ ${acc.nightlyRate}/night</span>
                            <span>${acc.subtotal.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fees</span>
                            <span>${acc.fees.toLocaleString()}</span>
                          </div>
                          {acc.taxes > 0 && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Est. taxes</span>
                              <span>${acc.taxes.toLocaleString()}</span>
                            </div>
                          )}
                        </div>
                        <div className="pt-3 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-2">Includes:</p>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {acc.amenities.map((a) => (
                              <li key={a} className="flex items-center gap-1">
                                <span className="text-primary">+</span> {a}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground text-center">
                Hotel and Airbnb estimates are based on industry averages for the selected destination.
                Actual prices may vary based on specific properties and dates.
              </p>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
