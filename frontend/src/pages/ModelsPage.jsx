import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  Trophy,
  Award,
  GitCompare,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  CheckCircle2,
  Zap,
  Clock,
  SlidersHorizontal,
} from 'lucide-react';
import { getModelComparison, getConfusion, useApi } from '../api';
import { useDarkMode } from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

// Distinct model color palette for ROC Curves
const MODEL_COLORS = {
  xgboost: '#10b981',             // Emerald (Champion)
  lightgbm: '#3b82f6',            // Blue
  random_forest: '#8b5cf6',       // Purple
  logistic_regression: '#f59e0b', // Amber
  naive_bayes: '#ec4899',         // Pink
};

// Metric metadata configuration
const METRICS_CONFIG = [
  { key: 'accuracy', label: 'Accuracy', color: '#3b82f6', description: 'Overall correct predictions ratio' },
  { key: 'precision', label: 'Precision', color: '#8b5cf6', description: 'Fraction of flagged fakes that are truly fake' },
  { key: 'recall', label: 'Recall', color: '#f59e0b', description: 'Fraction of all fakes successfully caught' },
  { key: 'f1', label: 'F1-Score', color: '#10b981', description: 'Harmonic mean of precision & recall' },
  { key: 'rocAuc', label: 'ROC-AUC', color: '#ec4899', description: 'Area under the ROC discriminatory curve' },
];

/**
 * Custom dark-mode aware Tooltip for Recharts
 */
function ChartTooltip({ active, payload, label, unit = '%' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3 rounded-xl shadow-soft-lg text-xs space-y-1.5 min-w-[150px]">
        {label && (
          <p className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
            {label}
          </p>
        )}
        {payload.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: item.color || item.fill || item.stroke }}
              />
              <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[140px]">
                {item.name}:
              </span>
            </div>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {typeof item.value === 'number' ? `${item.value.toFixed(1)}${unit}` : item.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export function ModelsPage() {
  const { data: comparisonData, loading, error, refetch } = useApi(getModelComparison, []);
  const { isDark } = useDarkMode();

  // Sort state for metrics table
  const [sortConfig, setSortConfig] = useState({ key: 'f1', direction: 'desc' });

  // Toggle active metrics for grouped bar chart
  const [activeMetrics, setActiveMetrics] = useState([
    'accuracy',
    'precision',
    'recall',
    'f1',
    'rocAuc',
  ]);

  // Model selector state for confusion matrix
  const [selectedModelId, setSelectedModelId] = useState('xgboost');

  // Interactive toggle for ROC curve lines
  const [visibleRocModels, setVisibleRocModels] = useState([
    'xgboost',
    'lightgbm',
    'random_forest',
    'logistic_regression',
    'naive_bayes',
  ]);

  // Fetch confusion matrix for selected model
  const {
    data: confusionData,
    loading: confusionLoading,
    refetch: refetchConfusion,
  } = useApi(() => getConfusion(selectedModelId), [selectedModelId]);

  // Chart theme colors
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  // Toggle metric chips in bar chart
  const handleToggleMetric = (metricKey) => {
    setActiveMetrics((prev) => {
      if (prev.includes(metricKey)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((k) => k !== metricKey);
      }
      return [...prev, metricKey];
    });
  };

  // Toggle ROC model visibility
  const handleToggleRocModel = (modelId) => {
    if (modelId === 'baseline') return;
    setVisibleRocModels((prev) => {
      if (prev.includes(modelId)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((id) => id !== modelId);
      }
      return [...prev, modelId];
    });
  };

  // Calculate maximum values for table highlighting
  const bestColumnValues = useMemo(() => {
    if (!comparisonData?.models) return {};
    const models = comparisonData.models;

    return {
      accuracy: Math.max(...models.map((m) => m.metrics.accuracy)),
      precision: Math.max(...models.map((m) => m.metrics.precision)),
      recall: Math.max(...models.map((m) => m.metrics.recall)),
      f1: Math.max(...models.map((m) => m.metrics.f1)),
      rocAuc: Math.max(...models.map((m) => m.metrics.rocAuc)),
    };
  }, [comparisonData]);

  // Sorted models for the metrics table
  const sortedModels = useMemo(() => {
    if (!comparisonData?.models) return [];
    const items = [...comparisonData.models];

    items.sort((a, b) => {
      let aVal = sortConfig.key === 'name' ? a.name : a.metrics[sortConfig.key];
      let bVal = sortConfig.key === 'name' ? b.name : b.metrics[sortConfig.key];

      if (typeof aVal === 'string') {
        return sortConfig.direction === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }

      return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return items;
  }, [comparisonData, sortConfig]);

  // Handle table header sort click
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
  };

  // Prepare grouped bar chart data (convert decimals to percentages)
  const groupedBarData = useMemo(() => {
    if (!comparisonData?.models) return [];
    return comparisonData.models.map((m) => ({
      name: m.name,
      id: m.id,
      isBest: m.isBest,
      accuracy: parseFloat((m.metrics.accuracy * 100).toFixed(1)),
      precision: parseFloat((m.metrics.precision * 100).toFixed(1)),
      recall: parseFloat((m.metrics.recall * 100).toFixed(1)),
      f1: parseFloat((m.metrics.f1 * 100).toFixed(1)),
      rocAuc: parseFloat((m.metrics.rocAuc * 100).toFixed(1)),
    }));
  }, [comparisonData]);

  // Merged ROC Curve data across all models
  const mergedRocData = useMemo(() => {
    if (!comparisonData?.models || comparisonData.models.length === 0) return [];
    const baseCurve = comparisonData.models[0].rocCurve;

    return baseCurve.map((pt, i) => {
      const row = {
        fpr: pt.fpr,
        baseline: pt.fpr, // Diagonal chance reference (AUC = 0.500)
      };
      comparisonData.models.forEach((m) => {
        row[m.id] = m.rocCurve[i]?.tpr ?? 0;
      });
      return row;
    });
  }, [comparisonData]);

  // Compute Model Insight text
  const modelInsight = useMemo(() => {
    if (!comparisonData?.models) return null;
    const champion = comparisonData.models.find((m) => m.isBest) || comparisonData.models[0];
    const lightgbm = comparisonData.models.find((m) => m.id === 'lightgbm');
    const nb = comparisonData.models.find((m) => m.id === 'naive_bayes');

    return {
      championName: champion.name,
      championF1: (champion.metrics.f1 * 100).toFixed(1),
      championAuc: champion.metrics.rocAuc.toFixed(3),
      championPrecision: (champion.metrics.precision * 100).toFixed(1),
      championRecall: (champion.metrics.recall * 100).toFixed(1),
      totalErrors: champion.confusionMatrix.fp + champion.confusionMatrix.fn,
      runnerUpName: lightgbm?.name || 'LightGBM',
      runnerUpF1: lightgbm ? (lightgbm.metrics.f1 * 100).toFixed(1) : '89.1',
      runnerUpTime: lightgbm?.trainingTimeSeconds || 14.2,
      championTime: champion.trainingTimeSeconds || 42.6,
      nbF1: nb ? (nb.metrics.f1 * 100).toFixed(1) : '76.8',
    };
  }, [comparisonData]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Model Benchmark & Comparison"
          subtitle="Loading model performance metrics, ROC curves, and confusion heatmaps..."
          breadcrumbs={
            <span>
              Dashboard <span className="mx-1 text-slate-400">/</span> Models
            </span>
          }
        />

        {/* 4 Stat Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
          <Skeleton variant="card" height={100} />
        </div>

        {/* Table Skeleton */}
        <Skeleton variant="card" height={320} />

        {/* 2 Charts Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" height={380} />
          <Skeleton variant="card" height={380} />
        </div>

        {/* Confusion Matrix Skeleton */}
        <Skeleton variant="card" height={340} />
      </div>
    );
  }

  // Error screen with retry
  if (error || !comparisonData) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Model Benchmark & Comparison"
          subtitle="Benchmark leaderboard across classifier models."
          breadcrumbs={
            <span>
              Dashboard <span className="mx-1 text-slate-400">/</span> Models
            </span>
          }
        />

        <Card className="p-8">
          <ErrorState
            title="Failed to load model comparison"
            message={error || 'Unable to retrieve comparative model metrics.'}
            onRetry={() => refetch()}
            retryText="Retry Loading Models"
          />
        </Card>
      </div>
    );
  }

  const { models, summary } = comparisonData;
  const currentConfusion = confusionData || models[0].confusionMatrix;
  const currentModelObj = models.find((m) => m.id === selectedModelId) || models[0];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Model Benchmark & Comparison"
        subtitle="Comprehensive benchmark leaderboard across 5 supervised classification models evaluated on 10,000 held-out test reviews."
        badge={
          <Badge variant="genuine" dot size="sm">
            5 Models Evaluated &bull; 80/20 Split
          </Badge>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Models
          </span>
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => {
              refetch();
              refetchConfusion();
            }}
            leftIcon={RefreshCw}
          >
            Refresh Leaderboard
          </Button>
        }
      />

      {/* Row 1: KPI Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4 border-l-4 border-l-emerald-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Champion Model</p>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base flex items-center gap-1.5">
                <span>{summary.bestModel}</span>
                <Badge variant="genuine" size="sm">Best</Badge>
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-indigo-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Top F1-Score</p>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base font-mono">
                {(summary.bestF1 * 100).toFixed(1)}% ({summary.bestF1})
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-purple-500">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Top ROC-AUC</p>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base font-mono">
                {summary.bestRocAuc.toFixed(3)}
              </h3>
            </div>
          </div>
        </Card>

        <Card className="p-4 border-l-4 border-l-slate-400">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Evaluation Set</p>
              <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base">
                {summary.evaluationDatasetSize.toLocaleString()} Reviews
              </h3>
            </div>
          </div>
        </Card>
      </div>

      {/* Row 2: Sortable Metrics Table */}
      <Card className="p-5 overflow-hidden">
        <CardHeader className="p-0 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <CardTitle>Comparative Model Performance Leaderboard</CardTitle>
            <CardDescription>
              Click any column header to sort. Highlighted green values represent the top performer in each metric.
            </CardDescription>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Sorted by <strong className="text-slate-700 dark:text-slate-300 uppercase">{sortConfig.key}</strong> ({sortConfig.direction.toUpperCase()})
          </span>
        </CardHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider bg-slate-50/60 dark:bg-slate-800/40">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3 px-4 cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors select-none"
                >
                  <div className="flex items-center gap-1.5">
                    <span>Model Architecture</span>
                    {sortConfig.key === 'name' ? (
                      sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-400" />
                    )}
                  </div>
                </th>

                {METRICS_CONFIG.map((metric) => (
                  <th
                    key={metric.key}
                    onClick={() => handleSort(metric.key)}
                    className="py-3 px-4 text-right cursor-pointer hover:text-slate-900 dark:hover:text-slate-100 transition-colors select-none"
                  >
                    <div className="flex items-center justify-end gap-1.5">
                      <span>{metric.label}</span>
                      {sortConfig.key === metric.key ? (
                        sortConfig.direction === 'asc' ? <ArrowUp className="w-3.5 h-3.5" /> : <ArrowDown className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpDown className="w-3 h-3 text-slate-400" />
                      )}
                    </div>
                  </th>
                ))}

                <th className="py-3 px-4 text-right">Training Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
              {sortedModels.map((m) => {
                const isChampion = m.isBest;

                return (
                  <tr
                    key={m.id}
                    className={`transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50 ${
                      isChampion ? 'bg-indigo-50/30 dark:bg-indigo-950/20 font-medium' : ''
                    }`}
                  >
                    {/* Model Name & Badge */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: MODEL_COLORS[m.id] }}
                        />
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {m.name}
                        </span>
                        <span className="text-[11px] text-slate-400 hidden sm:inline">
                          ({m.type})
                        </span>
                        {isChampion && (
                          <Badge variant="genuine" size="sm" dot icon={Trophy}>
                            Best
                          </Badge>
                        )}
                      </div>
                    </td>

                    {/* Metric Columns with Best-in-Column Highlighting */}
                    {METRICS_CONFIG.map((metric) => {
                      const val = m.metrics[metric.key];
                      const isBestInCol = val === bestColumnValues[metric.key];

                      return (
                        <td key={metric.key} className="py-3.5 px-4 text-right font-mono text-xs">
                          {isBestInCol ? (
                            <span className="inline-flex items-center gap-1 font-bold px-2 py-0.5 rounded-md bg-emerald-100/80 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800">
                              {(val * 100).toFixed(1)}%
                              {metric.key === 'f1' && <CheckCircle2 className="w-3 h-3 shrink-0" />}
                            </span>
                          ) : (
                            <span className="text-slate-600 dark:text-slate-300">
                              {(val * 100).toFixed(1)}%
                            </span>
                          )}
                        </td>
                      );
                    })}

                    {/* Training Latency */}
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-slate-500 dark:text-slate-400">
                      {m.trainingTimeSeconds}s
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Row 3: Grouped Bar Chart & ROC Curves (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Grouped Bar Chart Comparing Metrics */}
        <Card className="p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <CardTitle>Metric Comparison Across Models</CardTitle>
                <CardDescription>
                  Toggle individual metric chips to isolate and compare specific indicators
                </CardDescription>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <SlidersHorizontal className="w-3.5 h-3.5" />
                <span>Filter Metrics</span>
              </div>
            </div>

            {/* Metric Toggle Chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              {METRICS_CONFIG.map((metric) => {
                const isActive = activeMetrics.includes(metric.key);

                return (
                  <button
                    key={metric.key}
                    type="button"
                    onClick={() => handleToggleMetric(metric.key)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-all select-none flex items-center gap-1.5 ${
                      isActive
                        ? 'border-indigo-300 dark:border-indigo-800 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 shadow-soft-xs'
                        : 'border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: isActive ? metric.color : '#94a3b8' }}
                    />
                    <span>{metric.label}</span>
                  </button>
                );
              })}
            </div>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={groupedBarData}
                  margin={{ top: 15, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="name" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    unit="%"
                    domain={[65, 100]}
                  />
                  <Tooltip content={<ChartTooltip unit="%" />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                  />

                  {METRICS_CONFIG.filter((m) => activeMetrics.includes(m.key)).map((metric) => (
                    <Bar
                      key={metric.key}
                      dataKey={metric.key}
                      name={metric.label}
                      fill={metric.color}
                      radius={[3, 3, 0, 0]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* ROC Curves Chart */}
        <Card className="p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <CardTitle>Receiver Operating Characteristic (ROC Curves)</CardTitle>
              <CardDescription>
                Click any model in the legend to toggle its line on or off
              </CardDescription>
            </div>
            <Badge variant="primary" size="sm">
              20 Evaluation Steps
            </Badge>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="h-80 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={mergedRocData}
                  margin={{ top: 15, right: 15, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
                  <XAxis
                    dataKey="fpr"
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 1]}
                    tickFormatter={(v) => v.toFixed(1)}
                    label={{ value: 'False Positive Rate (FPR)', position: 'insideBottom', offset: -5, fontSize: 10, fill: axisColor }}
                  />
                  <YAxis
                    stroke={axisColor}
                    fontSize={11}
                    tickLine={false}
                    domain={[0, 1]}
                    tickFormatter={(v) => v.toFixed(1)}
                    label={{ value: 'True Positive Rate (TPR)', angle: -90, position: 'insideLeft', offset: 12, fontSize: 10, fill: axisColor }}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3 rounded-xl shadow-soft-lg text-xs space-y-1 min-w-[170px]">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
                              FPR: {parseFloat(label).toFixed(3)}
                            </p>
                            {payload.map((item, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-2">
                                <span className="text-slate-600 dark:text-slate-400 font-medium">
                                  {item.name.split(' (')[0]}:
                                </span>
                                <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                                  TPR {parseFloat(item.value).toFixed(3)}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    onClick={(e) => handleToggleRocModel(e.dataKey)}
                    wrapperStyle={{ paddingBottom: '12px', fontSize: '11px' }}
                    formatter={(value, entry) => {
                      const isVisible =
                        entry.dataKey === 'baseline' || visibleRocModels.includes(entry.dataKey);

                      return (
                        <span
                          className={`cursor-pointer select-none text-xs transition-opacity ${
                            isVisible
                              ? 'font-semibold text-slate-800 dark:text-slate-200'
                              : 'text-slate-400 line-through opacity-50'
                          }`}
                        >
                          {value}
                        </span>
                      );
                    }}
                  />

                  {/* Diagonal Random Guess Baseline (AUC: 0.500) */}
                  <Line
                    type="linear"
                    dataKey="baseline"
                    name="Random Chance (0.500)"
                    stroke="#94a3b8"
                    strokeDasharray="4 4"
                    strokeWidth={1.5}
                    dot={false}
                  />

                  {/* Model ROC Lines */}
                  {models.map((m) => (
                    <Line
                      key={m.id}
                      type="monotone"
                      dataKey={m.id}
                      name={`${m.name} (AUC: ${m.metrics.rocAuc.toFixed(3)})`}
                      stroke={MODEL_COLORS[m.id]}
                      strokeWidth={m.isBest ? 2.5 : 1.8}
                      dot={false}
                      activeDot={{ r: 5 }}
                      hide={!visibleRocModels.includes(m.id)}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Confusion Matrix Heatmap & Model Insight Card (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Confusion Matrix Heatmap (7 cols) */}
        <Card className="lg:col-span-7 p-5 space-y-4">
          <CardHeader className="p-0 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <CardTitle>Confusion Matrix Heatmap</CardTitle>
              <CardDescription>
                Classification counts and error distributions across 10,000 test reviews
              </CardDescription>
            </div>

            {/* Model Selector Dropdown */}
            <div className="flex items-center gap-2">
              <label htmlFor="model-select" className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                Select Model:
              </label>
              <select
                id="model-select"
                value={selectedModelId}
                onChange={(e) => setSelectedModelId(e.target.value)}
                className="text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 px-3 py-1.5 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 shadow-soft-xs"
              >
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} {m.isBest ? '★ (Champion)' : `(F1: ${(m.metrics.f1 * 100).toFixed(1)}%)`}
                  </option>
                ))}
              </select>
            </div>
          </CardHeader>

          {/* 2x2 Heatmap Grid */}
          <div className="relative pt-2">
            {confusionLoading && (
              <div className="absolute inset-0 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xs flex items-center justify-center z-10 rounded-xl">
                <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating Matrix...</span>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 text-center">
              {/* Top-Left: True Negative (TN) */}
              <div className="p-4 sm:p-5 rounded-xl border border-emerald-300 dark:border-emerald-800/80 bg-emerald-500/15 dark:bg-emerald-950/40 text-emerald-950 dark:text-emerald-100 space-y-1 shadow-soft-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  True Negative (TN)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-900 dark:text-emerald-100">
                  {currentConfusion.tn.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  {(currentConfusion.normalized[0][0] * 100).toFixed(1)}% of Genuine Reviews
                </p>
                <span className="text-[11px] text-emerald-800/70 dark:text-emerald-400/80 block pt-1">
                  Correctly Verified Genuine
                </span>
              </div>

              {/* Top-Right: False Positive (FP) */}
              <div className="p-4 sm:p-5 rounded-xl border border-rose-300 dark:border-rose-800/80 bg-rose-500/15 dark:bg-rose-950/40 text-rose-950 dark:text-rose-100 space-y-1 shadow-soft-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-300 block">
                  False Positive (FP)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-rose-900 dark:text-rose-100">
                  {currentConfusion.fp.toLocaleString()}
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300 font-semibold">
                  {(currentConfusion.normalized[0][1] * 100).toFixed(1)}% Error Rate
                </p>
                <span className="text-[11px] text-rose-800/70 dark:text-rose-400/80 block pt-1">
                  Wrongly Flagged as Fake
                </span>
              </div>

              {/* Bottom-Left: False Negative (FN) */}
              <div className="p-4 sm:p-5 rounded-xl border border-amber-300 dark:border-amber-800/80 bg-amber-500/15 dark:bg-amber-950/40 text-amber-950 dark:text-amber-100 space-y-1 shadow-soft-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300 block">
                  False Negative (FN)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-amber-900 dark:text-amber-100">
                  {currentConfusion.fn.toLocaleString()}
                </p>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-semibold">
                  {(currentConfusion.normalized[1][0] * 100).toFixed(1)}% Escape Rate
                </p>
                <span className="text-[11px] text-amber-800/70 dark:text-amber-400/80 block pt-1">
                  Stealth Fakes Missed
                </span>
              </div>

              {/* Bottom-Right: True Positive (TP) */}
              <div className="p-4 sm:p-5 rounded-xl border border-emerald-400 dark:border-emerald-700 bg-emerald-500/25 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-100 space-y-1 shadow-soft-xs">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300 block">
                  True Positive (TP)
                </span>
                <p className="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-900 dark:text-emerald-100">
                  {currentConfusion.tp.toLocaleString()}
                </p>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-semibold">
                  {(currentConfusion.normalized[1][1] * 100).toFixed(1)}% of Fake Reviews
                </p>
                <span className="text-[11px] text-emerald-800/70 dark:text-emerald-400/80 block pt-1">
                  Correctly Caught Fake
                </span>
              </div>
            </div>
          </div>

          {/* Plain-Language Captions Below Grid */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-500 dark:text-slate-400">
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <p>
                <strong>True Negatives (TN):</strong> Genuine customer reviews accurately passed without moderator intervention.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 mt-1 shrink-0" />
              <p>
                <strong>False Positives (FP):</strong> Legitimate reviews wrongly penalized, creating merchant friction.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 mt-1 shrink-0" />
              <p>
                <strong>False Negatives (FN):</strong> Deceptive reviews that slipped past filters into the public storefront.
              </p>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 mt-1 shrink-0" />
              <p>
                <strong>True Positives (TP):</strong> Coordinated astroturf reviews caught and routed to quarantine.
              </p>
            </div>
          </div>
        </Card>

        {/* Right: Model Insight Card (5 cols) */}
        {modelInsight && (
          <Card className="lg:col-span-5 p-5 space-y-4 border-l-4 border-l-indigo-500">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                Model Insight & Trade-off Analysis
              </h3>
            </div>

            <div className="space-y-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              <p>
                <strong>Champion Model Verdict:</strong>{' '}
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {modelInsight.championName}
                </span>{' '}
                achieves the top overall performance with an F1-Score of{' '}
                <strong>{modelInsight.championF1}%</strong> and ROC-AUC of{' '}
                <strong>{modelInsight.championAuc}</strong>.
              </p>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                  Precision vs Recall Balance
                </span>
                <p className="text-xs">
                  {modelInsight.championName} maintains balanced precision ({modelInsight.championPrecision}%) and recall ({modelInsight.championRecall}%), producing only{' '}
                  <strong className="text-slate-800 dark:text-slate-200 font-mono">
                    {modelInsight.totalErrors} total errors
                  </strong>{' '}
                  across the 10,000 test reviews (205 FPs vs 167 FNs).
                </p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5">
                <span className="text-[11px] font-bold uppercase text-slate-400 tracking-wider block">
                  Operational Trade-off
                </span>
                <p className="text-xs">
                  <strong>{modelInsight.runnerUpName}</strong> delivers near-identical accuracy ({modelInsight.runnerUpF1}% F1) with{' '}
                  <strong>3x lower latency</strong> ({modelInsight.runnerUpTime}s vs {modelInsight.championTime}s), making it ideal for edge ingestion. Conversely, <strong>Naive Bayes</strong> trails significantly ({modelInsight.nbF1}% F1) due to feature independence assumptions failing on structured astroturf text.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="inline-flex items-center gap-1 font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Latency Optimized
              </span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Selected: {currentModelObj.name}
              </span>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

export default ModelsPage;
