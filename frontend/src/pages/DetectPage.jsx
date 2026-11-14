import React, { useState, useId, useMemo } from 'react';
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
  Sparkles,
  Star,
  RotateCcw,
  Send,
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  History,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  Calendar,
  User,
  ArrowRight,
  PieChart as PieIcon,
} from 'lucide-react';
import { predictReview } from '../api';
import PageHeader from '../components/PageHeader';
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from '../components/Card';
import Badge from '../components/Badge';
import Button from '../components/Button';
import Gauge from '../components/Gauge';
import EmptyState from '../components/EmptyState';
import Skeleton from '../components/Skeleton';

// Preset example reviews
const EXAMPLES = [
  {
    id: 'ex-fake',
    label: 'Obviously Fake',
    variant: 'fake',
    data: {
      text: 'BEST HEADPHONES EVER IN HUMAN HISTORY!! 10/10 MUST BUY NOW!! Completely transformed my life, absolute perfection! Buying 5 more for family tomorrow!!',
      rating: 5,
      reviewerId: 'REV-BOT-9921',
      date: '2026-10-10',
    },
  },
  {
    id: 'ex-genuine',
    label: 'Genuine Review',
    variant: 'genuine',
    data: {
      text: 'Decent battery life lasting around 28 hours during daily subway commutes. Noise cancellation is solid for open office chatter, though default EQ feels slightly bass-heavy until tuned in the companion app.',
      rating: 4,
      reviewerId: 'USR-GEN-1044',
      date: '2026-09-15',
    },
  },
  {
    id: 'ex-borderline',
    label: 'Borderline Case',
    variant: 'warning',
    data: {
      text: "Package arrived on time and in good condition. Looks as advertised, haven't tested all the features yet but works fine so far.",
      rating: 3,
      reviewerId: 'USR-EDGE-3012',
      date: '2026-08-20',
    },
  },
];

// Feature group styling utilities — TrustLens light-only
const GROUP_COLORS = {
  textual: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    dot: 'bg-blue-500',
    label: 'Textual',
  },
  behavioral: {
    bg: 'bg-amber-50',
    text: 'text-amber-800',
    border: 'border-amber-200',
    dot: 'bg-amber-500',
    label: 'Behavioral',
  },
  temporal: {
    bg: 'bg-purple-50',
    text: 'text-purple-700',
    border: 'border-purple-200',
    dot: 'bg-purple-500',
    label: 'Temporal',
  },
};

/**
 * Custom Tooltip for SHAP horizontal bar chart — TrustLens light-only
 */
function ShapTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isPushFake = data.direction === 'pushes_fake';
    const groupStyle = GROUP_COLORS[data.group] || GROUP_COLORS.textual;

    return (
      <div className="bg-tl-card/95 backdrop-blur-sm border border-tl-border p-3 rounded-[14px] shadow-card text-xs space-y-1.5 min-w-[200px]">
        <div className="flex items-center justify-between gap-2 border-b border-tl-border pb-1">
          <span className="font-semibold text-tl-text truncate">
            {data.displayName}
          </span>
          <span
            className={`inline-flex items-center px-1.5 py-0.5 rounded-[10px] text-[10px] font-semibold ${groupStyle.bg} ${groupStyle.text}`}
          >
            {groupStyle.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-tl-muted">
          <span>Observed Input:</span>
          <span className="font-mono font-medium text-tl-text">
            {data.value}
          </span>
        </div>
        <div className="flex items-center justify-between text-tl-muted">
          <span>SHAP Impact:</span>
          <span className="font-mono font-bold text-tl-text">
            +{data.shap_value}
          </span>
        </div>
        <div className="flex items-center justify-between text-tl-muted pt-0.5">
          <span>Direction:</span>
          <span
            className={`font-semibold ${
              isPushFake ? 'text-tl-fake' : 'text-tl-genuine'
            }`}
          >
            {isPushFake ? 'Pushes toward Fake' : 'Pushes toward Genuine'}
          </span>
        </div>
      </div>
    );
  }
  return null;
}

/**
 * Plain-English insight generator from top SHAP features
 */
function generatePlainEnglishSummary(result) {
  if (!result || !result.top_shap_features) return null;

  const top3 = result.top_shap_features.slice(0, 3);
  const isFake = result.label === 'fake';
  const prob = Math.round(result.fake_probability * 100);

  const points = top3.map((feat) => {
    const isPushFake = feat.direction === 'pushes_fake';
    const directionPhrase = isPushFake ? 'pushes score toward fake' : 'supports genuine authenticity';

    switch (feat.feature) {
      case 'exclamation_count':
        return `Punctuation frequency of ${feat.value} ${directionPhrase} via emotional exaggeration.`;
      case 'extreme_rating_ratio':
        return `Rating of ${feat.value} ${directionPhrase}, aligning with polar manipulation curves.`;
      case 'review_length':
      case 'review_word_count':
      case 'word_count':
        return `Review brevity (${feat.value} words) ${directionPhrase}, matching boilerplate templates.`;
      case 'sentiment_polarity':
      case 'sentiment_extremity':
        return `Sentiment extremity (${feat.value}) ${directionPhrase} without balanced nuance.`;
      case 'same_day_review_count':
        return `Author publishing velocity (${feat.value}) ${directionPhrase} in a single calendar day.`;
      case 'verified_purchase':
        return `Checkout status (${feat.value}) ${directionPhrase} for authenticated purchase tracking.`;
      case 'all_caps_ratio':
      case 'uppercase_word_density':
        return `Capitalized text density (${feat.value}) ${directionPhrase} through all-caps emphasis.`;
      case 'burst_indicator':
        return `Temporal correlation (${feat.value}) ${directionPhrase} against platform volume surges.`;
      case 'lexical_diversity':
        return `Vocabulary variety (${feat.value}) ${directionPhrase} across unique lexical tokens.`;
      default:
        return `${feat.displayName} (${feat.value}) ${directionPhrase} (+${feat.shap_value} SHAP).`;
    }
  });

  return {
    headline: isFake
      ? `Model flagged this review as Fake (${prob}% probability) driven by primary signals:`
      : `Model classified this review as Genuine (${100 - prob}% confidence) driven by primary signals:`,
    points,
  };
}

export function DetectPage() {
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const [hoveredRating, setHoveredRating] = useState(null);
  const [reviewerId, setReviewerId] = useState('');
  const [reviewDate, setReviewDate] = useState('');
  const [validationError, setValidationError] = useState('');

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [predictionHistory, setPredictionHistory] = useState([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(true);

  const formId = useId();

  // Light-mode chart tokens (TrustLens)
  const gridColor = '#E6ECF5';
  const axisColor = '#6B7A93';

  // Character & word count calculations
  const charCount = reviewText.length;
  const wordCount = reviewText.trim() ? reviewText.trim().split(/\s+/).length : 0;

  // Handle example chip click
  const handleSelectExample = (example) => {
    setReviewText(example.data.text);
    setRating(example.data.rating);
    setReviewerId(example.data.reviewerId);
    setReviewDate(example.data.date);
    setValidationError('');
  };

  // Clear form
  const handleClear = () => {
    setReviewText('');
    setRating(5);
    setReviewerId('');
    setReviewDate('');
    setValidationError('');
  };

  // Run prediction
  const handlePredict = async (e) => {
    if (e) e.preventDefault();

    if (!reviewText.trim()) {
      setValidationError('Review text is required before running inference.');
      return;
    }

    setValidationError('');
    setLoading(true);

    try {
      const payload = {
        review_text: reviewText.trim(),
        rating,
        reviewer_id: reviewerId.trim() || undefined,
        review_date: reviewDate || undefined,
      };

      const res = await predictReview(payload);
      setResult(res);

      // Prepend to history (up to last 5)
      setPredictionHistory((prev) => {
        const item = {
          id: `HIST-${Date.now()}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          input: {
            text: reviewText.trim(),
            rating,
            reviewerId: reviewerId.trim(),
            date: reviewDate,
          },
          result: res,
        };
        return [item, ...prev.filter((h) => h.input.text !== item.input.text)].slice(0, 5);
      });
    } catch (err) {
      setValidationError(err?.message || 'Inference request failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reload an item from history
  const handleRestoreHistory = (item) => {
    setReviewText(item.input.text);
    setRating(item.input.rating);
    setReviewerId(item.input.reviewerId || '');
    setReviewDate(item.input.date || '');
    setResult(item.result);
    setValidationError('');
  };

  // Format data for Recharts horizontal bar chart (reversed so Rank 1 is on top)
  const shapChartData = useMemo(() => {
    if (!result?.top_shap_features) return [];
    return [...result.top_shap_features].reverse();
  }, [result]);

  const summaryInsights = useMemo(() => {
    return generatePlainEnglishSummary(result);
  }, [result]);

  // Dynamic Pie Chart Data (guaranteeing Fake % + Genuine % === 100%)
  const pieData = useMemo(() => {
    if (!result) return [];
    const fakeRaw = Number(result.fake_probability ?? 0);
    const fakePct = Math.min(Math.max(Math.round(fakeRaw * 100), 0), 100);
    const genuinePct = 100 - fakePct;

    return [
      {
        name: 'Fake Review',
        value: fakePct,
        color: '#E05A5A', // Red
      },
      {
        name: 'Genuine Review',
        value: genuinePct,
        color: '#2FAE7A', // Green
      },
    ];
  }, [result]);

  const fakePercentage = pieData[0]?.value ?? 0;
  const genuinePercentage = pieData[1]?.value ?? 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Detect Fake Reviews"
        subtitle="Evaluate individual review text authenticity using an ensemble XGBoost model with SHAP feature attributions."
        badge={
          <Badge variant="primary" dot size="sm">
            Live Inference
          </Badge>
        }
        breadcrumbs={
          <span>
            Dashboard <span className="mx-1 text-tl-muted">/</span> Detect
          </span>
        }
      />

      {/* Main 2-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Panel (5 cols) */}
        <Card className="lg:col-span-5 p-5 sm:p-6 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h2 className="text-base font-bold text-tl-text flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-tl-accent" />
                Input Review Details
              </h2>
              <span className="text-xs text-tl-muted">Real-time scoring</span>
            </div>
            <p className="text-xs text-tl-muted">
              Provide the review content and optional reviewer metadata to execute authenticity classification.
            </p>
          </div>

          {/* Try an Example Chips */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider">
              Try an example:
            </span>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.id}
                  type="button"
                  onClick={() => handleSelectExample(ex)}
                  className={`text-xs px-2.5 py-1 rounded-[10px] border font-medium transition-all duration-200 ease-out flex items-center gap-1.5 ${
                    ex.variant === 'fake'
                      ? 'border-tl-fake/30 bg-tl-fake-bg text-tl-fake hover:bg-tl-fake-bg/80'
                      : ex.variant === 'genuine'
                      ? 'border-tl-genuine/30 bg-tl-genuine-bg text-tl-genuine hover:bg-tl-genuine-bg/80'
                      : 'border-tl-warning/30 bg-tl-warning-bg text-tl-warning hover:bg-tl-warning-bg/80'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      ex.variant === 'fake'
                        ? 'bg-tl-fake'
                        : ex.variant === 'genuine'
                        ? 'bg-tl-genuine'
                        : 'bg-tl-warning'
                    }`}
                  />
                  <span>{ex.label}</span>
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handlePredict} className="space-y-4">
            {/* Review Textarea */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor={`${formId}-review-text`}
                  className="text-xs font-semibold text-tl-text"
                >
                  Review Text <span className="text-tl-fake">*</span>
                </label>
                <span className="text-[11px] text-tl-muted font-mono">
                  {charCount} chars &bull; {wordCount} words
                </span>
              </div>
              <textarea
                id={`${formId}-review-text`}
                rows={5}
                value={reviewText}
                onChange={(e) => {
                  setReviewText(e.target.value);
                  if (validationError) setValidationError('');
                }}
                placeholder="Type or paste customer review text here..."
                className={`w-full rounded-[10px] border p-3 text-sm transition-colors outline-none resize-none bg-tl-fill text-tl-text placeholder:text-tl-muted ${
                  validationError
                    ? 'border-tl-fake focus:border-tl-fake focus:ring-1 focus:ring-tl-fake'
                    : 'border-tl-border focus:border-tl-accent focus:ring-1 focus:ring-tl-accent'
                }`}
              />
              {validationError && (
                <p className="text-xs text-tl-fake font-medium flex items-center gap-1.5 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{validationError}</span>
                </p>
              )}
            </div>

            {/* Star Rating Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-tl-text block">
                Rating Score ({rating} Star{rating > 1 ? 's' : ''})
              </label>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 p-2 rounded-[10px] bg-tl-fill border border-tl-border">
                  {[1, 2, 3, 4, 5].map((star) => {
                    const isFilled = (hoveredRating !== null ? hoveredRating : rating) >= star;
                    return (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(null)}
                        className="p-1 rounded hover:scale-110 motion-safe:transition-transform focus:outline-none"
                        aria-label={`Rate ${star} star${star > 1 ? 's' : ''}`}
                      >
                        <Star
                          className={`w-5 h-5 transition-colors ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400 drop-shadow-sm'
                              : 'text-tl-border'
                          }`}
                        />
                      </button>
                    );
                  })}
                </div>
                <span className="text-xs font-medium text-tl-muted">
                  {rating === 5 && '5 Stars (Extreme Positive)'}
                  {rating === 4 && '4 Stars (Moderate Positive)'}
                  {rating === 3 && '3 Stars (Neutral)'}
                  {rating === 2 && '2 Stars (Moderate Negative)'}
                  {rating === 1 && '1 Star (Extreme Negative)'}
                </span>
              </div>
            </div>

            {/* Optional Metadata Row: Reviewer ID & Date */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div className="space-y-1">
                <label
                  htmlFor={`${formId}-reviewer-id`}
                  className="text-xs font-semibold text-tl-text flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-tl-muted" />
                  Reviewer ID <span className="text-tl-muted font-normal">(optional)</span>
                </label>
                <input
                  id={`${formId}-reviewer-id`}
                  type="text"
                  value={reviewerId}
                  onChange={(e) => setReviewerId(e.target.value)}
                  placeholder="e.g. USR-4019"
                  className="w-full text-xs rounded-[10px] border border-tl-border px-3 py-2 bg-tl-fill text-tl-text placeholder:text-tl-muted focus:outline-none focus:border-tl-accent focus:ring-1 focus:ring-tl-accent"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor={`${formId}-review-date`}
                  className="text-xs font-semibold text-tl-text flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-tl-muted" />
                  Review Date <span className="text-tl-muted font-normal">(optional)</span>
                </label>
                <input
                  id={`${formId}-review-date`}
                  type="date"
                  value={reviewDate}
                  onChange={(e) => setReviewDate(e.target.value)}
                  className="w-full text-xs rounded-[10px] border border-tl-border px-3 py-2 bg-tl-fill text-tl-text placeholder:text-tl-muted focus:outline-none focus:border-tl-accent focus:ring-1 focus:ring-tl-accent"
                />
              </div>
            </div>

            {/* Action Buttons: Predict & Clear */}
            <div className="flex items-center gap-3 pt-2">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="flex-1"
                isLoading={loading}
                loadingText="Analyzing..."
                leftIcon={Send}
              >
                Predict Review
              </Button>

              <Button
                type="button"
                variant="secondary"
                size="md"
                onClick={handleClear}
                leftIcon={RotateCcw}
              >
                Clear
              </Button>
            </div>
          </form>
        </Card>

        {/* Right Column: Result Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          {/* State 1: Loading State */}
          {loading && (
            <Card className="p-8 text-center space-y-6">
              <div className="max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-tl-accent-bg text-tl-accent flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 animate-spin" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-tl-text">
                    Running Model Inference...
                  </h3>
                  <p className="text-xs text-tl-muted mt-1">
                    Calculating lexical sentiment, punctuation density, rating extremity, and SHAP attributions.
                  </p>
                </div>
                <div className="pt-2">
                  <Skeleton variant="card" height={140} />
                </div>
              </div>
            </Card>
          )}

          {/* State 2: Empty State before first prediction */}
          {!loading && !result && (
            <Card className="p-8">
              <EmptyState
                icon={Sparkles}
                title="No Prediction Yet"
                description="Enter review text on the left or click one of the preset example chips above to evaluate review authenticity."
              >
                <div className="mt-4 flex items-center justify-center gap-2 text-xs text-tl-muted">
                  <span className="inline-flex items-center gap-1 text-tl-accent font-semibold">
                    <ShieldCheck className="w-4 h-4" /> Real-time Heuristics
                  </span>
                  <span>&bull;</span>
                  <span>Prediction Percentage Pie Chart</span>
                  <span>&bull;</span>
                  <span>SHAP Explanations</span>
                </div>
              </EmptyState>
            </Card>
          )}

          {/* State 3: Result View */}
          {!loading && result && (
            <div className="space-y-5">
              {/* Main Classification & Probability Card (Inference Outcome) */}
              <Card className="p-5 sm:p-6 space-y-5">
                {/* Result Header: Badge + Confidence Tag */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-tl-border pb-4">
                  <div>
                    <span className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider block mb-1">
                      Inference Outcome
                    </span>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={result.label === 'fake' ? 'fake' : 'genuine'}
                        size="lg"
                        dot
                        icon={result.label === 'fake' ? ShieldAlert : ShieldCheck}
                        className="text-sm font-bold uppercase tracking-wider px-3.5 py-1"
                      >
                        {result.label === 'fake' ? 'Fake Review' : 'Genuine Review'}
                      </Badge>
                      <span className="text-xs font-medium text-tl-muted">
                        {Math.round(result.confidence_score * 100)}% Decision Confidence
                      </span>
                    </div>
                  </div>

                  <div className="text-left sm:text-right text-xs text-tl-muted">
                    <p className="font-semibold text-tl-text">
                      Recommendation:
                    </p>
                    <p>{result.recommendation}</p>
                  </div>
                </div>

                {/* Low Confidence Warning Banner */}
                {result.low_confidence && (
                  <div className="flex items-center gap-3 p-3.5 rounded-[14px] border border-tl-warning/30 bg-tl-warning-bg text-tl-warning text-xs sm:text-sm font-medium">
                    <AlertTriangle className="w-5 h-5 text-tl-warning shrink-0" />
                    <div>
                      <span className="font-bold">Low-confidence prediction.</span> Manual verification recommended.
                      <span className="block text-xs text-tl-warning/80 mt-0.5">
                        Score falls within the boundary threshold (0.40–0.60 probability).
                      </span>
                    </div>
                  </div>
                )}

                {/* Visualizations Grid: Semicircular Gauge (Left) + Prediction Percentage Pie Chart (Right) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center pt-1 pb-2">
                  {/* Left: Gauge Meter Display */}
                  <div className="flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-tl-border pb-5 md:pb-0 md:pr-4">
                    <span className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider mb-1">
                      Calculated Fake Probability
                    </span>
                    <Gauge
                      value={result.fake_probability}
                      label="Fake Probability"
                      size={210}
                      showBadge={false}
                    />
                    <div className="flex items-center justify-center gap-4 text-xs font-medium text-tl-muted mt-2">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-tl-genuine" />
                        Genuine: {(result.genuine_probability * 100).toFixed(1)}%
                      </span>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-tl-fake" />
                        Fake: {(result.fake_probability * 100).toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  {/* Right: Prediction Percentage Pie Chart */}
                  <div className="flex flex-col items-center justify-center md:pl-2">
                    <div className="flex items-center gap-1.5 mb-1">
                      <PieIcon className="w-3.5 h-3.5 text-tl-accent" />
                      <span className="text-[11px] font-semibold text-tl-muted uppercase tracking-wider">
                        Prediction Percentage Breakdown
                      </span>
                    </div>

                    <div className="w-full h-44 flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieData}
                            cx="50%"
                            cy="50%"
                            innerRadius={36}
                            outerRadius={62}
                            paddingAngle={3}
                            dataKey="value"
                            isAnimationActive={true}
                            animationDuration={800}
                            label={({ cx, cy, midAngle, outerRadius, value }) => {
                              if (value === 0) return null;
                              const RADIAN = Math.PI / 180;
                              const radius = outerRadius + 14;
                              const x = cx + radius * Math.cos(-midAngle * RADIAN);
                              const y = cy + radius * Math.sin(-midAngle * RADIAN);
                              const item = pieData.find((d) => d.value === value);
                              return (
                                <text
                                  x={x}
                                  y={y}
                                  fill={item?.color || '#334155'}
                                  textAnchor={x > cx ? 'start' : 'end'}
                                  dominantBaseline="central"
                                  className="text-xs font-bold font-mono"
                                >
                                  {`${value}%`}
                                </text>
                              );
                            }}
                            labelLine={{ stroke: '#CBD5E1', strokeWidth: 1.5 }}
                          >
                            {pieData.map((entry, index) => (
                              <Cell
                                key={`pie-cell-${index}`}
                                fill={entry.color}
                                stroke="#FFFFFF"
                                strokeWidth={2}
                              />
                            ))}
                          </Pie>
                          <Tooltip
                            contentStyle={{
                              backgroundColor: '#FFFFFF',
                              border: '1px solid #E6ECF5',
                              borderRadius: '10px',
                              boxShadow: '0 4px 12px rgba(0,0,0,0.06)',
                              fontSize: '12px',
                              padding: '8px 12px',
                            }}
                            formatter={(val, name) => [`${val}%`, name]}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Pie Chart Legend */}
                    <div className="flex items-center justify-center gap-5 text-xs font-medium mt-1">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#E05A5A]" />
                        <span className="text-tl-text">Fake Review:</span>
                        <span className="font-mono font-bold text-tl-fake">{fakePercentage}%</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#2FAE7A]" />
                        <span className="text-tl-text">Genuine Review:</span>
                        <span className="font-mono font-bold text-tl-genuine">{genuinePercentage}%</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Horizontal SHAP Bar Chart Card */}
              <Card className="p-5 sm:p-6 space-y-4">
                <CardHeader className="p-0 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <CardTitle>Top 10 SHAP Feature Contributions</CardTitle>
                    <CardDescription>
                      Impact magnitude and directional force driving the model outcome
                    </CardDescription>
                  </div>

                  {/* Direction Legend */}
                  <div className="flex items-center gap-3 text-xs shrink-0">
                    <span className="inline-flex items-center gap-1 text-tl-fake font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-tl-fake" /> Pushes Fake
                    </span>
                    <span className="inline-flex items-center gap-1 text-tl-genuine font-semibold">
                      <span className="w-2.5 h-2.5 rounded-full bg-tl-genuine" /> Pushes Genuine
                    </span>
                  </div>
                </CardHeader>

                {/* Recharts Horizontal Bar Chart */}
                <CardContent className="p-0 pt-2">
                  <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        layout="vertical"
                        data={shapChartData}
                        margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                        <XAxis
                          type="number"
                          stroke={axisColor}
                          fontSize={11}
                          tickLine={false}
                          domain={[0, 'auto']}
                        />
                        <YAxis
                          type="category"
                          dataKey="displayName"
                          stroke={axisColor}
                          fontSize={11}
                          tickLine={false}
                          width={140}
                        />
                        <Tooltip content={<ShapTooltip />} />
                        <Bar dataKey="shap_value" radius={[0, 4, 4, 0]}>
                          {shapChartData.map((entry, index) => (
                            <Cell
                              key={`shap-cell-${index}`}
                              fill={entry.direction === 'pushes_fake' ? '#E05A5A' : '#2FAE7A'}
                            />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Feature Group Badges List with Small Colored Tag Next to Each Feature Name */}
                  <div className="mt-4 pt-3 border-t border-tl-border space-y-2">
                    <div className="flex items-center justify-between text-xs text-tl-muted font-semibold mb-2">
                      <span>Feature Breakdown &amp; Domain Categories:</span>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-blue-500" /> Textual
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-amber-500" /> Behavioral
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-purple-500" /> Temporal
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {result.top_shap_features.map((feat) => {
                        const isPushFake = feat.direction === 'pushes_fake';
                        const groupStyle = GROUP_COLORS[feat.group] || GROUP_COLORS.textual;

                        return (
                          <div
                            key={feat.feature}
                            className="flex items-center justify-between p-2 rounded-[10px] border border-tl-border bg-tl-fill text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${groupStyle.bg} ${groupStyle.text}`}
                              >
                                {groupStyle.label}
                              </span>
                              <span className="font-medium text-tl-text truncate">
                                {feat.displayName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="font-mono text-[11px] text-tl-muted">
                                {feat.value}
                              </span>
                              <span
                                className={`font-mono font-bold text-[11px] px-1.5 py-0.5 rounded ${
                                  isPushFake
                                    ? 'bg-tl-fake-bg text-tl-fake'
                                    : 'bg-tl-genuine-bg text-tl-genuine'
                                }`}
                              >
                                {isPushFake ? '+' : '-'}{feat.shap_value}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Plain-English "Why this prediction?" Summary Card */}
              {summaryInsights && (
                <Card className="p-5 space-y-3 border-l-4 border-l-tl-accent">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-tl-accent" />
                    <h3 className="text-sm font-bold text-tl-text">
                      Why this prediction?
                    </h3>
                  </div>

                  <p className="text-xs sm:text-sm font-medium text-tl-text">
                    {summaryInsights.headline}
                  </p>

                  <ul className="space-y-2 text-xs sm:text-sm text-tl-muted list-disc pl-5">
                    {summaryInsights.points.map((pt, i) => (
                      <li key={i} className="leading-relaxed">
                        {pt}
                      </li>
                    ))}
                  </ul>
                </Card>
              )}

              {/* Response Disclaimer */}
              <div className="p-3.5 rounded-[14px] bg-tl-fill border border-tl-border text-xs text-tl-muted flex items-start gap-2.5">
                <Info className="w-4 h-4 text-tl-muted shrink-0 mt-0.5" />
                <p className="leading-relaxed">{result.disclaimer}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History Section (Collapsible last 5 items) */}
      {predictionHistory.length > 0 && (
        <Card className="p-5">
          <div
            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="flex items-center gap-2.5">
              <History className="w-4 h-4 text-tl-accent" />
              <h3 className="text-sm font-bold text-tl-text">
                Recent Prediction History ({predictionHistory.length})
              </h3>
              <span className="text-xs text-tl-muted">Click any item to reload</span>
            </div>
            <button
              type="button"
              className="p-1 rounded-[10px] hover:bg-tl-fill text-tl-muted"
              aria-label={isHistoryOpen ? 'Collapse history' : 'Expand history'}
            >
              {isHistoryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {isHistoryOpen && (
            <div className="mt-4 space-y-2 border-t border-tl-border pt-3">
              {predictionHistory.map((item) => {
                const isFake = item.result.label === 'fake';
                return (
                  <div
                    key={item.id}
                    onClick={() => handleRestoreHistory(item)}
                    className="p-3 rounded-[14px] border border-tl-border bg-tl-fill hover:bg-tl-accent-bg hover:border-tl-accent/40 motion-safe:transition-all duration-200 ease-out cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-mono text-tl-muted">
                          {item.timestamp}
                        </span>
                        <span className="text-xs font-semibold text-amber-500">
                          {'★'.repeat(item.input.rating)}
                        </span>
                        {item.input.reviewerId && (
                          <span className="text-[11px] text-tl-muted font-mono">
                            ID: {item.input.reviewerId}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-tl-text line-clamp-1 italic">
                        "{item.input.text}"
                      </p>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-mono font-bold text-tl-text">
                          {Math.round(item.result.fake_probability * 100)}%
                        </span>
                        <span className="block text-[10px] text-tl-muted">Fake Prob</span>
                      </div>
                      <Badge
                        variant={isFake ? 'fake' : 'genuine'}
                        size="sm"
                        dot
                      >
                        {isFake ? 'Fake' : 'Genuine'}
                      </Badge>
                      <ArrowRight className="w-4 h-4 text-tl-muted" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

export default DetectPage;
