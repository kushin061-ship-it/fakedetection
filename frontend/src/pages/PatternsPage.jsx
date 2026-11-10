import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  BarChart,
  Bar,
  ReferenceLine,
} from 'recharts';
import {
  Fingerprint,
  Users,
  Flame,
  Search,
  Sliders,
  AlertTriangle,
  ArrowUpDown,
  Star,
  ExternalLink,
  ShieldAlert,
  RefreshCw,
  Info,
  Calendar,
  Package,
} from 'lucide-react';
import { getPatterns, getReviewer, useApi } from '../api';
import { useDarkMode } from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';
import Drawer from '../components/Drawer';

/**
 * Custom dark-mode aware Tooltip for Scatter Chart
 */
function ScatterTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3.5 rounded-xl shadow-soft-lg text-xs space-y-1.5 max-w-xs z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {data.id}: {data.rule ? data.rule.split('=>')[0].trim() : 'Association Rule'}
          </span>
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 font-semibold">
            Lift: {data.lift?.toFixed(2)}x
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
          <div>
            <span className="text-slate-500">Support:</span>{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {(data.support * 100).toFixed(1)}%
            </span>
          </div>
          <div>
            <span className="text-slate-500">Confidence:</span>{' '}
            <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
              {(data.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
        <p className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 leading-snug">
          {data.description}
        </p>
      </div>
    );
  }
  return null;
}

export function PatternsPage() {
  const { data: patternsData, loading, error, refetch } = useApi(getPatterns, []);
  const { isDark } = useDarkMode();

  // Pattern table state
  const [minLift, setMinLift] = useState(4.5);
  const [patternSortField, setPatternSortField] = useState('lift');
  const [patternSortOrder, setPatternSortOrder] = useState('desc');

  // Search query for reviewer ID lookup
  const [reviewerSearchId, setReviewerSearchId] = useState('');
  const [searchError, setSearchError] = useState(null);
  const [isSearchingReviewer, setIsSearchingReviewer] = useState(false);

  // Drawer state for selected reviewer profile
  const [selectedReviewer, setSelectedReviewer] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [loadingReviewer, setLoadingReviewer] = useState(false);

  // Chart styling tokens
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  // Filtered and sorted patterns
  const filteredPatterns = useMemo(() => {
    if (!patternsData?.patterns) return [];
    let list = patternsData.patterns.filter((p) => p.lift >= minLift);

    return list.sort((a, b) => {
      let valA = a[patternSortField];
      let valB = b[patternSortField];
      if (typeof valA === 'string') {
        return patternSortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return patternSortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [patternsData, minLift, patternSortField, patternSortOrder]);

  const togglePatternSort = (field) => {
    if (patternSortField === field) {
      setPatternSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setPatternSortField(field);
      setPatternSortOrder('desc');
    }
  };

  // Open reviewer profile in Drawer
  const handleOpenReviewer = async (reviewerId) => {
    if (!reviewerId) return;
    setLoadingReviewer(true);
    setSearchError(null);
    try {
      const data = await getReviewer(reviewerId);
      setSelectedReviewer(data);
      setIsDrawerOpen(true);
    } catch (err) {
      setSearchError(err.message || `Reviewer ID "${reviewerId}" was not found or is invalid.`);
    } finally {
      setLoadingReviewer(false);
    }
  };

  // Handle direct reviewer ID search form submit
  const handleSearchSubmit = async (e) => {
    e.preventDefault();
    if (!reviewerSearchId.trim()) {
      setSearchError('Please enter a reviewer ID to search.');
      return;
    }
    setIsSearchingReviewer(true);
    setSearchError(null);
    try {
      const data = await getReviewer(reviewerSearchId.trim());
      setSelectedReviewer(data);
      setIsDrawerOpen(true);
      setReviewerSearchId('');
    } catch (err) {
      setSearchError(err.message || `No reviewer found for ID "${reviewerSearchId}".`);
    } finally {
      setIsSearchingReviewer(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Suspicious Patterns & Syndicates"
          subtitle="Uncover data-mined association rules and investigate high-risk suspicious reviewers and astroturf rings."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
        </div>
        <Skeleton variant="card" className="h-[400px]" />
        <Skeleton variant="card" className="h-[450px]" />
      </div>
    );
  }

  if (error || !patternsData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Suspicious Patterns & Syndicates"
          subtitle="Uncover data-mined association rules and investigate high-risk suspicious reviewers and astroturf rings."
        />
        <Card className="p-8">
          <ErrorState
            title="Failed to Load Pattern Mining Engine"
            message={error || 'Unable to fetch association rules and suspicious reviewer clusters.'}
            onRetry={refetch}
          />
        </Card>
      </div>
    );
  }

  const { patterns = [], suspiciousReviewers = [] } = patternsData;

  // Max lift for progress bar scaling
  const maxLiftValue = 6.0;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Suspicious Patterns & Syndicates"
        subtitle="Uncover data-mined association rules (support, confidence, lift) and investigate high-risk suspicious reviewers and astroturf rings."
        badge={
          <Badge variant="fake" dot size="sm">
            20 Mined Rules &bull; 15 High-Risk Accounts
          </Badge>
        }
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={refetch}>
            Refresh Patterns
          </Button>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Suspicious Patterns
          </span>
        }
      />

      {/* Prominent Disclaimer Note */}
      <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/90 dark:border-amber-800/80 flex items-start gap-3 shadow-soft-xs text-xs sm:text-sm text-amber-900 dark:text-amber-200">
        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold">Analytic Disclaimer:</span> Patterns are statistical associations and should not be treated as proof of fraud. These heuristics highlight high-entropy combinations where review behaviors deviate significantly from organic marketplace baselines.
        </div>
      </div>

      {/* StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Highest Lift Rule"
          value="Lift 5.41x"
          icon={Flame}
          description="Syndicate Subnet / IP + Unverified Purchase => Fake"
          trend={{ value: 'Conf 97.3%', isPositive: true }}
          className="border-l-4 border-l-rose-500"
        />
        <StatCard
          label="Tracked Suspicious Reviewers"
          value="15 Accounts"
          icon={Users}
          description="Average fake submission share of 82.5% across platform"
          className="border-l-4 border-l-amber-500"
        />
        <StatCard
          label="Identified Surge Windows"
          value="104 Bursts"
          icon={ShieldAlert}
          description="Coordinated launch spikes and competitor smear campaigns"
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* 1. Support vs. Confidence Scatter Chart (Bubble Size = Lift) */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Association Rules Distribution (Support vs. Confidence)
              </CardTitle>
              <CardDescription className="text-xs">
                Bubble size reflects rule Lift multiplier (&gt; 1.2 baseline). Hover to inspect antecedent combinations.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1 font-semibold text-rose-600 dark:text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> High Lift (&gt; 5.0x)
              </span>
              <span className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" /> Standard Lift
              </span>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="h-[360px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 20, right: 30, bottom: 20, left: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                <XAxis
                  type="number"
                  dataKey="support"
                  name="Support"
                  unit="%"
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={(val) => (val * 100).toFixed(1)}
                  domain={[0.02, 0.10]}
                  label={{ value: 'Dataset Support (%)', position: 'bottom', offset: 0, fill: axisColor, fontSize: 11 }}
                />
                <YAxis
                  type="number"
                  dataKey="confidence"
                  name="Confidence"
                  unit="%"
                  stroke={axisColor}
                  tick={{ fill: axisColor, fontSize: 11 }}
                  tickFormatter={(val) => (val * 100).toFixed(0)}
                  domain={[0.82, 1.00]}
                  label={{ value: 'Rule Confidence (%)', angle: -90, position: 'left', offset: 0, fill: axisColor, fontSize: 11 }}
                />
                <ZAxis type="number" dataKey="lift" range={[80, 420]} name="Lift" />
                <Tooltip content={<ScatterTooltip />} />
                <Scatter name="Association Rules" data={patterns}>
                  {patterns.map((entry, index) => (
                    <Cell
                      key={`scatter-cell-${index}`}
                      fill={entry.lift >= 5.0 ? '#f43f5e' : '#6366f1'}
                      fillOpacity={0.85}
                      stroke={entry.lift >= 5.0 ? '#e11d48' : '#4f46e5'}
                      strokeWidth={1.5}
                    />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* 2. Association Pattern Table with Chips & Minimum Lift Slider */}
      <Card className="p-6">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Data-Mined Association Rules
            </CardTitle>
            <CardDescription className="text-xs">
              Mined via Apriori / FP-Growth algorithms from 50,000 labeled reviews (filtered by minimum Lift threshold)
            </CardDescription>
          </div>

          {/* Minimum-Lift Slider */}
          <div className="flex items-center gap-3 w-full sm:w-auto bg-slate-50 dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
            <Sliders className="w-4 h-4 text-slate-500 shrink-0" />
            <div className="space-y-1">
              <div className="flex items-center justify-between text-xs gap-4">
                <span className="text-slate-500 font-medium">Min Lift Filter:</span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {minLift.toFixed(2)}x
                </span>
              </div>
              <input
                type="range"
                min="1.2"
                max="5.3"
                step="0.1"
                value={minLift}
                onChange={(e) => setMinLift(parseFloat(e.target.value))}
                className="w-44 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
            </div>
            <span className="text-[11px] font-mono text-slate-400">
              ({filteredPatterns.length} of {patterns.length})
            </span>
          </div>
        </div>

        {/* Pattern Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th
                  onClick={() => togglePatternSort('id')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>ID</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3 min-w-[340px]">Rule Antecedents (Features)</th>
                <th
                  onClick={() => togglePatternSort('support')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Support</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => togglePatternSort('confidence')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Confidence</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => togglePatternSort('lift')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200 min-w-[160px]"
                >
                  <div className="flex items-center gap-1">
                    <span>Lift Multiplier</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Risk Level</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredPatterns.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-slate-500">
                    No patterns meet the minimum lift of {minLift.toFixed(2)}x. Adjust the slider above.
                  </td>
                </tr>
              ) : (
                filteredPatterns.map((p) => {
                  // Split antecedent features either from array or rule string
                  const tokens = p.antecedents || p.rule.split('=>')[0].split('+').map((s) => s.trim());
                  const liftPercent = Math.min(100, Math.round((p.lift / maxLiftValue) * 100));

                  return (
                    <tr
                      key={p.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        {p.id}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {tokens.map((token, tIdx) => (
                            <React.Fragment key={tIdx}>
                              <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium border border-slate-200 dark:border-slate-700 text-[11px]">
                                {token}
                              </span>
                              {tIdx < tokens.length - 1 && (
                                <span className="text-slate-400 font-bold text-xs">+</span>
                              )}
                            </React.Fragment>
                          ))}
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-xs px-1">&rarr;</span>
                          <span className="px-2 py-0.5 rounded-md bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 font-semibold border border-rose-200 dark:border-rose-900/60 text-[11px]">
                            Fake
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">
                        {(p.support * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3 font-mono font-semibold text-right text-slate-800 dark:text-slate-200">
                        {(p.confidence * 100).toFixed(1)}%
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                              {p.lift.toFixed(2)}x
                            </span>
                            <span className="text-[10px] text-slate-400">vs 1.0 baseline</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                p.lift >= 5.0 ? 'bg-rose-500' : 'bg-indigo-600'
                              }`}
                              style={{ width: `${liftPercent}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3">
                        <Badge
                          variant={p.riskLevel === 'critical' ? 'fake' : p.riskLevel === 'high' ? 'warning' : 'neutral'}
                          size="sm"
                        >
                          {p.riskLevel || (p.lift >= 5.0 ? 'Critical' : 'High')}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 3. Reviewer ID Direct Search Bar */}
      <Card className="p-6 border-indigo-200 dark:border-indigo-900/80 bg-gradient-to-r from-indigo-50/40 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20">
        <form onSubmit={handleSearchSubmit} className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Search className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                Reviewer ID Investigation Lookup
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Inspect any reviewer ID (e.g. <button type="button" onClick={() => handleOpenReviewer('REV-USR-0104')} className="underline text-indigo-600 dark:text-indigo-400 font-mono">REV-USR-0104</button>, <button type="button" onClick={() => handleOpenReviewer('REV-USR-0188')} className="underline text-indigo-600 dark:text-indigo-400 font-mono">REV-USR-0188</button>, <button type="button" onClick={() => handleOpenReviewer('USR-GEN-1000')} className="underline text-indigo-600 dark:text-indigo-400 font-mono">USR-GEN-1000</button>) to load their activity timeline.
              </p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Enter Reviewer ID..."
                value={reviewerSearchId}
                onChange={(e) => {
                  setReviewerSearchId(e.target.value);
                  setSearchError(null);
                }}
                className="w-full sm:w-56 px-3.5 py-2 text-xs rounded-xl bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
              />
              <Button
                type="submit"
                variant="primary"
                loading={isSearchingReviewer || loadingReviewer}
              >
                Inspect
              </Button>
            </div>
          </div>

          {searchError && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}
        </form>
      </Card>

      {/* 4. Top Suspicious Reviewers Table */}
      <Card className="p-6">
        <CardHeader className="px-0 pt-0 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                Top Suspicious Reviewers & Bot Syndicate Nodes
              </CardTitle>
              <CardDescription className="text-xs">
                Click any reviewer row to slide open full behavioral metrics, timeline chart, and review history.
              </CardDescription>
            </div>
            <Badge variant="fake" size="sm">
              15 Flagged Profiles
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="px-0 pb-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                  <th className="py-3 px-3">Reviewer ID</th>
                  <th className="py-3 px-3">Username / Alias</th>
                  <th className="py-3 px-3 text-right">Lifetime Reviews</th>
                  <th className="py-3 px-3 min-w-[150px]">Fake Share %</th>
                  <th className="py-3 px-3 text-center">Burst Count</th>
                  <th className="py-3 px-3">Dominant Pattern</th>
                  <th className="py-3 px-3">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {suspiciousReviewers.map((rev) => {
                  const fakePct = Math.round(rev.fake_share * 100);

                  return (
                    <tr
                      key={rev.id}
                      onClick={() => handleOpenReviewer(rev.id)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-800 dark:text-slate-200 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 flex items-center gap-1.5">
                        <Fingerprint className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500" />
                        {rev.id}
                      </td>
                      <td className="py-3.5 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {rev.name}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-right font-semibold text-slate-700 dark:text-slate-300">
                        {rev.total_reviews}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
                              {fakePct}%
                            </span>
                            <span className="text-[10px] text-slate-400">fake rate</span>
                          </div>
                          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-rose-500 rounded-full"
                              style={{ width: `${fakePct}%` }}
                            />
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-3 text-center font-mono font-bold text-amber-600 dark:text-amber-400">
                        {rev.burst_count} surges
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-300">
                        <code className="text-[11px] bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded font-mono">
                          {rev.dominant_pattern}
                        </code>
                      </td>
                      <td className="py-3.5 px-3">
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-semibold text-xs group-hover:underline">
                          Inspect <ExternalLink className="w-3 h-3" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* 5. Reviewer Inspection Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={selectedReviewer?.name || 'Reviewer Profile Audit'}
        subtitle={
          selectedReviewer
            ? `ID: ${selectedReviewer.id} • Registered ${selectedReviewer.account_created_at || 'Recently'}`
            : ''
        }
        size="lg"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Risk Score: <strong className="font-mono text-rose-600 dark:text-rose-400">{selectedReviewer?.risk_score || 0}/100</strong>
            </span>
            <Button variant="secondary" onClick={() => setIsDrawerOpen(false)}>
              Close Panel
            </Button>
          </div>
        }
      >
        {selectedReviewer && (
          <div className="space-y-6">
            {/* Header Status Card */}
            <div
              className={`p-4 rounded-xl border ${
                selectedReviewer.status === 'fake' || selectedReviewer.status === 'flagged' || selectedReviewer.status === 'banned'
                  ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
                  : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Badge
                  variant={
                    selectedReviewer.status === 'fake' || selectedReviewer.status === 'flagged' || selectedReviewer.status === 'banned'
                      ? 'fake'
                      : 'genuine'
                  }
                  size="md"
                  dot
                >
                  {selectedReviewer.reputation_tier || selectedReviewer.status?.toUpperCase()}
                </Badge>
                <span className="font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                  {selectedReviewer.email}
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2">
                Account age: <strong>{selectedReviewer.account_age_days || 30} days</strong> &bull; Verified Purchases:{' '}
                <strong>{Math.round((selectedReviewer.verified_purchases_ratio || 0.1) * 100)}%</strong>
              </p>
            </div>

            {/* Reviewer Stats Cards: average rating, rating variance, extreme-rating ratio, burst count */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Behavioral Anomaly Metrics
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Average Rating</span>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedReviewer.stats?.average_rating?.toFixed(2) || '4.95'} ★
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Rating Variance</span>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedReviewer.stats?.rating_variance?.toFixed(2) || '0.14'}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Extreme Rating Ratio</span>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {Math.round((selectedReviewer.stats?.extreme_rating_ratio || 0.95) * 100)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Total Reviews</span>
                  <p className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedReviewer.stats?.total_reviews || 0}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Fake Share</span>
                  <p className="text-base font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                    {selectedReviewer.stats?.fake_percentage?.toFixed(1) || (selectedReviewer.stats?.fake_share * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-[11px] text-slate-500">Burst Windows</span>
                  <p className="text-base font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                    {selectedReviewer.stats?.burst_count || 0} Spikes
                  </p>
                </div>
              </div>
            </div>

            {/* Review Activity Timeline Chart */}
            {selectedReviewer.timeline && selectedReviewer.timeline.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Recent Review Timeline & Burst Correlation
                  </h4>
                  <span className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    Red Bars = Coordinated Burst Spikes
                  </span>
                </div>
                <div className="h-44 w-full bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={selectedReviewer.timeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={gridColor} opacity={0.6} />
                      <XAxis
                        dataKey="date"
                        stroke={axisColor}
                        tick={{ fill: axisColor, fontSize: 10 }}
                      />
                      <YAxis
                        stroke={axisColor}
                        tick={{ fill: axisColor, fontSize: 10 }}
                        domain={[0, 1]}
                        tickFormatter={(v) => `${(v * 100).toFixed(0)}%`}
                      />
                      <ReferenceLine y={0.5} stroke="#94a3b8" strokeDasharray="3 3" label={{ value: 'Threshold', fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const item = payload[0].payload;
                            return (
                              <div className="bg-white/95 dark:bg-slate-900/95 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs shadow-soft-sm">
                                <p className="font-bold text-slate-900 dark:text-slate-100">{item.product_name}</p>
                                <p className="text-slate-500 text-[11px]">{item.date} &bull; Rating: {item.rating}★</p>
                                <p className="font-mono font-bold mt-1 text-rose-600 dark:text-rose-400">
                                  Fake Prob: {(item.fake_probability * 100).toFixed(1)}% {item.is_burst ? '(Burst Surge)' : ''}
                                </p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="fake_probability" radius={[4, 4, 0, 0]}>
                        {selectedReviewer.timeline.map((entry, index) => (
                          <Cell
                            key={`timeline-cell-${index}`}
                            fill={entry.is_burst ? '#f43f5e' : entry.fake_probability > 0.5 ? '#fb7185' : '#10b981'}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* List of Reviewer's Submissions */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">
                Audit Log of Review Submissions
              </h4>
              <div className="space-y-3">
                {selectedReviewer.timeline?.map((rev, idx) => (
                  <div
                    key={rev.review_id || idx}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-slate-100 truncate">
                        <Package className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                        <span className="truncate">{rev.product_name}</span>
                      </div>
                      <Badge
                        variant={rev.status === 'fake' || rev.fake_probability >= 0.5 ? 'fake' : 'genuine'}
                        size="sm"
                      >
                        {rev.status === 'fake' || rev.fake_probability >= 0.5 ? 'Fake' : 'Genuine'}
                      </Badge>
                    </div>

                    <p className="text-slate-700 dark:text-slate-300 italic">
                      &quot;{rev.review_text}&quot;
                    </p>

                    <div className="flex items-center justify-between pt-1 text-[11px] text-slate-500 border-t border-slate-200/60 dark:border-slate-700/60">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {rev.date}
                        </span>
                        <span className="inline-flex items-center gap-0.5 text-amber-500 font-bold">
                          {rev.rating} <Star className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                      <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                        P(Fake): {(rev.fake_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

export default PatternsPage;
