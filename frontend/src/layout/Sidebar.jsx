import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Sparkles,
  GitCompare,
  AlertTriangle,
  BrainCircuit,
  Fingerprint,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  X,
  Cpu,
} from 'lucide-react';

const NAV_ITEMS = [
  { path: '/', label: 'Overview', icon: LayoutDashboard, exact: true },
  { path: '/predict', label: 'Predict', icon: Sparkles },
  { path: '/models', label: 'Model Comparison', icon: GitCompare },
  { path: '/errors', label: 'Error Analysis', icon: AlertTriangle },
  { path: '/explainability', label: 'Explainability', icon: BrainCircuit },
  { path: '/patterns', label: 'Suspicious Patterns', icon: Fingerprint },
  { path: '/batch', label: 'Batch Upload', icon: UploadCloud },
];

export function Sidebar({
  isCollapsed = false,
  toggleCollapse,
  isMobileOpen = false,
  closeMobile,
}) {
  const renderNavLinks = (isMobile = false) => (
    <nav className="space-y-1.5 px-3 flex-1">
      {NAV_ITEMS.map((item) => {
        const Icon = item.icon;
        return (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.exact}
            onClick={() => {
              if (isMobile && closeMobile) closeMobile();
            }}
            title={isCollapsed && !isMobile ? item.label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3.5 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 select-none ${
                isCollapsed && !isMobile ? 'justify-center px-0' : ''
              } ${
                isActive
                  ? 'bg-indigo-50/90 text-indigo-700 dark:bg-indigo-950/70 dark:text-indigo-300 font-semibold shadow-soft-xs border-r-2 border-indigo-600 dark:border-indigo-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={`p-1 rounded-lg transition-colors shrink-0 ${
                    isActive
                      ? 'text-indigo-600 dark:text-indigo-400'
                      : 'text-slate-500 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-slate-100'
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                </div>
                {(!isCollapsed || isMobile) && (
                  <span className="truncate">{item.label}</span>
                )}
              </>
            )}
          </NavLink>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col border-r border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-slate-900 transition-all duration-300 ease-in-out shrink-0 sticky top-0 h-screen z-30 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Header / Brand */}
        <div
          className={`h-16 flex items-center px-4 border-b border-slate-200/80 dark:border-slate-800/80 ${
            isCollapsed ? 'justify-center' : 'justify-between'
          }`}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-soft-sm shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6" />
            </div>
            {!isCollapsed && (
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 dark:text-slate-50 text-base tracking-tight truncate">
                    FakeReview<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                  Detection Suite
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation list */}
        <div className="py-4 flex-1 overflow-y-auto overflow-x-hidden">
          {renderNavLinks(false)}
        </div>

        {/* Footer info & collapse toggle button */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80">
          {!isCollapsed && (
            <div className="p-3 mb-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2 mb-1 text-slate-700 dark:text-slate-300 font-medium">
                <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                <span>Active Model</span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                XGBoost Classifier v2.4 (F1: 0.902)
              </p>
            </div>
          )}

          <button
            onClick={toggleCollapse}
            type="button"
            className="w-full flex items-center justify-center gap-2 p-2 rounded-xl text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-medium"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span>Collapse Sidebar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={closeMobile}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col shadow-soft-xl animate-in slide-in-from-left duration-300">
            {/* Mobile Header */}
            <div className="h-16 flex items-center justify-between px-4 border-b border-slate-200/80 dark:border-slate-800/80">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white shadow-soft-sm shadow-indigo-500/20">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-slate-50 text-base tracking-tight">
                    FakeReview<span className="text-indigo-600 dark:text-indigo-400">AI</span>
                  </span>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-semibold">
                    Detection Suite
                  </p>
                </div>
              </div>
              <button
                onClick={closeMobile}
                type="button"
                className="p-2 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-800 transition-colors"
                aria-label="Close navigation"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="py-4 flex-1 overflow-y-auto">
              {renderNavLinks(true)}
            </div>

            {/* Mobile Drawer Footer */}
            <div className="p-4 border-t border-slate-200/80 dark:border-slate-800/80">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs">
                <div className="flex items-center gap-2 mb-1 text-slate-700 dark:text-slate-300 font-medium">
                  <Cpu className="w-3.5 h-3.5 text-indigo-500" />
                  <span>XGBoost v2.4 Active</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Multimodal Review Authenticity Engine
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Sidebar;
