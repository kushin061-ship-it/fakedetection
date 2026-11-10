import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  Star,
  RefreshCw,
  Eye,
  Maximize2,
  Minimize2,
  User,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import { getErrors, useApi } from '../api';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import EmptyState from '../components/EmptyState';

// Explanations for moderator review
const ERROR_EXPLANATIONS = {
  false_positive: {
    title: 'Why did the model generate a False Positive?',
    explanation:
      'The review is genuine, but high emotional arousal (e.g. angry 1-star complaints, capitalized words, or concise phrasing) triggered spam heuristics. The model over-indexed on stylistic extremity rather than contextual intent.',
    moderatorAction: 'Approve review. Genuine customer voice should not be penalized for emotional venting.',
    color: 'rose',
  },
  false_negative: {
    title: 'Why did the model generate a False Negative?',
    explanation:
      'This deceptive review was paid or astroturfed, but the author engineered balanced phrasing (e.g. constructing mild pros and cons, realistic technical jargon, or awarding 4 stars instead of 5) to deliberately evade sentiment and length filters.',
    moderatorAction: 'Quarantine and cross-reference author account history for coordinated burst campaigns.',
    color: 'amber',
  },
  low_confidence: {
    title: 'Why is this a Low-Confidence prediction?',
    explanation:
      'The review probability falls within the uncertain boundary zone (0.40 to 0.60). The submission contains neutral sentiment and standard vocabulary with zero distinct fraud signals, making algorithmic classification volatile.',
    moderatorAction: 'Requires human auditor review to establish context or await further reviewer behavior data.',
    color: 'indigo',
  },
};

export function ErrorsPage() {
  const [activeTab, setActiveTab] = useState('false_positive');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // Selected error for side drawer inspection
  const [selectedError, setSelectedError] = useState(null);

  // Set of inline expanded review IDs
  const [expandedReviews, setExpandedReviews] = useState(new Set());

  // 300ms debounce on search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Handle Tab Change (resets page to 1)
  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(1);
  };

  // Close drawer on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setSelectedError(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch error data via useApi hook
  const {
    data: errorsResponse,
    loading,
    error,
    refetch,
  } = useApi(
    () => getErrors(activeTab, page, debouncedSearch, 10),
    [activeTab, page, debouncedSearch]
  );

  // Toggle inline text expansion
  const toggleInlineExpand = (id, e) => {
    if (e) e.stopPropagation();
    setExpandedReviews((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Error records & summary data
  const errorRecords = errorsResponse?.data || [];
  const totalItems = errorsResponse?.total || 0;
  const totalPages = errorsResponse?.totalPages || 1;
  const summary = errorsResponse?.summary || {
    totalFalsePositives: 60,
    totalFalseNegatives: 60,
    totalLowConfidence: 40,
    totalOverall: 160,
  };

  const tabsConfig = [
    {
      id: 'false_positive',
      label: 'False Positives',
      count: summary.totalFalsePositives,
      variant: 'fake',
    },
    {
      id: 'false_negative',
      label: 'False Negatives',
      count: summary.totalFalseNegatives,
      variant: 'warning',
    },
    {
      id: 'low_confidence',
      label: 'Low-Confidence Cases',
      count: summary.totalLowConfidence,
      variant: 'primary',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Error Analysis & Edge Cases"
        subtitle="Inspect misclassified reviews, stealth false negatives, and borderline predictions (0.40–0.60 probability) to diagnose classifier blind spots."
        badge={
          <Badge variant="warning" dot size="sm">
            160 Diagnostic Cases
          </Badge>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Errors
          </span>
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refetch()}
            leftIcon={RefreshCw}
          >
            Refresh Cases
          </Button>
        }
      />

      {/* Summary Card at the Top */}
      <Card className="p-5 space-y-4">
        <CardHeader className="p-0 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              <CardTitle>Platform Moderator Impact Summary</CardTitle>
            </div>
            <CardDescription>
              Understand how each classification error affects marketplace operations and shopper experience
            </CardDescription>
          </div>
          <Badge variant="neutral" size="sm">
            Total {summary.totalOverall} Benchmarked Cases
          </Badge>
        </CardHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          {/* False Positives Summary */}
          <div className="p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                False Positives
              </span>
              <Badge variant="fake" size="sm">
                {summary.totalFalsePositives} Cases
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Genuine reviews wrongly penalized.</strong> Often triggered by emotional 1-star complaints or exclamation mark bursts. Causes merchant friction and suppresses authentic customer dissatisfaction.
            </p>
          </div>

          {/* False Negatives Summary */}
          <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500" />
                False Negatives
              </span>
              <Badge variant="warning" size="sm">
                {summary.totalFalseNegatives} Cases
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Deceptive fake reviews missed.</strong> Astroturfed campaigns engineered with balanced phrasing and technical jargon to evade NLP filters. Erodes consumer trust and marketplace integrity.
            </p>
          </div>

          {/* Low Confidence Summary */}
          <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
                Low-Confidence
              </span>
              <Badge variant="primary" size="sm">
                {summary.totalLowConfidence} Cases
              </Badge>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <strong>Ambiguous boundary predictions.</strong> Probabilities hovering between 40% and 60% with symmetric pros/cons. High priority queue requiring human auditor validation.
            </p>
          </div>
        </div>
      </Card>

      {/* Main Table Card */}
      <Card className="p-5 space-y-4">
        {/* Navigation Tabs with Count Badges */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 select-none">
            {tabsConfig.map((tab) => {
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-soft-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.label}</span>
                  <span
                    className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search Box with 300ms Debounce */}
          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search text, ID, product..."
              className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-slate-900 dark:text-slate-100 placeholder-slate-400 shadow-soft-xs"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="space-y-3 py-4">
            <Skeleton variant="card" height={52} count={6} />
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div className="py-6">
            <ErrorState
              title="Error Loading Case Data"
              message={error}
              onRetry={() => refetch()}
              retryText="Retry Loading"
            />
          </div>
        )}

        {/* Data Table */}
        {!loading && !error && (
          <>
            {errorRecords.length > 0 ? (
              <div className="overflow-x-auto rounded-xl border border-slate-200/90 dark:border-slate-800/80 shadow-soft-xs">
                <table className="w-full text-left text-sm border-collapse min-w-[760px]">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-600 dark:text-slate-400 font-semibold text-xs uppercase tracking-wider">
                      <th className="py-3 px-4 w-28">Case ID</th>
                      <th className="py-3 px-4">Review Text</th>
                      <th className="py-3 px-4 w-24 text-center">Rating</th>
                      <th className="py-3 px-4 w-28 text-center">True Label</th>
                      <th className="py-3 px-4 w-28 text-center">Predicted</th>
                      <th className="py-3 px-4 w-36 text-center">Fake Prob</th>
                      <th className="py-3 px-3 w-16 text-center">Inspect</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300">
                    {errorRecords.map((row) => {
                      const isExpanded = expandedReviews.has(row.id);
                      const probPercent = Math.round(row.probability * 100);

                      return (
                        <tr
                          key={row.id}
                          onClick={() => setSelectedError(row)}
                          className="hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 transition-colors cursor-pointer group"
                        >
                          {/* ID */}
                          <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                            {row.id}
                          </td>

                          {/* Review Text (Truncated, Expandable on click) */}
                          <td className="py-3.5 px-4 max-w-xs sm:max-w-md">
                            <div className="space-y-1">
                              <p
                                className={`text-xs text-slate-800 dark:text-slate-200 leading-relaxed italic ${
                                  !isExpanded ? 'line-clamp-2' : ''
                                }`}
                              >
                                "{row.review_text}"
                              </p>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={(e) => toggleInlineExpand(row.id, e)}
                                  className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                                >
                                  {isExpanded ? (
                                    <>
                                      <Minimize2 className="w-3 h-3" /> Show less
                                    </>
                                  ) : (
                                    <>
                                      <Maximize2 className="w-3 h-3" /> Expand text
                                    </>
                                  )}
                                </button>
                                <span className="text-[11px] text-slate-400 truncate">
                                  &bull; {row.product_name}
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Rating */}
                          <td className="py-3.5 px-4 text-center">
                            <div className="inline-flex items-center gap-1 font-mono font-semibold text-xs">
                              <span className="text-amber-500 font-bold">{row.rating}</span>
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            </div>
                          </td>

                          {/* True Label */}
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={row.true_label === 'fake' ? 'fake' : 'genuine'}
                              size="sm"
                              dot
                              className="capitalize"
                            >
                              {row.true_label}
                            </Badge>
                          </td>

                          {/* Predicted Label */}
                          <td className="py-3.5 px-4 text-center">
                            <Badge
                              variant={row.predicted_label === 'fake' ? 'fake' : 'genuine'}
                              size="sm"
                              dot
                              className="capitalize"
                            >
                              {row.predicted_label}
                            </Badge>
                          </td>

                          {/* Fake Probability (Inline Progress Bar) */}
                          <td className="py-3.5 px-4">
                            <div className="flex flex-col items-center gap-1">
                              <span className="font-mono text-xs font-bold text-slate-900 dark:text-slate-100">
                                {probPercent}%
                              </span>
                              <div className="w-20 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${
                                    row.probability >= 0.7
                                      ? 'bg-rose-500'
                                      : row.probability >= 0.4
                                      ? 'bg-amber-500'
                                      : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${probPercent}%` }}
                                />
                              </div>
                            </div>
                          </td>

                          {/* Inspect Eye Action Button */}
                          <td className="py-3.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedError(row);
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                              title="Inspect case details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              /* Empty Search Results State */
              <div className="py-8">
                <EmptyState
                  icon={Search}
                  title="No Matching Error Cases"
                  description={
                    debouncedSearch
                      ? `No cases found matching "${debouncedSearch}" in ${activeTab.replace('_', ' ')}s.`
                      : 'No records found for this category.'
                  }
                  actionText={debouncedSearch ? 'Clear Search' : undefined}
                  onAction={() => setSearch('')}
                />
              </div>
            )}

            {/* Server-Style Pagination Footer */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 text-xs text-slate-500 dark:text-slate-400">
                <div>
                  Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{(page - 1) * 10 + 1}</span> to{' '}
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {Math.min(page * 10, totalItems)}
                  </span>{' '}
                  of <span className="font-semibold text-slate-800 dark:text-slate-200">{totalItems}</span> cases
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pageNum = idx + 1;
                    const isCurrent = pageNum === page;

                    return (
                      <button
                        key={pageNum}
                        type="button"
                        onClick={() => setPage(pageNum)}
                        className={`min-w-8 h-8 px-2 rounded-lg font-medium transition-colors text-xs ${
                          isCurrent
                            ? 'bg-indigo-600 text-white font-bold'
                            : 'border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </Card>

      {/* Side Drawer Inspection Panel */}
      {selectedError && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          {/* Backdrop (closes on click) */}
          <div
            className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
            onClick={() => setSelectedError(null)}
            aria-hidden="true"
          />

          {/* Drawer Panel */}
          <div className="fixed inset-y-0 right-0 w-full max-w-lg bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-soft-xl flex flex-col p-6 overflow-y-auto animate-in slide-in-from-right duration-250">
            {/* Drawer Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-base font-bold text-slate-900 dark:text-slate-100">
                    {selectedError.id}
                  </span>
                  <Badge
                    variant={
                      selectedError.error_type === 'false_positive'
                        ? 'fake'
                        : selectedError.error_type === 'false_negative'
                        ? 'warning'
                        : 'primary'
                    }
                    size="sm"
                    dot
                  >
                    {selectedError.error_type.replace('_', ' ')}
                  </Badge>
                </div>
                <p className="text-xs text-slate-500">Diagnostic Inspection Case</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedError(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title="Close drawer (Esc)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body Content */}
            <div className="py-5 space-y-5 flex-1">
              {/* Full Review Text Quote */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Full Customer Review
                </span>
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-sm text-slate-800 dark:text-slate-200 leading-relaxed italic">
                  "{selectedError.review_text}"
                </div>
              </div>

              {/* Review & Target Metadata */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 text-xs">
                <div className="space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <ShoppingBag className="w-3.5 h-3.5" /> Product
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {selectedError.product_name}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> Author ID
                  </span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {selectedError.reviewer_id}
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium flex items-center gap-1">
                    <Star className="w-3.5 h-3.5" /> Rating
                  </span>
                  <p className="font-semibold text-amber-500 flex items-center gap-1">
                    {selectedError.rating} Stars
                  </p>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 font-medium">Confidence Delta</span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    &plusmn;{selectedError.confidence_delta}
                  </p>
                </div>
              </div>

              {/* Prediction Breakdown Table */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Inference Discrepancy
                </span>
                <div className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">Ground Truth Label:</span>
                    <Badge
                      variant={selectedError.true_label === 'fake' ? 'fake' : 'genuine'}
                      size="sm"
                      dot
                      className="capitalize font-bold"
                    >
                      {selectedError.true_label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">Model Predicted Label:</span>
                    <Badge
                      variant={selectedError.predicted_label === 'fake' ? 'fake' : 'genuine'}
                      size="sm"
                      dot
                      className="capitalize font-bold"
                    >
                      {selectedError.predicted_label}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800 text-xs">
                    <span className="text-slate-500">Model Fake Probability:</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                      {Math.round(selectedError.probability * 100)}%
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-3 text-xs pt-1">
                    <span className="text-slate-500 shrink-0">Primary Misleading Factor:</span>
                    <span className="font-semibold text-right text-rose-700 dark:text-rose-400">
                      {selectedError.primary_factor}
                    </span>
                  </div>
                </div>
              </div>

              {/* Short Note Explaining This Type of Error */}
              {(() => {
                const note = ERROR_EXPLANATIONS[selectedError.error_type] || ERROR_EXPLANATIONS.low_confidence;

                return (
                  <div className="p-4 rounded-xl border border-indigo-200/80 dark:border-indigo-900/60 bg-indigo-50/50 dark:bg-indigo-950/20 space-y-2 text-xs">
                    <div className="flex items-center gap-2 font-bold text-indigo-900 dark:text-indigo-200">
                      <HelpCircle className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
                      <span>{note.title}</span>
                    </div>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {note.explanation}
                    </p>
                    <div className="pt-2 border-t border-indigo-200/50 dark:border-indigo-800/40 text-indigo-950 dark:text-indigo-200">
                      <strong>Moderator Recommendation:</strong> {note.moderatorAction}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Drawer Footer Actions */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedError(null)}
              >
                Close (Esc)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ErrorsPage;
