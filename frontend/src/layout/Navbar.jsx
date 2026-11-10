import React from 'react';
import { NavLink } from 'react-router-dom';
import { ShieldCheck, Sun, Moon, LayoutGrid } from 'lucide-react';
import { useDarkMode } from '../hooks/useDarkMode';
import Badge from '../components/Badge';

export function Navbar() {
  const { isDark, toggleDarkMode } = useDarkMode();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200/80 dark:border-slate-800/80 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-soft-sm shadow-indigo-500/20">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 dark:text-slate-50 text-base tracking-tight">
                FakeReview<span className="text-indigo-600 dark:text-indigo-400">AI</span>
              </span>
              <Badge variant="primary" size="sm">v1.0</Badge>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:block">
              Multimodal Review Authenticity Engine
            </p>
          </div>
        </div>

        {/* Navigation items */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/design-check"
            className={({ isActive }) =>
              `flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs md:text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`
            }
          >
            <LayoutGrid className="w-4 h-4" />
            <span>Design System Check</span>
          </NavLink>
        </nav>

        {/* Right tools: Dark Mode toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={toggleDarkMode}
            type="button"
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors border border-slate-200/80 dark:border-slate-800"
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
      </div>
    </header>
  );
}

export default Navbar;
