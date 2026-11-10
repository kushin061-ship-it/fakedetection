import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
  PieChart,
  Pie,
} from 'recharts';
import {
  BrainCircuit,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  FileText,
  Activity,
  Clock,
  Sparkles,
  ArrowUpDown,
  Layers,
  HelpCircle,
  RefreshCw,
} from 'lucide-react';
import { getGlobalExplain, useApi } from '../api';
import { useDarkMode } from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

// Distinct group colors according to Design System
const GROUP_COLORS = {
  textual: '#3b82f6',    // Blue
  behavioral: '#f59e0b', // Amber
  temporal: '#a855f7',   // Purple
};

const GROUP_ICONS = {
  textual: FileText,
  behavioral: Activity,
  temporal: Clock,
};

/**
 * Custom dark-mode aware tooltip for Horizontal Bar Chart
 */
function ShapBarTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const groupColor = GROUP_COLORS[data.group] || '#6366f1';

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3.5 rounded-xl shadow-soft-lg text-xs space-y-1.5 max-w-xs z-50">
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800/60 pb-1.5">
          <span className="font-bold text-slate-900 dark:text-slate-100 truncate">
            #{data.rank} {data.displayName || data.name}
          </span>
          <span
            className="px-2 py-0.5 rounded-md font-semibold text-[10px] uppercase tracking-wider text-white shrink-0"
            style={{ backgroundColor: groupColor }}
          >
            {data.group}
          </span>
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-slate-500 dark:text-slate-400">Mean |SHAP| Impact:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-50">
            {data.mean_abs_shap?.toFixed(3)}
          </span>
        </div>
        <div className="text-[11px] text-slate-600 dark:text-slate-300 pt-1 leading-snug">
          {data.description}
        </div>
        <div className="text-[11px] font-medium text-indigo-600 dark:text-indigo-400 pt-0.5">
          {data.direction}
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Custom tooltip for Donut Chart
 */
function DonutTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const item = payload[0];
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3 rounded-xl shadow-soft-lg text-xs space-y-1 min-w-[140px]">
        <div className="flex items-center gap-1.5">
          <span
            className="w-2.5 h-2.5 rounded-full shrink-0"
            style={{ backgroundColor: item.payload.color || item.color }}
          />
          <span className="font-bold text-slate-900 dark:text-slate-100">
            {item.name}
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-600 dark:text-slate-300 pt-1">
          <span>Importance:</span>
          <span className="font-mono font-bold text-slate-900 dark:text-slate-50">
            {item.value?.toFixed(1)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-3 text-slate-500 text-[11px]">
          <span>Total SHAP:</span>
          <span className="font-mono">
            {item.payload.totalMeanShap?.toFixed(3)}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

export function ExplainabilityPage() {
  const { data: explainData, loading, error, refetch } = useApi(getGlobalExplain, []);
  const { isDark } = useDarkMode();

  // Filter state for top features: 'all' | 'textual' | 'behavioral' | 'temporal'
  const [selectedGroup, setSelectedGroup] = useState('all');

  // Search query for glossary table
  const [glossarySearch, setGlossarySearch] = useState('');

  // Sort state for glossary table
  const [sortField, setSortField] = useState('rank');
  const [sortOrder, setSortOrder] = useState('asc');

  // Collapsible state for "How to read this" card
  const [isGuideOpen, setIsGuideOpen] = useState(true);

  // Styling tokens for charts
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  // Filtered top features for chart display
  const chartFeatures = useMemo(() => {
    if (!explainData?.features) return [];
    if (selectedGroup === 'all') return explainData.features;
    return explainData.features.filter((f) => f.group === selectedGroup);
  }, [explainData, selectedGroup]);

  // Features sorted for horizontal bar chart (highest at top)
  const sortedChartFeatures = useMemo(() => {
    return [...chartFeatures].sort((a, b) => b.mean_abs_shap - a.mean_abs_shap);
  }, [chartFeatures]);

  // Filtered and sorted glossary features
  const glossaryFeatures = useMemo(() => {
    if (!explainData?.features) return [];
    let list = explainData.features;

    // Filter by group if not 'all'
    if (selectedGroup !== 'all') {
      list = list.filter((f) => f.group === selectedGroup);
    }

    // Filter by search term
    if (glossarySearch.trim()) {
      const q = glossarySearch.toLowerCase().trim();
      list = list.filter(
        (f) =>
          f.name.toLowerCase().includes(q) ||
          (f.displayName && f.displayName.toLowerCase().includes(q)) ||
          f.group.toLowerCase().includes(q) ||
          f.description.toLowerCase().includes(q) ||
          f.direction.toLowerCase().includes(q)
      );
    }

    // Sort
    return [...list].sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') {
        const cmp = valA.localeCompare(valB);
        return sortOrder === 'asc' ? cmp : -cmp;
      }
      return sortOrder === 'asc' ? valA - valB : valB - valA;
    });
  }, [explainData, selectedGroup, glossarySearch, sortField, sortOrder]);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Feature Explainability (SHAP)"
          subtitle="Global model interpretation via TreeSHAP attributions across Textual, Behavioral, and Temporal domains."
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
          <Skeleton variant="card" className="h-32" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" className="lg:col-span-2 h-[450px]" />
          <Skeleton variant="card" className="h-[450px]" />
        </div>
        <Skeleton variant="card" className="h-80" />
      </div>
    );
  }

  if (error || !explainData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Feature Explainability (SHAP)"
          subtitle="Global model interpretation via TreeSHAP attributions across Textual, Behavioral, and Temporal domains."
        />
        <Card className="p-8">
          <ErrorState
            title="Failed to Load Explainability Metrics"
            message={error || 'Unable to retrieve global SHAP feature importances from model runtime.'}
            onRetry={refetch}
          />
        </Card>
      </div>
    );
  }

  const { groupSummary = [] } = explainData;
  const behavioralGroup = groupSummary.find((g) => g.group === 'behavioral');
  const textualGroup = groupSummary.find((g) => g.group === 'textual');
  const temporalGroup = groupSummary.find((g) => g.group === 'temporal');

  const donutData = groupSummary.map((g) => ({
    name: g.name,
    value: g.percentage,
    color: g.color || GROUP_COLORS[g.group],
    totalMeanShap: g.totalMeanShap,
    featureCount: g.featureCount,
  }));

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Page Header */}
      <PageHeader
        title="Feature Explainability (SHAP)"
        subtitle="Global model interpretation via TreeSHAP attributions across Textual, Behavioral, and Temporal feature groups."
        badge={
          <Badge variant="primary" dot size="sm">
            XGBoost Global SHAP v2.4
          </Badge>
        }
        actions={
          <Button variant="secondary" icon={RefreshCw} onClick={refetch}>
            Refresh Attribution
          </Button>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Explainability
          </span>
        }
      />

      {/* 1. Collapsible 'How to read this' Guide Card */}
      <Card className="border-indigo-100 dark:border-indigo-950/60 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-indigo-950/20 shadow-soft-sm">
        <div
          className="p-5 flex items-center justify-between cursor-pointer select-none"
          onClick={() => setIsGuideOpen((prev) => !prev)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-950/80 text-indigo-600 dark:text-indigo-400">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-slate-100">
                How to Read SHAP Feature Attributions
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Understanding Shapley Additive Explanations and model association limits
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label={isGuideOpen ? 'Collapse guide' : 'Expand guide'}
          >
            {isGuideOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {isGuideOpen && (
          <div className="px-5 pb-5 pt-1 border-t border-indigo-100/60 dark:border-indigo-950/40 text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-3">
            <p>
              <strong>What is SHAP?</strong> SHAP (Shapley Additive exPlanations) connects cooperative game theory with optimal credit allocation. The <em>Mean |SHAP|</em> value indicates how much each feature alters the model&apos;s decision boundary away from the baseline base rate (18% fake). Higher bars indicate stronger predictive leverage.
            </p>
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50 text-amber-900 dark:text-amber-200 text-xs">
              <strong>Important Note:</strong> SHAP values illustrate statistical model associations within the training corpus. They reflect patterns that machine learning classifiers prioritize, but <em>do not constitute legal or definitive proof of fraudulent intent</em>. Human moderator discretion remains essential.
            </div>
          </div>
        )}
      </Card>

      {/* 2. Group Importance StatCards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Textual Feature Weight"
          value={`${textualGroup?.percentage || 35.8}%`}
          icon={FileText}
          description="Sentiment polarity, review length, punctuation density, repeated n-grams"
          className="border-l-4 border-l-blue-500"
        />
        <StatCard
          label="Behavioral Feature Weight"
          value={`${behavioralGroup?.percentage || 38.6}%`}
          icon={Activity}
          description="Same-day review velocity, rating extremity, verified purchases, account age"
          className="border-l-4 border-l-amber-500"
        />
        <StatCard
          label="Temporal Feature Weight"
          value={`${temporalGroup?.percentage || 25.6}%`}
          icon={Clock}
          description="Coordinated burst windows, post-launch timing, diurnal posting rhythms"
          className="border-l-4 border-l-purple-500"
        />
      </div>

      {/* 3. Filter Chips */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Domain Filter:
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {[
            { id: 'all', label: 'All Features', count: explainData.features?.length || 20 },
            { id: 'textual', label: 'Textual Only', color: 'blue', count: 8 },
            { id: 'behavioral', label: 'Behavioral Only', color: 'amber', count: 6 },
            { id: 'temporal', label: 'Temporal Only', color: 'purple', count: 6 },
          ].map((chip) => {
            const isSelected = selectedGroup === chip.id;
            return (
              <button
                key={chip.id}
                type="button"
                onClick={() => setSelectedGroup(chip.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 shadow-soft-xs ${
                  isSelected
                    ? chip.id === 'textual'
                      ? 'bg-blue-600 text-white shadow-blue-500/20'
                      : chip.id === 'behavioral'
                      ? 'bg-amber-600 text-white shadow-amber-500/20'
                      : chip.id === 'temporal'
                      ? 'bg-purple-600 text-white shadow-purple-500/20'
                      : 'bg-indigo-600 text-white shadow-indigo-500/20'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/80 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>{chip.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {chip.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Main Charts: Top 20 Horizontal Bar Chart + Donut Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Horizontal Bar Chart (Col 1 & 2) */}
        <Card className="lg:col-span-2 p-6 flex flex-col justify-between">
          <CardHeader className="px-0 pt-0 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                  <BrainCircuit className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  Top Global Predictive Features (Mean |SHAP|)
                </CardTitle>
                <CardDescription className="text-xs">
                  {selectedGroup === 'all'
                    ? 'Showing all 20 benchmarked features colored by feature domain'
                    : `Showing filtered ${selectedGroup} features ranked by importance`}
                </CardDescription>
              </div>
              <Badge variant="neutral" size="sm" className="hidden sm:inline-flex">
                10,000 Evaluations
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="px-0 pb-0">
            <div className="h-[520px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  layout="vertical"
                  data={sortedChartFeatures}
                  margin={{ top: 10, right: 30, left: 40, bottom: 20 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} horizontal={false} opacity={0.6} />
                  <XAxis
                    type="number"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridColor }}
                    domain={[0, 0.5]}
                    tickFormatter={(v) => v.toFixed(2)}
                  />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    stroke={axisColor}
                    tick={{ fill: axisColor, fontSize: 11 }}
                    tickLine={{ stroke: gridColor }}
                    width={160}
                  />
                  <Tooltip content={<ShapBarTooltip />} />
                  <Bar dataKey="mean_abs_shap" radius={[0, 6, 6, 0]} barSize={16}>
                    {sortedChartFeatures.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={GROUP_COLORS[entry.group] || '#6366f1'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Chart Legend */}
            <div className="flex flex-wrap items-center justify-center gap-5 pt-4 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Textual</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-amber-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Behavioral</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-purple-500" />
                <span className="text-slate-600 dark:text-slate-400 font-medium">Temporal</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Donut Chart: Domain Importance Share (Col 3) */}
        <Card className="p-6 flex flex-col justify-between">
          <CardHeader className="px-0 pt-0 pb-4">
            <CardTitle className="text-base sm:text-lg flex items-center gap-2">
              <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              Domain Contribution
            </CardTitle>
            <CardDescription className="text-xs">
              Cumulative SHAP weight distribution across the 3 domains
            </CardDescription>
          </CardHeader>

          <CardContent className="px-0 pb-0 flex-1 flex flex-col items-center justify-center">
            <div className="h-[280px] w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<DonutTooltip />} />
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={105}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              {/* Inner Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-900 dark:text-slate-100 font-mono">
                  100%
                </span>
                <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">
                  3 Domains
                </span>
              </div>
            </div>

            {/* Domain Breakdown Cards */}
            <div className="w-full space-y-2.5 pt-4">
              {groupSummary.map((group) => {
                const Icon = GROUP_ICONS[group.group] || Sparkles;
                return (
                  <div
                    key={group.group}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg text-white"
                        style={{ backgroundColor: group.color || GROUP_COLORS[group.group] }}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800 dark:text-slate-200">
                          {group.name}
                        </p>
                        <p className="text-[10px] text-slate-500">
                          {group.featureCount} Key Features
                        </p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                      {group.percentage}%
                    </span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 5. Searchable Feature Glossary Table */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-slate-200/80 dark:border-slate-800">
          <div>
            <CardTitle className="text-base sm:text-lg">
              Feature Glossary & Technical Specifications
            </CardTitle>
            <CardDescription className="text-xs">
              Detailed descriptions, mean SHAP weights, and directional tendencies for all audited model signals
            </CardDescription>
          </div>

          {/* Search Box */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search feature or keyword..."
              value={glossarySearch}
              onChange={(e) => setGlossarySearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-900 dark:text-slate-100 placeholder-slate-400"
            />
          </div>
        </div>

        {/* Glossary Table */}
        <div className="overflow-x-auto mt-4">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 font-semibold">
                <th
                  onClick={() => toggleSort('rank')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Rank</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  onClick={() => toggleSort('displayName')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Feature Name</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Domain</th>
                <th
                  onClick={() => toggleSort('mean_abs_shap')}
                  className="py-3 px-3 cursor-pointer hover:text-slate-900 dark:hover:text-slate-200"
                >
                  <div className="flex items-center gap-1">
                    <span>Mean |SHAP|</span>
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="py-3 px-3">Impact</th>
                <th className="py-3 px-3">Directional Association</th>
                <th className="py-3 px-3 min-w-[280px]">Plain-English Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {glossaryFeatures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500">
                    No features match &quot;{glossarySearch}&quot;.
                  </td>
                </tr>
              ) : (
                glossaryFeatures.map((item) => {
                  const groupBadgeVariant =
                    item.group === 'textual'
                      ? 'textual'
                      : item.group === 'behavioral'
                      ? 'behavioral'
                      : 'temporal';

                  return (
                    <tr
                      key={item.name}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-700 dark:text-slate-300">
                        #{item.rank}
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{item.displayName || item.name}</div>
                        <code className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                          {item.name}
                        </code>
                      </td>
                      <td className="py-3 px-3">
                        <Badge variant={groupBadgeVariant} size="sm">
                          {item.group}
                        </Badge>
                      </td>
                      <td className="py-3 px-3 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {item.mean_abs_shap?.toFixed(3)}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded text-[10px] font-semibold ${
                            item.impact === 'High'
                              ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                              : item.impact === 'Medium'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {item.impact}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-400 text-xs font-medium">
                        {item.direction}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 leading-snug">
                        {item.description}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

export default ExplainabilityPage;
