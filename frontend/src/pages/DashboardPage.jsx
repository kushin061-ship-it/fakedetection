import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart2, ShieldAlert, ShieldCheck, AlertTriangle,
  TrendingUp, Clock, Eye, ArrowRight, Activity, Zap,
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, Legend,
} from 'recharts';
import { getEda, getModelComparison, useApi } from '../api';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';
import Skeleton from '../components/Skeleton';
import { mockStats, mockReviews } from '../mock/mockData';

const gridColor = '#E6ECF5';
const axisColor = '#6B7A93';

function StatCard({ icon: Icon, label, value, sub, iconColor = 'text-tl-accent', iconBg = 'bg-tl-accent-bg', borderColor = 'border-l-tl-accent' }) {
  return (
    <Card className={`p-4 border-l-4 ${borderColor}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-xl ${iconBg} ${iconColor}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider">{label}</p>
          <h3 className="font-bold text-tl-text text-lg leading-tight">{value}</h3>
          {sub && <p className="text-[11px] text-tl-muted mt-0.5">{sub}</p>}
        </div>
      </div>
    </Card>
  );
}

function DonutTooltip({ active, payload }) {
  if (active && payload?.length) {
    return (
      <div className="bg-tl-card border border-tl-border p-2.5 rounded-[10px] shadow-card text-xs">
        <span className="font-bold text-tl-text">{payload[0].name}:</span>{' '}
        <span className="font-mono text-tl-text">{payload[0].value.toLocaleString()}</span>
      </div>
    );
  }
  return null;
}

export function DashboardPage() {
  const { data: eda, loading: edaLoading } = useApi(getEda, []);
  const { data: models, loading: modelsLoading } = useApi(getModelComparison, []);

  const stats = eda?.summary || null;
  const monthlyData = eda?.monthlyVolume || [];
  const ratingDist = eda?.ratingDistribution || [];

  const fakeGenuineData = stats ? [
    { name: 'Genuine', value: stats.genuineCount, color: '#2FAE7A' },
    { name: 'Fake', value: stats.fakeCount, color: '#E05A5A' },
  ] : [];

  const champion = models?.models?.find(m => m.isBest) || models?.models?.[0];

  if (edaLoading || modelsLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <Skeleton key={i} variant="card" height={90} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" height={300} className="lg:col-span-2" />
          <Skeleton variant="card" height={300} />
        </div>
        <Skeleton variant="card" height={300} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-tl-text">Dashboard</h1>
        <p className="text-sm text-tl-muted mt-1">Overview of fake review detection activity and model performance.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={BarChart2}
          label="Total Reviews Analyzed"
          value={stats?.totalReviews?.toLocaleString() || mockStats.totalAnalyzed.toLocaleString()}
          sub="All-time dataset"
          iconColor="text-tl-accent"
          iconBg="bg-tl-accent-bg"
          borderColor="border-l-tl-accent"
        />
        <StatCard
          icon={ShieldAlert}
          label="Fake Detected"
          value={stats?.fakeCount?.toLocaleString() || mockStats.fakeCount.toLocaleString()}
          sub={`${stats?.fakePercentage?.toFixed(1) || '20.7'}% detection rate`}
          iconColor="text-tl-fake"
          iconBg="bg-tl-fake-bg"
          borderColor="border-l-tl-fake"
        />
        <StatCard
          icon={ShieldCheck}
          label="Genuine Reviews"
          value={stats?.genuineCount?.toLocaleString() || mockStats.genuineCount.toLocaleString()}
          sub={`${stats?.genuinePercentage?.toFixed(1) || '79.3'}% genuine rate`}
          iconColor="text-tl-genuine"
          iconBg="bg-tl-genuine-bg"
          borderColor="border-l-tl-genuine"
        />
        <StatCard
          icon={Zap}
          label="Champion Model"
          value={champion?.name || 'XGBoost'}
          sub={`F1: ${champion ? (champion.metrics.f1 * 100).toFixed(1) : '91.8'}%`}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
          borderColor="border-l-purple-500"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Volume Chart */}
        <Card className="lg:col-span-2 p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-tl-accent" />
              Monthly Review Volume
            </CardTitle>
            <CardDescription>Genuine vs Fake volume over time</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-56">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="month" stroke={axisColor} fontSize={10} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#fff', border: '1px solid #E6ECF5', borderRadius: 10, fontSize: 11 }}
                  />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="genuine" name="Genuine" fill="#2FAE7A" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fake" name="Fake" fill="#E05A5A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Distribution Donut */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Class Distribution</CardTitle>
            <CardDescription>Fake vs Genuine split</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex flex-col items-center">
            <div className="h-44 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Tooltip content={<DonutTooltip />} />
                  <Pie data={fakeGenuineData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {fakeGenuineData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} stroke="none" />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-tl-text">{stats?.fakePercentage?.toFixed(0) || '21'}%</span>
                <span className="text-[10px] text-tl-muted uppercase tracking-wider">Fake Rate</span>
              </div>
            </div>
            <div className="flex items-center gap-4 text-xs mt-2">
              {fakeGenuineData.map(d => (
                <span key={d.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: d.color }} />
                  <span className="text-tl-muted font-medium">{d.name}: <strong className="text-tl-text">{d.value?.toLocaleString()}</strong></span>
                </span>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rating Distribution */}
      {ratingDist.length > 0 && (
        <Card className="p-5">
          <CardHeader className="p-0 pb-4">
            <CardTitle className="text-base">Rating Distribution by Class</CardTitle>
            <CardDescription>Genuine vs Fake count per star rating</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={ratingDist} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="rating" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis stroke={axisColor} fontSize={11} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#fff', border: '1px solid #E6ECF5', borderRadius: 10, fontSize: 11 }} />
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="genuineCount" name="Genuine" fill="#2FAE7A" radius={[3, 3, 0, 0]} />
                  <Bar dataKey="fakeCount" name="Fake" fill="#E05A5A" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Analysis History */}
      <Card className="p-5">
        <div className="flex items-center justify-between pb-4">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="w-4 h-4 text-tl-accent" />
              Recent Analysis History
            </CardTitle>
            <CardDescription>Latest review predictions from your sessions</CardDescription>
          </div>
          <Link to="/detect" className="text-xs text-tl-accent font-semibold hover:underline flex items-center gap-1">
            Analyze Review <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-tl-border text-tl-muted uppercase tracking-wider text-[10px] bg-tl-fill">
                <th className="py-2.5 px-3">Review ID</th>
                <th className="py-2.5 px-3">Review Snippet</th>
                <th className="py-2.5 px-3 text-center">Rating</th>
                <th className="py-2.5 px-3 text-center">Prediction</th>
                <th className="py-2.5 px-3 text-right">Fake Prob.</th>
                <th className="py-2.5 px-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-tl-border">
              {mockReviews.slice(0, 6).map(r => (
                <tr key={r.id} className="hover:bg-tl-fill/50 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-tl-muted">{r.id}</td>
                  <td className="py-2.5 px-3 max-w-xs">
                    <span className="truncate block max-w-[200px] text-tl-text">{r.text}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="text-amber-500">{'★'.repeat(r.rating)}</span>
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    <Badge
                      variant={r.status === 'fake' ? 'fake' : r.status === 'warning' ? 'warning' : 'genuine'}
                      size="sm"
                    >
                      {r.status === 'fake' ? 'Fake' : r.status === 'warning' ? 'Uncertain' : 'Genuine'}
                    </Badge>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold" style={{ color: r.fakeProbability > 0.6 ? '#E05A5A' : r.fakeProbability > 0.4 ? '#E8A838' : '#2FAE7A' }}>
                    {(r.fakeProbability * 100).toFixed(0)}%
                  </td>
                  <td className="py-2.5 px-3 text-tl-muted">{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Feature Category Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Textual Features', value: '7 features', desc: 'Sentiment, punctuation, length, caps ratio', color: '#3b82f6', bg: 'bg-blue-50', text: 'text-blue-700' },
          { label: 'Behavioral Features', value: '5 features', desc: 'Reviewer velocity, rating extremity, variance', color: '#f59e0b', bg: 'bg-amber-50', text: 'text-amber-700' },
          { label: 'Temporal Features', value: '4 features', desc: 'Burst windows, same-day counts, time gaps', color: '#a855f7', bg: 'bg-purple-50', text: 'text-purple-700' },
        ].map(f => (
          <Card key={f.label} className="p-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${f.bg} flex items-center justify-center`}>
                <span className="text-lg font-bold" style={{ color: f.color }}>∑</span>
              </div>
              <div>
                <p className="text-xs font-semibold text-tl-muted uppercase tracking-wider">{f.label}</p>
                <p className="font-bold text-tl-text">{f.value}</p>
                <p className="text-[11px] text-tl-muted mt-0.5">{f.desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;

