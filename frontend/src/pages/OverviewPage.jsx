import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceArea,
  ReferenceLine,
} from 'recharts';
import {
  Database,
  ShieldAlert,
  ShieldCheck,
  Users,
  RefreshCw,
  Lightbulb,
  Info,
  Clock,
  Flame,
} from 'lucide-react';
import { getEda, useApi } from '../api';
import { useDarkMode } from '../hooks/useDarkMode';
import PageHeader from '../components/PageHeader';
import StatCard from '../components/StatCard';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Skeleton from '../components/Skeleton';
import ErrorState from '../components/ErrorState';

// Consistent color tokens
const COLOR_GENUINE = '#10b981'; // Emerald-500
const COLOR_FAKE = '#f43f5e';    // Rose-500

/**
 * Custom dark-mode aware Tooltip for Recharts
 */
function ChartTooltip({ active, payload, label, unit = '', isPercentage = false }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border border-slate-200/90 dark:border-slate-800/90 p-3 rounded-xl shadow-soft-lg text-xs space-y-1.5 min-w-[150px]">
        {label && (
          <p className="font-semibold text-slate-800 dark:text-slate-200 border-b border-slate-200/60 dark:border-slate-800/60 pb-1">
            {label}
          </p>
        )}
        {payload.map((item, idx) => {
          const val = item.value;
          const displayVal =
            typeof val === 'number'
              ? isPercentage
                ? `${val.toFixed(1)}%`
                : val.toLocaleString()
              : val;

          return (
            <div key={idx} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-1.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || item.fill || item.stroke }}
                />
                <span className="text-slate-600 dark:text-slate-400 font-medium truncate max-w-[120px]">
                  {item.name}:
                </span>
              </div>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
                {displayVal}
                {unit}
              </span>
            </div>
          );
        })}
      </div>
    );
  }
  return null;
}

export function OverviewPage() {
  const { data: eda, loading, error, refetch } = useApi(getEda, []);
  const { isDark } = useDarkMode();

  // Dark mode chart style tokens
  const gridColor = isDark ? '#334155' : '#e2e8f0';
  const axisColor = isDark ? '#94a3b8' : '#64748b';

  // Compute 3 dynamic insights from EDA dataset
  const insights = React.useMemo(() => {
    if (!eda) return [];

    const star5 = eda.ratingDistribution?.find((r) => r.star === 5);
    const star1 = eda.ratingDistribution?.find((r) => r.star === 1);
    const fake5Ratio =
      star5 && star5.genuinePercentage > 0
        ? (star5.fakePercentage / star5.genuinePercentage).toFixed(1)
        : '1.6';
    const fake1Ratio =
      star1 && star1.genuinePercentage > 0
        ? (star1.fakePercentage / star1.genuinePercentage).toFixed(1)
        : '2.8';

    const shortLength = eda.reviewLengthHistogram?.[0]; // 1-20 words
    const shortRatio =
      shortLength && shortLength.genuinePct > 0
        ? (shortLength.fakePct / shortLength.genuinePct).toFixed(1)
        : '5.5';

    const singleReviewer = eda.reviewsPerReviewer?.[0]; // 1 review
    const burstCount = eda.summary?.burstPeriodsIdentified || 3;

    return [
      {
        id: 'insight-ratings',
        title: 'Bimodal Rating Polarization',
        text: `Fake reviews are ${fake5Ratio}x more likely to be 5-star hype (${star5?.fakePercentage}% vs ${star5?.genuinePercentage}%) and ${fake1Ratio}x more likely to be 1-star smear attacks (${star1?.fakePercentage}% vs ${star1?.genuinePercentage}%), reflecting deliberate score manipulation.`,
        badge: `${fake5Ratio}x 5-Star / ${fake1Ratio}x 1-Star`,
        variant: 'fake',
      },
      {
        id: 'insight-length',
        title: 'Ultra-Short Boilerplate Text',
        text: `${shortLength?.fakePct}% of fake submissions contain under 20 words (${shortRatio}x higher concentration than genuine reviews at ${shortLength?.genuinePct}%), indicating high prevalence of generic automated templates.`,
        badge: `${shortLength?.fakePct}% < 20 Words`,
        variant: 'textual',
      },
      {
        id: 'insight-bursts',
        title: 'Burner Accounts & Volume Surges',
        text: `${singleReviewer?.fakePct}% of fake reviews originate from single-submission burner profiles. Furthermore, ${burstCount} coordinated surge periods account for concentrated volume spikes exceeding 2,400 reviews/month.`,
        badge: `${burstCount} Detected Bursts`,
        variant: 'temporal',
      },
    ];
  }, [eda]);

  // Loading skeleton screen
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview & Exploratory Analysis"
          subtitle="Loading dataset distributions, rating histograms, and temporal volumes..."
          breadcrumbs={
            <span>
              Dashboard <span className="mx-1 text-slate-400">/</span> Overview
            </span>
          }
        />

        {/* 4 StatCard Skeletons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Skeleton variant="card" height={105} />
          <Skeleton variant="card" height={105} />
          <Skeleton variant="card" height={105} />
          <Skeleton variant="card" height={105} />
        </div>

        {/* Charts Row Skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton variant="card" height={360} className="lg:col-span-1" />
          <Skeleton variant="card" height={360} className="lg:col-span-2" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton variant="card" height={360} />
          <Skeleton variant="card" height={360} />
        </div>

        <Skeleton variant="card" height={380} />
      </div>
    );
  }

  // Error screen with retry
  if (error || !eda) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Overview & Exploratory Analysis"
          subtitle="Exploratory data analysis on benchmark review corpus."
          breadcrumbs={
            <span>
              Dashboard <span className="mx-1 text-slate-400">/</span> Overview
            </span>
          }
        />

        <Card className="p-8">
          <ErrorState
            title="Failed to load EDA dataset"
            message={error || 'Unable to retrieve dataset statistics from API service.'}
            onRetry={() => refetch()}
            retryText="Retry Loading EDA Data"
          />
        </Card>
      </div>
    );
  }

  const { summary, classDistribution, ratingDistribution, reviewLengthHistogram, reviewsPerReviewer, monthlyVolume } = eda;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Overview & Exploratory Analysis"
        subtitle="Exploratory data analysis across 50,000 annotated reviews. Evaluates class balance, rating distributions, word counts, and coordinated burst spikes."
        badge={
          <Badge variant="primary" dot size="sm">
            Dataset v1.0 &bull; 50k Reviews
          </Badge>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-slate-400">/</span> Overview
          </span>
        }
        actions={
          <Button
            size="sm"
            variant="secondary"
            onClick={() => refetch()}
            leftIcon={RefreshCw}
          >
            Refresh EDA Data
          </Button>
        }
      />

      {/* Row 1: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Reviews"
          value={summary.totalReviews.toLocaleString()}
          icon={Database}
          variant="primary"
          subtext="Annotated evaluation corpus"
        />

        <StatCard
          label="Fake Reviews"
          value={summary.fakeCount.toLocaleString()}
          icon={ShieldAlert}
          variant="fake"
          trend={{ value: `${summary.fakePercentage}%`, isUp: true, positive: false }}
          subtext={`${summary.fakePercentage}% of dataset`}
        />

        <StatCard
          label="Genuine Reviews"
          value={summary.genuineCount.toLocaleString()}
          icon={ShieldCheck}
          variant="genuine"
          trend={{ value: `${summary.genuinePercentage}%`, isUp: true, positive: true }}
          subtext={`${summary.genuinePercentage}% of dataset`}
        />

        <StatCard
          label="Unique Reviewers"
          value={summary.totalReviewers.toLocaleString()}
          icon={Users}
          variant="behavioral"
          subtext={`Avg ${(summary.totalReviews / summary.totalReviewers).toFixed(2)} reviews/author`}
        />
      </div>

      {/* Row 2: Class Distribution Donut & Key Observations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Class Distribution Donut Chart */}
        <Card className="lg:col-span-1 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3">
            <CardTitle>Class Distribution</CardTitle>
            <CardDescription>Ground truth class split in dataset</CardDescription>
          </CardHeader>

          <CardContent className="p-0 flex-1 flex flex-col items-center justify-center relative min-h-[260px]">
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={classDistribution}
                  dataKey="count"
                  nameKey="label"
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={3}
                  label={({ percentage, name }) => `${name}: ${percentage}%`}
                >
                  <Cell key="genuine-slice" fill={COLOR_GENUINE} />
                  <Cell key="fake-slice" fill={COLOR_FAKE} />
                </Pie>
                <Tooltip content={<ChartTooltip unit=" reviews" />} />
              </PieChart>
            </ResponsiveContainer>

            {/* Center readout overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold font-mono text-slate-900 dark:text-slate-100">
                {summary.fakePercentage}%
              </span>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-rose-500">
                Fake Share
              </span>
            </div>
          </CardContent>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-400">Genuine:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {summary.genuinePercentage}% ({summary.genuineCount.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-400">Fake:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {summary.fakePercentage}% ({summary.fakeCount.toLocaleString()})
              </span>
            </div>
          </div>
        </Card>

        {/* Key Observations Card */}
        <Card className="lg:col-span-2 p-5 flex flex-col justify-between">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500" />
                <CardTitle>Key Observations</CardTitle>
              </div>
              <CardDescription>
                Auto-generated empirical insights derived dynamically from the dataset
              </CardDescription>
            </div>
            <Badge variant="behavioral" size="sm">
              3 Key Drivers
            </Badge>
          </CardHeader>

          <CardContent className="p-0 space-y-3.5 my-auto">
            {insights.map((item, idx) => (
              <div
                key={item.id}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-950/80 text-[11px] font-bold text-indigo-700 dark:text-indigo-400">
                      {idx + 1}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wide">
                      {item.title}
                    </h4>
                  </div>
                  <Badge variant={item.variant} size="sm">
                    {item.badge}
                  </Badge>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed pl-7">
                  {item.text}
                </p>
              </div>
            ))}
          </CardContent>

          <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <Info className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
            <span>Statistical indicators align with typical e-commerce astroturf and competitor smear campaigns.</span>
          </div>
        </Card>
      </div>

      {/* Row 3: Rating Distribution & Review Length Histogram */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rating Distribution by Class */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Rating Distribution by Class</CardTitle>
              <CardDescription>
                Percentage of reviews per 1–5 star rating (Bimodal polarization)
              </CardDescription>
            </div>
            <Badge variant="fake" size="sm">
              Bimodal Spike
            </Badge>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={ratingDistribution}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="rating" stroke={axisColor} fontSize={12} tickLine={false} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={12}
                    tickLine={false}
                    unit="%"
                    domain={[0, 65]}
                  />
                  <Tooltip content={<ChartTooltip unit="%" isPercentage />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="genuinePercentage"
                    name="Genuine (%)"
                    fill={COLOR_GENUINE}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="fakePercentage"
                    name="Fake (%)"
                    fill={COLOR_FAKE}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
              Notice the extreme polarization: Fake reviews spike at 1-star (22.5%) and 5-stars (56.0%), while genuine ratings spread naturally.
            </p>
          </CardContent>
        </Card>

        {/* Review Length Distribution */}
        <Card className="p-5">
          <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle>Review Length Distribution</CardTitle>
              <CardDescription>
                Word count histogram: fake reviews skew heavily towards boilerplate brevity
              </CardDescription>
            </div>
            <Badge variant="textual" size="sm">
              Word Count
            </Badge>
          </CardHeader>

          <CardContent className="p-0 pt-2">
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={reviewLengthHistogram}
                  margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                  <XAxis dataKey="range" stroke={axisColor} fontSize={11} tickLine={false} />
                  <YAxis
                    stroke={axisColor}
                    fontSize={12}
                    tickLine={false}
                    unit="%"
                    domain={[0, 50]}
                  />
                  <Tooltip content={<ChartTooltip unit="%" isPercentage />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                  />
                  <Bar
                    dataKey="genuinePct"
                    name="Genuine (%)"
                    fill={COLOR_GENUINE}
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="fakePct"
                    name="Fake (%)"
                    fill={COLOR_FAKE}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <p className="mt-2 text-[11px] text-slate-500 dark:text-slate-400 text-center">
              42.7% of fake reviews are under 20 words, compared to only 7.8% of genuine reviews. Genuine reviews peak at 51–100 words.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Row 4: Reviews Per Reviewer */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3 flex flex-row items-center justify-between">
          <div>
            <CardTitle>Reviews Per Reviewer Distribution</CardTitle>
            <CardDescription>
              Account submission frequencies: single-review burners vs persistent astroturf accounts
            </CardDescription>
          </div>
          <Badge variant="behavioral" size="sm">
            Behavioral Frequency
          </Badge>
        </CardHeader>

        <CardContent className="p-0 pt-2">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reviewsPerReviewer}
                margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="bin" stroke={axisColor} fontSize={12} tickLine={false} />
                <YAxis
                  stroke={axisColor}
                  fontSize={12}
                  tickLine={false}
                  unit="%"
                  domain={[0, 75]}
                />
                <Tooltip content={<ChartTooltip unit="%" isPercentage />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '10px', fontSize: '12px' }}
                />
                <Bar
                  dataKey="genuinePct"
                  name="Genuine (%)"
                  fill={COLOR_GENUINE}
                  radius={[4, 4, 0, 0]}
                />
                <Bar
                  dataKey="fakePct"
                  name="Fake (%)"
                  fill={COLOR_FAKE}
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
            <span>
              <strong>66.0%</strong> of fake accounts submit exactly 1 review (throwaway burners), while <strong>5.0%</strong> operate at 21+ reviews (syndicate farms vs 0.6% genuine).
            </span>
            <span className="hidden sm:inline-flex text-indigo-600 dark:text-indigo-400 font-semibold shrink-0">
              Bi-modal account risk signature
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Row 5: 24-Month Monthly Review Volume Timeline with Burst Highlights */}
      <Card className="p-5">
        <CardHeader className="p-0 pb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-rose-500" />
              <CardTitle>Monthly Review Volume Timeline (24 Months)</CardTitle>
            </div>
            <CardDescription>
              Chronological review publishing volume with highlighted coordinated burst surge periods
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="fake" dot size="sm">
              3 Burst Spikes Flagged
            </Badge>
            <Badge variant="temporal" size="sm">
              Nov 2024 &ndash; Oct 2026
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="p-0 pt-3">
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlyVolume}
                margin={{ top: 15, right: 15, left: -5, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
                <XAxis dataKey="label" stroke={axisColor} fontSize={11} tickLine={false} />
                <YAxis
                  stroke={axisColor}
                  fontSize={12}
                  tickLine={false}
                  domain={[0, 3000]}
                />
                <Tooltip content={<ChartTooltip unit=" reviews" />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  iconType="circle"
                  wrapperStyle={{ paddingBottom: '12px', fontSize: '12px' }}
                />

                {/* Highlight Burst Surges with ReferenceArea and Lines */}
                {/* Spike 1: Jun 2025 */}
                <ReferenceArea
                  x1="May 25"
                  x2="Jul 25"
                  fill="#f43f5e"
                  fillOpacity={isDark ? 0.18 : 0.12}
                  stroke="#f43f5e"
                  strokeOpacity={0.4}
                />
                <ReferenceLine
                  x="Jun 25"
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Spike 1: Jun 25',
                    position: 'top',
                    fill: isDark ? '#fda4af' : '#e11d48',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* Spike 2: Jan 2026 */}
                <ReferenceArea
                  x1="Dec 25"
                  x2="Feb 26"
                  fill="#f43f5e"
                  fillOpacity={isDark ? 0.18 : 0.12}
                  stroke="#f43f5e"
                  strokeOpacity={0.4}
                />
                <ReferenceLine
                  x="Jan 26"
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Spike 2: Jan 26',
                    position: 'top',
                    fill: isDark ? '#fda4af' : '#e11d48',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                {/* Spike 3: Aug 2026 */}
                <ReferenceArea
                  x1="Jul 26"
                  x2="Sep 26"
                  fill="#f43f5e"
                  fillOpacity={isDark ? 0.18 : 0.12}
                  stroke="#f43f5e"
                  strokeOpacity={0.4}
                />
                <ReferenceLine
                  x="Aug 26"
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  label={{
                    value: 'Spike 3: Aug 26',
                    position: 'top',
                    fill: isDark ? '#fda4af' : '#e11d48',
                    fontSize: 10,
                    fontWeight: 600,
                  }}
                />

                <Line
                  type="monotone"
                  dataKey="genuine"
                  name="Genuine Reviews"
                  stroke={COLOR_GENUINE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLOR_GENUINE }}
                  activeDot={{ r: 6 }}
                />

                <Line
                  type="monotone"
                  dataKey="fake"
                  name="Fake Reviews"
                  stroke={COLOR_FAKE}
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: COLOR_FAKE }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Burst explanation caption */}
          <div className="mt-4 p-4 rounded-xl border border-rose-200/80 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2 mb-1.5 font-bold text-rose-800 dark:text-rose-300">
              <Clock className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>Burst Anomaly Analysis (3 Coordinated Temporal Surges):</span>
            </div>
            <p className="leading-relaxed text-slate-600 dark:text-slate-300">
              While organic genuine reviews progress with steady, predictable monthly volumes (~1,480 to ~1,980/mo), fraudulent activity displays 3 unnatural surge spikes:
              <strong> (1) Jun 2025 Summer Promo Burst</strong> (1,420 fake reviews, +390% surge),
              <strong> (2) Jan 2026 Post-Holiday Smear Campaign</strong> (1,890 fake reviews, +440% surge), and
              <strong> (3) Aug 2026 Launch Syndicate Attack</strong> (2,460 fake reviews, +620% surge).
              These statistical volume anomalies serve as critical indicators for temporal feature detection.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default OverviewPage;
