import React from 'react';

export function Footer() {
  return (
    <footer className="border-t border-slate-200/80 dark:border-slate-800/80 bg-white/60 dark:bg-slate-900/40 py-5 mt-auto text-center text-xs text-slate-500 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-slate-600 dark:text-slate-400 font-medium">
          Preliminary analytical tool. Does not replace human verification or platform-level moderation.
        </p>

        <div className="flex items-center gap-4 text-[11px] shrink-0">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> Textual
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-500" /> Behavioral
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-purple-500" /> Temporal
          </span>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
