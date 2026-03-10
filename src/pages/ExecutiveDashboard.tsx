import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Monitor } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { HeadlineBar } from '@/components/executive/HeadlineBar';
import { BusinessPerformance } from '@/components/executive/BusinessPerformance';
import { MarketplaceHealth } from '@/components/executive/MarketplaceHealth';
import { MarketIntelligence } from '@/components/executive/MarketIntelligence';
import { IndustryFeed } from '@/components/executive/IndustryFeed';
import { UnitEconomics } from '@/components/executive/UnitEconomics';
import { IntegrationSettings } from '@/components/executive/IntegrationSettings';
import { SectionDivider } from '@/components/executive/SectionDivider';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { usePageMeta } from '@/hooks/usePageMeta';

const ExecutiveDashboard = () => {
  usePageMeta('RAV Command', 'Executive dashboard for Rent-A-Vacation marketplace operations and business intelligence.');

  const { user, isRavTeam, isLoading } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (isLoading) return null;
  if (!user || !isRavTeam()) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      {/* Desktop-only banner for small viewports */}
      <div className="lg:hidden fixed inset-0 z-50 bg-slate-900 flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <Monitor className="h-12 w-12 text-slate-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-white mb-2">Desktop Recommended</h2>
          <p className="text-sm text-slate-400">
            The Executive Dashboard is optimized for desktop viewing (1024px+).
            For the best experience, please use a larger screen.
          </p>
        </div>
      </div>

      {/* Main content — hidden below lg */}
      <div className="hidden lg:block pt-16 md:pt-20">
        <HeadlineBar />

        <main className="container mx-auto px-6 py-8 space-y-0">
          {/* Page header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">RAV Command</h1>
              <p className="text-sm text-slate-400 mt-1 max-w-2xl">
                Boardroom-grade intelligence. Real-time marketplace performance, proprietary metrics like Liquidity Score and Bid Spread Index,
                competitive benchmarking, and industry intelligence — all in one boardroom-ready view.
              </p>
            </div>
            <IntegrationSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
          </div>

          {/* Section 2: Business Performance */}
          <BusinessPerformance />

          <SectionDivider />

          {/* Section 3: Marketplace Health */}
          <MarketplaceHealth />

          <SectionDivider />

          {/* Section 4: Market Intelligence */}
          <MarketIntelligence onOpenSettings={() => setSettingsOpen(true)} />

          <SectionDivider />

          {/* Section 5: Industry Feed */}
          <IndustryFeed />

          <SectionDivider />

          {/* Section 6: Unit Economics */}
          <UnitEconomics />
        </main>

        <div className="border-t border-slate-700/50 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
};

export default ExecutiveDashboard;
