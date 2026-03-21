import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Calculator,
  TrendingUp,
  BarChart3,
  Compass,
  Wallet,
  ArrowRight,
  Wrench,
} from 'lucide-react';

interface Tool {
  id: string;
  brandName: string;
  description: string;
  status: 'built' | 'coming-soon';
  route?: string;
  icon: React.ElementType;
}

const TOOLS: Tool[] = [
  {
    id: 'smartearn',
    brandName: 'RAV SmartEarn',
    description:
      'Calculate how many weeks you need to rent your timeshare to cover maintenance fees, plus estimate your annual rental yield. Free, no account needed.',
    status: 'built',
    route: '/calculator',
    icon: Calculator,
  },
  {
    id: 'smartprice',
    brandName: 'RAV SmartPrice',
    description:
      'AI-powered fair value scoring that compares your listing to similar properties and shows whether it\'s priced right.',
    status: 'built',
    route: '/rentals',
    icon: TrendingUp,
  },
  {
    id: 'smartcompare',
    brandName: 'RAV SmartCompare',
    description:
      'Compare the total cost of a timeshare rental vs. hotel vs. Airbnb for the same destination and dates.',
    status: 'built',
    route: '/tools/cost-comparator',
    icon: BarChart3,
  },
  {
    id: 'smartmatch',
    brandName: 'RAV SmartMatch',
    description:
      'Answer a few questions about your ideal vacation and get matched to the perfect resort from our 117-resort database.',
    status: 'built',
    route: '/tools/resort-quiz',
    icon: Compass,
  },
  {
    id: 'smartbudget',
    brandName: 'RAV SmartBudget',
    description:
      'Plan your full trip budget including flights, car rental, dining, and activities alongside your accommodation.',
    status: 'built',
    route: '/tools/budget-planner',
    icon: Wallet,
  },
];

const RavTools = () => {
  usePageMeta({
    title: 'RAV Tools — Free Vacation Planning Tools',
    description: 'Free tools for timeshare owners and travelers: maintenance fee calculator, smart pricing, cost comparisons, and more.',
    canonicalPath: '/tools',
  });

  // Inject ItemList JSON-LD structured data
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'RAV Tools — Free Vacation Planning Tools',
      description:
        'Free tools for timeshare owners and travelers on Rent-A-Vacation.',
      numberOfItems: TOOLS.length,
      itemListElement: TOOLS.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.brandName,
        description: tool.description,
        ...(tool.route
          ? { url: `https://rent-a-vacation.com${tool.route}` }
          : {}),
      })),
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'rav-tools-schema';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const existing = document.getElementById('rav-tools-schema');
      if (existing) existing.remove();
    };
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header />

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-warm">
        <div className="container mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-medium mb-4">
            <Wrench className="h-4 w-4" />
            RAV Tools
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-6">
            Free Tools for Smarter Vacations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Whether you own a timeshare or you're planning your next getaway,
            these tools help you make better decisions — all free, no account required.
          </p>
        </div>
      </section>

      {/* Tool Cards */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {TOOLS.map((tool) => {
              const Icon = tool.icon;
              const isBuilt = tool.status === 'built';

              return (
                <div
                  key={tool.id}
                  className={`bg-card rounded-xl shadow-card p-6 flex flex-col ${
                    isBuilt
                      ? 'hover:shadow-card-hover transition-shadow'
                      : 'opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    {!isBuilt && (
                      <Badge variant="secondary">Coming Soon</Badge>
                    )}
                  </div>

                  <h3 className="font-display text-lg font-semibold text-foreground mb-2">
                    {tool.brandName}
                  </h3>
                  <p className="text-muted-foreground text-sm flex-1 mb-4">
                    {tool.description}
                  </p>

                  {isBuilt && tool.route ? (
                    <Link to={tool.route}>
                      <Button className="w-full gap-2">
                        Try it Free
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Button disabled className="w-full" variant="outline">
                      Coming Soon
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-muted/50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Have a Tool Idea?
          </h2>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            We're always building new tools for the vacation ownership community.
            Let us know what would help you most.
          </p>
          <Link to="/contact">
            <Button variant="outline">Share Your Idea</Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default RavTools;
