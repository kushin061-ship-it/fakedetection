import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import { BarChart2, Download, Trophy, RefreshCw, ChevronDown } from 'lucide-react';
import { getModelComparison, getConfusion, useApi } from '../api';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';

const MODEL_COLORS = {
  xgboost: '#3A78F2',
  lightgbm: '#2FAE7A',
  random_forest: '#E8A838',
  logistic_regression: '#E05A5A',
  naive_bayes: '#9B6DFF',
};

const MODEL_DISPLAY = {
  xgboost: 'XGBoost',
  lightgbm: 'LightGBM',
  random_forest: 'Random Forest',
  logistic_regression: 'Logistic Regression',
  naive_bayes: 'Naive Bayes',
};

const gridColor = '#E6ECF5';
const axisColor = '#6B7A93';

function pct(v) {
  return v != null ? (v * 100).toFixed(1) + '%' : '—';
}

function MetricBadge({ value }) {
  if (value == null) return <span className="text-tl-muted text-xs">—</span>;
  const pctVal = value * 100;
  const color = pctVal >= 90 ? 'text-tl-genuine' : pctVal >= 75 ? 'text-tl-warning' : 'text-tl-fake';
  return <span className={`font-mono font-semibold text-sm ${color}`}>{pctVal.toFixed(1)}%</span>;
}

function ConfusionMatrix({ matrix }) {
  if (!matrix) return <div className="text-sm text-tl-muted text-center py-6">No matrix data available.</div>;

  const { tp = 0, tn = 0, fp = 0, fn = 0 } = matrix;
  const total = tp + tn + fp + fn || 1;

  const cells = [
    { label: 'True Positive', abbr: 'TP', value: tp, color: 'bg-tl-genuine-bg text-tl-genuine border-tl-genuine' },
    { label: 'False Positive', abbr: 'FP', value: fp, color: 'bg-tl-fake-bg text-tl-fake border-tl-fake' },
    { label: 'False Negative', abbr: 'FN', value: fn, color: 'bg-tl-warning-bg text-tl-warning border-tl-warning' },
    { label: 'True Negative', abbr: 'TN', value: tn, color: 'bg-tl-genuine-bg text-tl-genuine border-tl-genuine' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 max-w-xs mx-auto">
        {cells.map((c) => (
          <div key={c.abbr} className={`border rounded-card p-3 text-center ${c.color}`}>
            <p className="text-xs font-semibold opacity-70">{c.label}</p>
            <p className="text-2xl font-bold mt-1">{c.value.toLocaleString()}</p>
            <p className="text-xs opacity-60 mt-0.5">{((c.value / total) * 100).toFixed(1)}%</p>
          </div>
        ))}
      </div>
      <div className="text-center text-xs text-tl-muted">
        Predicted: Fake (left) | Genuine (right) · Actual: Positive (top) | Negative (bottom)
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const { data: models, loading } = useApi(getModelComparison, []);
  const [selectedModel, setSelectedModel] = useState('');

  const modelList = models?.models || [];
  const activeModel = selectedModel || (modelList[0]?.id || '');
  const activeModelData = modelList.find((m) => m.id === activeModel) || modelList[0];

  // Build confusion matrix: try fetching lazily or use embedded
  const { data: confusionData, loading: confLoading } = useApi(
    () => getConfusion(activeModel),
    [activeModel]
  );
  const matrix = confusionData?.matrix || activeModelData?.confusion_matrix;

  // Metrics table rows
  const metricsRows = modelList.map((m) => ({
    id: m.id,
    name: MODEL_DISPLAY[m.id] || m.name || m.id,
    accuracy: m.accuracy,
    precision: m.precision,
    recall: m.recall,
    f1: m.f1 || m.f1_score,
    roc_auc: m.roc_auc,
    color: MODEL_COLORS[m.id] || '#3A78F2',
  }));

  // ROC curve data: combine all models
  const rocData = (() => {
    const points = [];
    if (modelList.length === 0) return points;
    const len = (modelList[0]?.roc_curve?.fpr || []).length || 20;
    for (let i = 0; i < len; i++) {
      const pt = { fpr: i / (len - 1) };
      modelList.forEach((m) => {
        const name = MODEL_DISPLAY[m.id] || m.id;
        pt[name] = (m.roc_curve?.tpr || [])[i] ?? null;
      });
      pt['Random'] = i / (len - 1);
      points.push(pt);
    }
    return points;
  })();

  // Bar chart for F1 comparison
  const f1Data = metricsRows.map((r) => ({
    name: r.name.replace(' ', '\n'),
    F1: r.f1 != null ? +(r.f1 * 100).toFixed(2) : null,
    'ROC-AUC': r.roc_auc != null ? +(r.roc_auc * 100).toFixed(2) : null,
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        subtitle="Model evaluation metrics, ROC curves, and confusion matrices."
      />

      {loading ? (
        <div className="flex items-center gap-3 text-tl-muted text-sm py-12 justify-center">
          <RefreshCw size={18} className="animate-spin" /> Loading model data…
        </div>
      ) : (
        <>
          {/* Metrics Table */}
          <Card>
            <CardHeader>
              <CardTitle>Model Performance Metrics</CardTitle>
              <CardDescription>Evaluated on the held-out test set.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto rounded-card border border-tl-border">
                <table className="w-full text-xs">
                  <thead className="bg-tl-fill">
                    <tr>
                      {['Model', 'Accuracy', 'Precision', 'Recall', 'F1 Score', 'ROC-AUC'].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-semibold text-tl-muted uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-tl-border">
                    {metricsRows.length === 0 ? (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-tl-muted">No model data available.</td></tr>
                    ) : metricsRows.map((r) => (
                      <tr key={r.id} className="hover:bg-tl-fill transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full" style={{ background: r.color }} />
                            <span className="font-semibold text-tl-text">{r.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><MetricBadge value={r.accuracy} /></td>
                        <td className="px-4 py-3"><MetricBadge value={r.precision} /></td>
                        <td className="px-4 py-3"><MetricBadge value={r.recall} /></td>
                        <td className="px-4 py-3"><MetricBadge value={r.f1} /></td>
                        <td className="px-4 py-3"><MetricBadge value={r.roc_auc} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-tl-muted mt-2">
                🟢 ≥ 90% · 🟡 75–89% · 🔴 &lt; 75%
              </p>
            </CardContent>
          </Card>

          {/* ROC Curve */}
          {rocData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>ROC Curves</CardTitle>
                <CardDescription>True Positive Rate vs. False Positive Rate per model.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={rocData} margin={{ top: 4, right: 16, bottom: 4, left: 0 }}>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                      <XAxis dataKey="fpr" tickFormatter={(v) => v.toFixed(1)} tick={{ fill: axisColor, fontSize: 11 }} label={{ value: 'FPR', position: 'insideBottomRight', offset: -4, fill: axisColor, fontSize: 11 }} />
                      <YAxis tickFormatter={(v) => v.toFixed(1)} tick={{ fill: axisColor, fontSize: 11 }} label={{ value: 'TPR', angle: -90, position: 'insideLeft', fill: axisColor, fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E6ECF5', borderRadius: 10, fontSize: 12 }} formatter={(v) => v?.toFixed(3)} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Line dataKey="Random" stroke="#CBD5E1" strokeDasharray="4 4" dot={false} strokeWidth={1} />
                      {metricsRows.map((r) => (
                        <Line
                          key={r.id}
                          dataKey={MODEL_DISPLAY[r.id] || r.id}
                          stroke={r.color}
                          dot={false}
                          strokeWidth={2}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* F1 / ROC-AUC Bar Chart */}
          {f1Data.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>F1 Score & ROC-AUC Comparison</CardTitle>
                <CardDescription>Side-by-side comparison across all models.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={f1Data} margin={{ top: 4, right: 16, bottom: 24, left: 0 }}>
                      <CartesianGrid stroke={gridColor} strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fill: axisColor, fontSize: 11 }} interval={0} />
                      <YAxis domain={[0, 100]} tickFormatter={(v) => v + '%'} tick={{ fill: axisColor, fontSize: 11 }} />
                      <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E6ECF5', borderRadius: 10, fontSize: 12 }} formatter={(v) => v?.toFixed(1) + '%'} />
                      <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="F1" fill="#3A78F2" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="ROC-AUC" fill="#2FAE7A" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Confusion Matrix */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                  <CardTitle>Confusion Matrix</CardTitle>
                  <CardDescription>Select a model to view its confusion matrix.</CardDescription>
                </div>
                {/* Model selector */}
                <div className="relative">
                  <select
                    value={activeModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    className="appearance-none border border-tl-border rounded-[10px] bg-tl-fill px-4 py-2 pr-8 text-sm text-tl-text outline-none cursor-pointer hover:border-tl-accent transition-colors"
                  >
                    {modelList.map((m) => (
                      <option key={m.id} value={m.id}>{MODEL_DISPLAY[m.id] || m.id}</option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-tl-muted pointer-events-none" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {confLoading ? (
                <div className="flex justify-center py-8">
                  <RefreshCw size={18} className="animate-spin text-tl-muted" />
                </div>
              ) : (
                <ConfusionMatrix matrix={matrix} />
              )}
            </CardContent>
          </Card>

          {/* Download Note */}
          <div className="text-center text-xs text-tl-muted py-2">
            PDF report download — coming soon. Use the browser's print dialog to save this page as PDF.
          </div>
        </>
      )}
    </div>
  );
}
