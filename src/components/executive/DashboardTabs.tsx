import { Link, useLocation } from 'react-router-dom';
import { TrendingUp, BarChart3 } from 'lucide-react';

/**
 * Top-of-page tab navigation shared between the Executive Dashboard
 * (live metrics) and the Financial Model (24-month forecast).
 *
 * Visual style: distinct horizontal band with filled active state.
 * Reads as a secondary header rather than a subtle underline.
 * Active tab is determined from `useLocation()` so the same component
 * works on both routes without props.
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
    <nav
      className="border-y border-slate-700 bg-slate-800 shadow-md"
      aria-label="Dashboard sections"
    >
      <div className="container mx-auto px-6">
        <div className="flex items-center gap-2 py-3">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            const Icon = tab.icon;
            return (
              <Link
                key={tab.id}
                to={tab.href}
                aria-current={isActive ? 'page' : undefined}
                className={`group inline-flex items-center gap-2.5 rounded-md px-5 py-3 text-base font-semibold transition-all ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-600/30 ring-1 ring-teal-400/40'
                    : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Icon className={`h-5 w-5 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
                <span>{tab.label}</span>
                <span
                  className={`hidden lg:inline text-xs font-normal ml-1.5 ${
                    isActive ? 'text-teal-50/90' : 'text-slate-500 group-hover:text-slate-400'
                  }`}
                >
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
