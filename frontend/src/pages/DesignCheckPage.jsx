import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  FileText,
  Activity,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  CheckCircle2,
  Database,
  ArrowRight,
  SlidersHorizontal,
  Star,
} from 'lucide-react';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  StatCard,
  Badge,
  Button,
  Spinner,
  Skeleton,
  EmptyState,
  ErrorState,
  Tabs,
  DataTable,
  Gauge,
  PageHeader,
  Drawer,
} from '../components';

import { mockReviews } from '../mock/mockData';
import { formatPercent } from '../utils/formatters';

export function DesignCheckPage() {
  // Interactive state demos
  const [btnLoading, setBtnLoading] = useState(false);
  const [interactiveProb, setInteractiveProb] = useState(0.87);
  const [activeTab, setActiveTab] = useState('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);
  const [showRetrySuccess, setShowRetrySuccess] = useState(false);

  const handleSimulateRetry = () => {
    setIsRetrying(true);
    setShowRetrySuccess(false);
    setTimeout(() => {
      setIsRetrying(false);
      setShowRetrySuccess(true);
      setTimeout(() => setShowRetrySuccess(false), 3000);
    }, 1500);
  };

  const handleSimulateButtonLoading = () => {
    setBtnLoading(true);
    setTimeout(() => setBtnLoading(false), 2000);
  };

  // DataTable column definitions
  const columns = [
    {
      key: 'id',
      label: 'Review ID',
      width: '110px',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300">
          {row.id}
        </span>
      ),
    },
    {
      key: 'product',
      label: 'Product & Text',
      render: (row) => (
        <div className="space-y-1 max-w-sm">
          <div className="font-semibold text-slate-900 dark:text-slate-100 text-xs">
            {row.product}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 italic">
            "{row.text}"
          </p>
        </div>
      ),
    },
    {
      key: 'author',
      label: 'Reviewer',
      width: '130px',
      render: (row) => (
        <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
          {row.author}
        </div>
      ),
    },
    {
      key: 'rating',
      label: 'Rating',
      width: '90px',
      align: 'center',
      render: (row) => (
        <div className="inline-flex items-center gap-1 text-amber-500 font-medium text-xs">
          <span>{row.rating}</span>
          <Star className="w-3.5 h-3.5 fill-current" />
        </div>
      ),
    },
    {
      key: 'fakeProbability',
      label: 'Risk Probability',
      width: '150px',
      align: 'center',
      render: (row) => {
        const prob = row.fakeProbability;
        return (
          <div className="flex flex-col items-center gap-1 w-full">
            <span className="font-semibold text-xs">
              {formatPercent(prob)}
            </span>
            <div className="w-20 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  prob >= 0.7
                    ? 'bg-rose-500'
                    : prob >= 0.4
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${prob * 100}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      key: 'status',
      label: 'Classification',
      width: '130px',
      align: 'right',
      render: (row) => {
        if (row.status === 'fake') {
          return <Badge variant="fake" dot>Fake Review</Badge>;
        }
        if (row.status === 'warning') {
          return <Badge variant="warning" dot>Suspicious</Badge>;
        }
        return <Badge variant="genuine" dot>Genuine</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-12 animate-fadeIn pb-12">
      {/* 1. Page Header Component */}
      <section>
        <PageHeader
          title="Design System & Component Showcase"
          subtitle="Fake Review Detection System &bull; Unified visual design tokens, class-based dark mode, and reusable component library."
          badge={<Badge variant="primary">Design Check Route</Badge>}
          breadcrumbs={
            <>
              <span>System</span>
              <span>/</span>
              <span>Components</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">Visual Inspection</span>
            </>
          }
          actions={
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
                leftIcon={RefreshCw}
              >
                Reset State
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSimulateButtonLoading}
                isLoading={btnLoading}
                loadingText="Auditing System..."
                leftIcon={Sparkles}
              >
                Run System Audit
              </Button>
            </>
          }
        />
      </section>

      {/* 2. Color System & Feature Group Tokens */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Color Token Architecture
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Consistent semantic colors across primary indigo, fake (red/rose), genuine (emerald), plus feature groups: textual (blue), behavioral (amber), temporal (purple).
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="p-3.5 rounded-xl border border-indigo-200 dark:border-indigo-900 bg-indigo-50/70 dark:bg-indigo-950/40">
            <div className="h-2.5 w-full rounded bg-indigo-600 mb-2" />
            <div className="font-semibold text-xs text-indigo-900 dark:text-indigo-200">Primary</div>
            <div className="text-[11px] text-indigo-700/80 dark:text-indigo-400 font-mono">Indigo</div>
          </div>
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50/70 dark:bg-rose-950/40">
            <div className="h-2.5 w-full rounded bg-rose-600 mb-2" />
            <div className="font-semibold text-xs text-rose-900 dark:text-rose-200">Fake</div>
            <div className="text-[11px] text-rose-700/80 dark:text-rose-400 font-mono">Rose / Red</div>
          </div>
          <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50/70 dark:bg-emerald-950/40">
            <div className="h-2.5 w-full rounded bg-emerald-600 mb-2" />
            <div className="font-semibold text-xs text-emerald-900 dark:text-emerald-200">Genuine</div>
            <div className="text-[11px] text-emerald-700/80 dark:text-emerald-400 font-mono">Emerald</div>
          </div>
          <div className="p-3.5 rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50/70 dark:bg-blue-950/40">
            <div className="h-2.5 w-full rounded bg-blue-600 mb-2" />
            <div className="font-semibold text-xs text-blue-900 dark:text-blue-200">Textual Feature</div>
            <div className="text-[11px] text-blue-700/80 dark:text-blue-400 font-mono">Blue</div>
          </div>
          <div className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50/70 dark:bg-amber-950/40">
            <div className="h-2.5 w-full rounded bg-amber-600 mb-2" />
            <div className="font-semibold text-xs text-amber-900 dark:text-amber-200">Behavioral Feature</div>
            <div className="text-[11px] text-amber-700/80 dark:text-amber-400 font-mono">Amber</div>
          </div>
          <div className="p-3.5 rounded-xl border border-purple-200 dark:border-purple-900 bg-purple-50/70 dark:bg-purple-950/40">
            <div className="h-2.5 w-full rounded bg-purple-600 mb-2" />
            <div className="font-semibold text-xs text-purple-900 dark:text-purple-200">Temporal Feature</div>
            <div className="text-[11px] text-purple-700/80 dark:text-purple-400 font-mono">Purple</div>
          </div>
        </div>
      </section>

      {/* 3. StatCard Component Grid */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            StatCard Component
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supports label, value, icon, and optional positive/negative trends in each semantic colorway.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard
            variant="primary"
            label="Total Reviews"
            value="18,450"
            icon={Database}
            trend={{ value: '+14.2%', isUp: true, positive: true }}
            subtext="Scanned this month"
          />
          <StatCard
            variant="fake"
            label="Fake Reviews"
            value="3,820"
            icon={ShieldAlert}
            trend={{ value: '+21.5%', isUp: true, positive: false }}
            subtext="20.7% total ratio"
          />
          <StatCard
            variant="genuine"
            label="Genuine Reviews"
            value="14,630"
            icon={ShieldCheck}
            trend={{ value: '+9.1%', isUp: true, positive: true }}
            subtext="79.3% verified rate"
          />
          <StatCard
            variant="textual"
            label="Textual Flags"
            value="2,150"
            icon={FileText}
            trend={{ value: '+5.4%', isUp: true, positive: false }}
            subtext="Boilerplate & syntax"
          />
          <StatCard
            variant="behavioral"
            label="Behavioral Flags"
            value="1,490"
            icon={Activity}
            trend={{ value: '-2.8%', isUp: false, positive: true }}
            subtext="Account burst velocity"
          />
          <StatCard
            variant="temporal"
            label="Temporal Flags"
            value="1,080"
            icon={Clock}
            trend={{ value: '+3.1%', isUp: true, positive: false }}
            subtext="Launch posting clusters"
          />
        </div>
      </section>

      {/* 4. Gauge Component & Probability Meter */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Gauge Component (Semi-Circle Probability Gauge)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Dynamic semi-circle arc gauge rendering probability, continuous gradient, center readout and risk classification badge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Interactive Controller Gauge */}
          <Card className="lg:col-span-1 p-5 flex flex-col justify-between">
            <CardHeader className="px-0 pt-0 pb-3">
              <div>
                <CardTitle>Interactive Gauge Tester</CardTitle>
                <CardDescription>Drag the slider to test real-time gauge reactivity</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="px-0 py-2 flex flex-col items-center">
              <Gauge
                value={interactiveProb}
                label="Fake Probability"
                sublabel="Calculated from ensemble model"
              />
              <div className="w-full mt-6 space-y-2">
                <div className="flex justify-between text-xs text-slate-500 font-medium">
                  <span>0% (Genuine)</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    Current: {Math.round(interactiveProb * 100)}%
                  </span>
                  <span>100% (Fake)</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.01"
                  value={interactiveProb}
                  onChange={(e) => setInteractiveProb(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </CardContent>
            <CardFooter className="px-0 pb-0 pt-3 bg-transparent border-t">
              <span className="text-xs text-slate-500">Live dynamic SVG calculation</span>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setInteractiveProb(0.92)}
              >
                Set High Risk
              </Button>
            </CardFooter>
          </Card>

          {/* Preset Risk States */}
          <Card className="p-5 flex flex-col items-center justify-center text-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Preset: Genuine Review Example
            </h4>
            <Gauge
              value={0.08}
              label="Probability"
              sublabel="Strong historical account integrity"
            />
          </Card>

          <Card className="p-5 flex flex-col items-center justify-center text-center">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Preset: Detected Fake Attack Burst
            </h4>
            <Gauge
              value={0.96}
              label="Probability"
              sublabel="Multiple coordinated bots flagged"
            />
          </Card>
        </div>
      </section>

      {/* 5. Badge Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Badge Component
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Supports fake, genuine, warning, neutral variants + feature groups (textual, behavioral, temporal, primary) in sm, md, and lg sizes.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Core Status Variants (Default / Dot)
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="fake" dot>Fake Review</Badge>
              <Badge variant="genuine" dot>Genuine Review</Badge>
              <Badge variant="warning" dot>Warning / Suspicious</Badge>
              <Badge variant="neutral" dot>Neutral / Unclassified</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Feature Group Color Variants
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="primary" icon={ShieldCheck}>Primary Indigo</Badge>
              <Badge variant="textual" icon={FileText}>Textual Analysis</Badge>
              <Badge variant="behavioral" icon={Activity}>Behavioral Heuristics</Badge>
              <Badge variant="temporal" icon={Clock}>Temporal Timeline</Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Size Scales (sm / md / lg)
            </h4>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="fake" size="sm" dot>Small (sm)</Badge>
              <Badge variant="fake" size="md" dot>Medium (md)</Badge>
              <Badge variant="fake" size="lg" dot>Large (lg)</Badge>
            </div>
          </div>
        </Card>
      </section>

      {/* 6. Button Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Button Component
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Variants: Primary, Secondary, Ghost, Danger with integrated Spinner loading states and icons.
          </p>
        </div>

        <Card className="p-6 space-y-6">
          <div className="flex flex-wrap items-center gap-4">
            <Button variant="primary">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="ghost">Ghost Button</Button>
            <Button variant="danger">Danger Button</Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="primary"
              isLoading={btnLoading}
              onClick={handleSimulateButtonLoading}
              loadingText="Processing Detection..."
            >
              Click to Test Loading State
            </Button>
            <Button variant="secondary" isLoading={true}>
              Always Loading
            </Button>
            <Button variant="primary" disabled>
              Disabled Button
            </Button>
            <Button variant="secondary" leftIcon={Search}>
              With Left Icon
            </Button>
            <Button variant="primary" rightIcon={ArrowRight}>
              With Right Icon
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button size="sm" variant="primary">Small (sm)</Button>
            <Button size="md" variant="primary">Medium (md)</Button>
            <Button size="lg" variant="primary">Large (lg)</Button>
          </div>
        </Card>
      </section>

      {/* 7. Tabs Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Tabs Component
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Pill and underline variants with badge counters, icons, and active indicator highlights.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Pill Style Tabs (Interactive)
            </h4>
            <Tabs
              variant="pill"
              value={activeTab}
              onChange={setActiveTab}
              items={[
                { id: 'all', label: 'All Reviews', badge: 18450 },
                { id: 'fake', label: 'Flagged Fake', badge: 3820 },
                { id: 'genuine', label: 'Genuine', badge: 14630 },
                { id: 'pending', label: 'Queued', badge: 12, disabled: true },
              ]}
            >
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                Active tab view: <strong className="text-indigo-600 dark:text-indigo-400">{activeTab.toUpperCase()}</strong>
              </div>
            </Tabs>
          </Card>

          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Underline Style Tabs (Feature Groups)
            </h4>
            <Tabs
              variant="underline"
              defaultValue="textual"
              items={[
                { id: 'textual', label: 'Textual Group', icon: FileText, badge: '2.1k' },
                { id: 'behavioral', label: 'Behavioral Group', icon: Activity, badge: '1.4k' },
                { id: 'temporal', label: 'Temporal Group', icon: Clock, badge: '1.0k' },
              ]}
            >
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                Visualizing multi-feature model decomposition parameters.
              </div>
            </Tabs>
          </Card>
        </div>
      </section>

      {/* 8. DataTable Component */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            DataTable Component
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sortable columns (click headers), live text search, dynamic pagination, and responsive layout.
          </p>
        </div>

        <DataTable
          columns={columns}
          data={mockReviews}
          searchPlaceholder="Search by ID, product, reviewer, or review text..."
          defaultPageSize={5}
        />
      </section>

      {/* 9. Card Variants Showcase */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Card Component Hierarchy & Glow Variants
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Structured subcomponents: CardHeader, CardTitle, CardDescription, CardContent, CardFooter with rounded-xl corners and soft shadows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card hoverable glow="primary">
            <CardHeader action={<Badge variant="primary">Header Action</Badge>}>
              <CardTitle>Indigo Glow Card</CardTitle>
              <CardDescription>Primary system feature focus</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Card with hoverable micro-lift, soft shadow, and subtle indigo neon glow aura on interaction.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-slate-400">Card Footer Slot</span>
              <Button size="sm" variant="ghost">Learn More</Button>
            </CardFooter>
          </Card>

          <Card hoverable glow="fake">
            <CardHeader action={<Badge variant="fake" dot>High Threat</Badge>}>
              <CardTitle>Rose Glow Card</CardTitle>
              <CardDescription>Fake review anomaly alert</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Card with subtle rose glow highlighting high threat anomalies and adversarial review attack vectors.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-slate-400">Action Required</span>
              <Button size="sm" variant="danger">Quarantine</Button>
            </CardFooter>
          </Card>

          <Card hoverable glow="genuine">
            <CardHeader action={<Badge variant="genuine" dot>Verified</Badge>}>
              <CardTitle>Emerald Glow Card</CardTitle>
              <CardDescription>Authentic customer signal</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Card with soft emerald glow confirming verified purchase authentication and natural reviewer behavior.
              </p>
            </CardContent>
            <CardFooter>
              <span className="text-xs text-slate-400">Clearance 100%</span>
              <Button size="sm" variant="secondary">Approve</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* 10. Spinner & Skeleton Components */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Spinner & Skeleton Components
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Loading primitives with smooth CSS keyframe animations and multiple size and style scales.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Spinners */}
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Spinner Sizes & Colors
            </h4>
            <div className="flex flex-wrap items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <Spinner size="sm" color="primary" />
                <span className="text-[11px] text-slate-400">sm (primary)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="md" color="fake" />
                <span className="text-[11px] text-slate-400">md (fake)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="lg" color="genuine" />
                <span className="text-[11px] text-slate-400">lg (genuine)</span>
              </div>
              <div className="flex flex-col items-center gap-2">
                <Spinner size="xl" color="primary" />
                <span className="text-[11px] text-slate-400">xl (primary)</span>
              </div>
            </div>
          </Card>

          {/* Skeleton Loaders */}
          <Card className="p-6 space-y-4">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Skeleton Shimmer Placeholders
            </h4>
            <div className="flex items-center gap-4">
              <Skeleton variant="circle" width="48px" height="48px" />
              <div className="flex-1 space-y-2">
                <Skeleton variant="text" width="60%" />
                <Skeleton variant="text" width="90%" />
              </div>
            </div>
            <div className="space-y-2 pt-2">
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="85%" />
              <Skeleton variant="text" width="70%" />
            </div>
          </Card>
        </div>
      </section>

      {/* 11. EmptyState & ErrorState Components */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            EmptyState & ErrorState (with Retry Mechanism)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Resilient fallback views for missing datasets, empty search results, and API exceptions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Empty State */}
          <Card className="p-6">
            <EmptyState
              title="No Flagged Reviews"
              description="Your review filter returned zero suspicious anomalies. All scanned content meets baseline authenticity requirements."
              actionText="Scan New Product"
              onAction={() => alert('Initiating new scan...')}
            />
          </Card>

          {/* Error State with live retry */}
          <Card className="p-6">
            {showRetrySuccess ? (
              <div className="p-8 text-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
                <h4 className="font-semibold text-sm">Connection Successfully Restored!</h4>
                <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-1">
                  Ensemble classifier pipelines are fully operational.
                </p>
              </div>
            ) : (
              <ErrorState
                title="Classifier Gateway Timeout"
                message="Failed to establish connection with the multimodal NLP feature extractor backend server."
                onRetry={handleSimulateRetry}
                isRetrying={isRetrying}
                retryText="Retry Inference"
              />
            )}
          </Card>
        </div>
      </section>

      {/* 12. Drawer (Side Panel) Demo */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
            Drawer (Side Panel with Escape & Backdrop Handling)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Accessible slide-over drawer panel for deep inspection, drill-downs, and audit details.
          </p>
        </div>

        <Card className="p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Interactive Drawer Slide-over
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Press button to test opening drawer. Closes on Escape key press or backdrop click.
              </p>
            </div>
            <Button
              variant="primary"
              icon={SlidersHorizontal}
              onClick={() => setIsDrawerOpen(true)}
            >
              Open Drawer Demo
            </Button>
          </div>
        </Card>

        {/* Demo Drawer Instance */}
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          title="Audit Reviewer Profile"
          subtitle="Reviewer ID: REV-USR-0104 • Risk Score: 98/100"
          size="md"
          footer={
            <div className="flex items-center justify-end gap-3">
              <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" onClick={() => setIsDrawerOpen(false)}>
                Confirm Action
              </Button>
            </div>
          }
        >
          <div className="space-y-5 text-sm">
            <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant="fake" size="sm">High Risk Account</Badge>
                <span className="text-xs font-semibold text-rose-800 dark:text-rose-300">
                  Syndicate Node Flagged
                </span>
              </div>
              <p className="text-xs text-rose-700 dark:text-rose-400">
                This account exhibits 94% fake share with 11 distinct velocity burst spikes in the past 30 days.
              </p>
            </div>

            <div>
              <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Reviewer Statistics</h5>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Average Rating</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">4.96 ★</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Extreme Ratio</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">97.0%</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Rating Variance</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">0.12</p>
                </div>
                <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-slate-500">Lifetime Reviews</span>
                  <p className="text-base font-bold text-slate-800 dark:text-slate-100 mt-0.5">184</p>
                </div>
              </div>
            </div>

            <div>
              <h5 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Drawer Interaction Notes</h5>
              <ul className="list-disc list-inside text-xs text-slate-500 dark:text-slate-400 space-y-1">
                <li>Supports Escape key shortcut to close.</li>
                <li>Locks background document scroll while open.</li>
                <li>Clicking the backdrop automatically dismisses panel.</li>
              </ul>
            </div>
          </div>
        </Drawer>
      </section>
    </div>
  );
}

export default DesignCheckPage;
