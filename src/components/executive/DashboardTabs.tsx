import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, BarChart3 } from 'lucide-react';

/**
 * Top-of-page tab navigation shared between the Executive Dashboard
 * (live metrics) and the Financial Model (24-month forecast).
 *
 * Active tab is determined from `useLocation()` so the same component
 * works on both routes without props. Clicking a tab navigates client-side.
 */

const TABS = [
  {
    id: 'live',
    label: 'Live Metrics',
    href: '/executive-dashboard',
    description: 'Real-time business performance',
    icon: BarChart3,
  },
  {
    id: 'forecast',
    label: 'Financial Model',
    href: '/executive-dashboard/financial-model',
    description: '24-month forward projection',
    icon: TrendingUp,
  },
] as const;

export function DashboardTabs() {
  const location = useLocation();

  // Determine active tab by exact path or descendant path
  const activeTab =
    location.pathname === '/executive-dashboard' || location.pathname === '/executive-dashboard/'
      ? 'live'
      : location.pathname.startsWith('/executive-dashboard/financial-model')
        ? 'forecast'
        : 'live';

  return (
    <nav className="border-b border-slate-700/50 bg-slate-900/50 backdrop-blur" aria-label="Dashboard sections">
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-1">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                className={`group relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                  isActive
                    ? 'border-teal-400 text-white'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-teal-300' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span>{tab.label}</span>
                <span className="hidden md:inline text-xs font-normal text-slate-500 ml-1">
                  · {tab.description}
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
