import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Sun, Moon, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import { USE_MOCK } from '../api/client';
import Badge from '../components/Badge';

const ROUTE_TITLES = {
  '/': 'Overview',
  '/predict': 'Predict Review',
  '/models': 'Model Comparison',
  '/errors': 'Error Analysis',
  '/explainability': 'Explainability (SHAP)',
  '/patterns': 'Suspicious Patterns',
  '/batch': 'Batch Upload',
  '/design-check': 'Design System Check',
};

export function Topbar({ onOpenMobile, isCollapsed, toggleCollapse }) {
  const location = useLocation();
  const { isDark, toggleDarkMode } = useDarkMode();

  const currentTitle = ROUTE_TITLES[location.pathname] || 'Fake Review Detection';

  return (
    <header className="sticky top-0 z-20 w-full h-16 border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
      {/* Left: Mobile hamburger & Desktop toggle & Page Title */}
      <div className="flex items-center gap-3">
        {/* Mobile Hamburger Button */}
        <button
          onClick={onOpenMobile}
          type="button"
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Desktop Collapse Toggle */}
        <button
          onClick={toggleCollapse}
          type="button"
          className="hidden lg:flex p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800"
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>

        {/* Dynamic Page Title */}
        <div className="flex items-center gap-2.5">
          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-50 tracking-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right Tools: Mock Data Badge & Dark Mode Toggle */}
      <div className="flex items-center gap-2.5 sm:gap-3">
        {/* Mock Data Badge (visible when VITE_USE_MOCK is true) */}
        {USE_MOCK && (
          <div
            title="Operating with simulated client-side mock data (VITE_USE_MOCK=true)"
            className="flex items-center"
          >
            <Badge
              variant="warning"
              dot
              size="md"
              className="bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800 font-medium shadow-soft-xs"
            >
              Mock Data
            </Badge>
          </div>
        )}

        {/* Dark / Light Mode Toggle */}
        <button
          onClick={toggleDarkMode}
          type="button"
          className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800 shadow-soft-xs"
          title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          aria-label="Toggle dark mode"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-600" />
          )}
        </button>
      </div>
    </header>
  );
}

export default Topbar;
