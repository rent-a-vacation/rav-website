import { Navigate, Link } from 'react-router-dom';
import { TrendingUp, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePageMeta } from '@/hooks/usePageMeta';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { DashboardTabs } from '@/components/executive/DashboardTabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { project, type Scenario } from '@/lib/financial-model/calc';
import { DEFAULT_COMMISSION, EFFECTIVE_RATES, formatRate } from '@/config/commission';
import { useState } from 'react';

/**
 * Financial Model Dashboard — Phase 2 Stage 2a.
 *
 * Forward-looking 24-month projection. Distinct from `/executive-dashboard`
 * (which shows LIVE business metrics). This page renders the same model
 * that `npm run financials:build` produces as an .xlsx — but viewable in
 * the browser without opening Excel.
 *
 * Scope (Stage 2a — view-only MVP):
 * - Auth-gated to RAV team
 * - "Forward Projection — Not Live Data" banner (distinct from Exec Dash)
 * - Scenario selector (Conservative / Base / Optimistic)
 * - High-level KPI cards (24-mo revenue, costs, profit, break-even, GBV)
 * - Commission rate breakdown from central config
 * - Link back to Executive Dashboard for live data
 * - Instructions for regenerating the .xlsx
 *
 * Out of scope (later stages): interactive input editing, scenario save/load,
 * live actuals overlay, real charts (recharts), PDF export.
 */

const formatUSD = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n);

const formatNumber = (n: number) =>
  new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(n);

export default function FinancialModelDashboard() {
  usePageMeta(
    'Financial Model — RAV Insights',
    'Forward-looking 24-month financial projection for Rent-A-Vacation marketplace. Internal RAV admin tool.',
  );

  const { user, isRavTeam, isLoading } = useAuth();
  const [scenario, setScenario] = useState<Scenario>('Base');

  if (isLoading) return null;
  if (!user || !isRavTeam()) return <Navigate to="/" replace />;

  const result = project(scenario);

  return (
    <div className="min-h-screen bg-slate-900">
      <Header />

      <div className="pt-16 md:pt-20">
        <DashboardTabs />
        <main className="container mx-auto px-6 py-8 md:py-10">
          {/* Forward Projection banner — distinct from Exec Dashboard live metrics */}
          <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-400 mt-0.5" aria-hidden="true" />
            <div className="text-sm text-amber-100">
              <strong className="font-semibold">Forward Projection — Not Live Data.</strong>{' '}
              This is a forecast based on assumptions. Live operational metrics (current MRR, actual bookings, real user counts) are on the{' '}
              <Link to="/executive-dashboard" className="underline underline-offset-2 hover:text-amber-50">Executive Dashboard</Link>.
            </div>
          </div>

          {/* Page header */}
          <div className="flex items-start justify-between gap-4 mb-8">
            <div>
              <div className="text-xs font-medium tracking-widest uppercase text-slate-400 mb-1.5">
                Financial Model — Forward Projection
              </div>
              <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight text-white">
                24-Month Projection
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-2xl">
                Same model as the generated .xlsx, viewable without leaving the browser. Switch scenarios below to see Conservative, Base, or Optimistic trajectories.
              </p>
            </div>

            {/* Scenario selector */}
            <div className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800/50 p-1">
              {(['Conservative', 'Base', 'Optimistic'] as Scenario[]).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setScenario(s)}
                  className={`px-3 py-1.5 text-sm rounded transition ${
                    scenario === s ? 'bg-teal-600 text-white' : 'text-slate-300 hover:bg-slate-700/60'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Top-line KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <KpiCard
              label="24-Month Total Revenue"
              value={formatUSD(result.totals.totalRevenue24mo)}
              hint={`${scenario} scenario`}
              accent="emerald"
            />
            <KpiCard
              label="24-Month Total Costs"
              value={formatUSD(result.totals.totalCosts24mo)}
              hint="Expenses + Hiring"
              accent="red"
            />
            <KpiCard
              label="24-Month Net Profit / (Loss)"
              value={formatUSD(result.totals.totalProfit24mo)}
              hint={result.totals.totalProfit24mo >= 0 ? 'Surplus' : 'Funding gap'}
              accent={result.totals.totalProfit24mo >= 0 ? 'emerald' : 'amber'}
            />
            <KpiCard
              label="Break-Even Month"
              value={result.breakEvenMonth ? `Month ${result.breakEvenMonth}` : 'Not in 24mo'}
              hint={result.breakEvenMonth ? 'Cumulative cash crosses zero' : 'Needs more cash or growth'}
              accent={result.breakEvenMonth ? 'teal' : 'amber'}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <KpiCard
              label="24-Month GBV (Gross Booking Value)"
              value={formatUSD(result.totals.totalGBV24mo)}
              hint="Total $ of bookings facilitated"
            />
            <KpiCard
              label="Net Commission (after Stripe)"
              value={formatUSD(result.totals.totalCommissionNet24mo)}
              hint={`Gross ${formatUSD(result.totals.totalCommissionGross24mo)} − Stripe ${formatUSD(Math.abs(result.totals.totalStripeFees24mo))}`}
            />
            <KpiCard
              label="Steady-State Monthly Burn"
              value={formatUSD(result.monthlyBurnSteadyState)}
              hint="Recurring costs only — what we spend monthly"
            />
          </div>

          {/* Commission rate breakdown */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-teal-400" />
                Commission Rates (from central config)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <RateTile label="Free Owner" rate={EFFECTIVE_RATES.free} sub={`Base rate, no discount`} />
                <RateTile label="Pro Owner" rate={EFFECTIVE_RATES.pro}  sub={`Base ${formatRate(DEFAULT_COMMISSION.base)} − ${formatRate(DEFAULT_COMMISSION.proDiscount)} Pro discount`} />
                <RateTile label="Business Owner" rate={EFFECTIVE_RATES.business} sub={`Base ${formatRate(DEFAULT_COMMISSION.base)} − ${formatRate(DEFAULT_COMMISSION.businessDiscount)} Business discount`} />
              </div>
              <div className="mt-4 text-xs text-slate-400">
                Blended rate this scenario: <strong className="text-slate-200">{formatRate(result.totals.blendedCommissionRate)}</strong>
                {' '}— weighted by booking-mix assumptions (Free/Pro/Business owners).
              </div>
              <div className="mt-3 text-xs text-slate-500">
                To change rates: edit <code className="rounded bg-slate-900 px-1 py-0.5">src/config/commission.ts</code> (single source of truth — propagates to live pricing and the financial model both).
              </div>
            </CardContent>
          </Card>

          {/* Monthly summary table */}
          <Card className="bg-slate-800/50 border-slate-700 mb-8">
            <CardHeader>
              <CardTitle className="text-white">Monthly Trajectory</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                      <th className="text-left py-2 pr-4">Month</th>
                      <th className="text-right py-2 px-3">Active Owners</th>
                      <th className="text-right py-2 px-3">Active Travelers</th>
                      <th className="text-right py-2 px-3">Bookings</th>
                      <th className="text-right py-2 px-3">Revenue</th>
                      <th className="text-right py-2 px-3">Costs</th>
                      <th className="text-right py-2 px-3">Net P&amp;L</th>
                      <th className="text-right py-2 pl-3">Cumulative Cash</th>
                    </tr>
                  </thead>
                  <tbody className="text-slate-200">
                    {result.monthly.map((row) => {
                      const isBreakeven = result.breakEvenMonth === row.month;
                      return (
                        <tr key={row.month}
                          className={`border-b border-slate-800 hover:bg-slate-700/30 ${
                            isBreakeven ? 'bg-emerald-500/10' : row.cumulativeCash < 0 ? '' : ''
                          }`}
                        >
                          <td className="py-2 pr-4 text-slate-400">
                            Mo {row.month}
                            {isBreakeven && <Badge variant="outline" className="ml-2 border-emerald-500/50 text-emerald-300 text-[10px]">Break-even</Badge>}
                          </td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumber(row.activeOwners)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{formatNumber(row.activeTravelers)}</td>
                          <td className="py-2 px-3 text-right tabular-nums">{row.bookings.toFixed(1)}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-emerald-300">{formatUSD(row.totalRevenue)}</td>
                          <td className="py-2 px-3 text-right tabular-nums text-red-300">{formatUSD(row.totalCostsExpenses + row.hiringCosts)}</td>
                          <td className={`py-2 px-3 text-right tabular-nums ${row.netPnL >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{formatUSD(row.netPnL)}</td>
                          <td className={`py-2 pl-3 text-right tabular-nums font-medium ${row.cumulativeCash >= 0 ? 'text-emerald-300' : 'text-amber-300'}`}>{formatUSD(row.cumulativeCash)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Excel export */}
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-amber-400" />
                Full Workbook (.xlsx)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-slate-300 mb-3">
                For the full 9-sheet workbook (INPUTS, EXPENSES, REVENUE MODEL with all 24 months across columns, BREAK-EVEN, UNIT ECON, SENSITIVITY, FUNDING ASK, INSTRUCTIONS) — regenerate the .xlsx.
              </p>
              <pre className="rounded bg-slate-900 border border-slate-700 px-3 py-2 text-xs text-slate-300 font-mono">npm run financials:build</pre>
              <p className="text-xs text-slate-400 mt-3">
                Output appears in <code className="rounded bg-slate-900 px-1 py-0.5">docs/financials/RAV_Financial_Model_YYYY-MM-DD_HHMM.xlsx</code>. Copy to OneDrive and share with co-founders.
              </p>
              <p className="text-xs text-slate-500 mt-3">
                Web-side Excel download is a Stage 2d enhancement — for now, the CLI command produces the file directly. Stage 2c will add interactive input editing and scenario save/load in this UI.
              </p>
            </CardContent>
          </Card>

          {/* Footer note */}
          <div className="text-center text-xs text-slate-500 mt-12">
            Stage 2a — view-only MVP. Same data and formulas as the .xlsx; same source of truth (<code>src/lib/financial-model/data.ts</code>).
          </div>
        </main>

        <div className="border-t border-slate-700/50 mt-12">
          <Footer />
        </div>
      </div>
    </div>
  );
}

// ─── Helper subcomponents ────────────────────────────────────────────────────

type Accent = 'emerald' | 'red' | 'amber' | 'teal' | 'default';
const accentClasses: Record<Accent, string> = {
  emerald: 'text-emerald-300',
  red:     'text-red-300',
  amber:   'text-amber-300',
  teal:    'text-teal-300',
  default: 'text-slate-100',
};

function KpiCard({ label, value, hint, accent = 'default' }: { label: string; value: string; hint?: string; accent?: Accent }) {
  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardContent className="pt-6">
        <div className="text-xs uppercase tracking-wider text-slate-400 mb-2">{label}</div>
        <div className={`text-2xl font-bold tabular-nums ${accentClasses[accent]}`}>{value}</div>
        {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}

function RateTile({ label, rate, sub }: { label: string; rate: number; sub: string }) {
  return (
    <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
      <div className="text-xs uppercase tracking-wider text-slate-400 mb-1">{label}</div>
      <div className="text-3xl font-bold text-teal-300 tabular-nums">{formatRate(rate)}</div>
      <div className="text-xs text-slate-500 mt-2">{sub}</div>
    </div>
  );
}
