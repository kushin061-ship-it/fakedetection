import React, { useState, useId } from 'react';
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

// Feature group styling utilities â€” TrustLens light-only
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
 * User-friendly plain-English explanation generator
 */
function generatePlainEnglishSummary(result) {
  if (!result || !result.top_shap_features) return null;

  const isFake = result.label === 'fake';
  const prob = Math.round(result.fake_probability * 100);
  const features = result.top_shap_features || [];

  // Map feature names â†’ user-friendly descriptions
  const featureDescriptions = {
    exclamation_count: (v) => `Uses ${v} exclamation marks â€” excessive punctuation is a common sign of exaggerated, fake reviews.`,
    extreme_rating_ratio: (v) => `The rating (${v} stars) is extremely high or low â€” fake reviews often use extreme ratings to manipulate scores.`,
    review_length: (v) => `The review is very short (${v} words) â€” brief, generic reviews are frequently associated with spam or bots.`,
    sentiment_polarity: (v) => `The language is unusually ${parseFloat(v) > 0 ? 'positive' : 'negative'} (score: ${v}) â€” real reviews tend to be more balanced.`,
    same_day_review_count: (v) => `The reviewer posted ${v} review${v !== 1 ? 's' : ''} in a single day â€” high posting frequency in a short time is suspicious.`,
    verified_purchase: (v) => `This review is ${v === 1 || v === '1' ? 'from a verified purchase' : 'NOT from a verified purchase'} â€” unverified reviews carry higher fake risk.`,
    all_caps_ratio: (v) => `${Math.round(v * 100)}% of the text is in CAPS â€” heavy capitalization is used to grab attention artificially.`,
    burst_indicator: (v) => `This review was posted during a suspicious review burst (indicator: ${v}) â€” many fake reviews appear together.`,
    lexical_diversity: (v) => `The vocabulary variety is ${parseFloat(v) < 0.5 ? 'low' : 'high'} (${v}) â€” ${parseFloat(v) < 0.5 ? 'repetitive word patterns suggest templated or bot-generated text' : 'rich vocabulary supports authenticity'}.`,
    word_count: (v) => `The review contains only ${v} words â€” very short reviews often lack the detail expected from a genuine buyer.`,
    char_count: (v) => `Review length of ${v} characters is ${parseInt(v) < 100 ? 'very short â€” genuine reviews are usually more detailed' : 'within normal range'}.`,
    uppercase_word_density: (v) => `${Math.round(v * 100)}% of words are fully capitalized â€” this level of emphasis is unusual in genuine reviews.`,
    review_word_count: (v) => `Only ${v} words used â€” genuine reviews typically include more specific product details.`,
    sentiment_extremity: (v) => `Extreme sentiment score of ${v} detected â€” real reviews rarely express such one-sided opinions.`,
  };

  // Build explanation points from top features
  const fakePushers = features.filter(f => f.direction === 'pushes_fake').slice(0, 3);
  const genuinePushers = features.filter(f => f.direction === 'pushes_genuine').slice(0, 2);

  const fakePoints = fakePushers.map(feat => {
    const descFn = featureDescriptions[feat.feature];
    return descFn ? descFn(feat.value) : `"${feat.displayName}" (${feat.value}) raised suspicion of a fake review.`;
  });

  const genuinePoints = genuinePushers.map(feat => {
    const descFn = featureDescriptions[feat.feature];
    return descFn ? descFn(feat.value) : `"${feat.displayName}" (${feat.value}) supports that this review is genuine.`;
  });

  return {
    isFake,
    prob,
    headline: isFake
      ? `âš ï¸ This review appears to be FAKE with ${prob}% probability`
      : `âœ… This review appears to be GENUINE with ${100 - prob}% confidence`,
    summary: isFake
      ? `The AI model detected multiple signals commonly found in fake or bot-generated reviews. Here's what raised the red flags:`
      : `The AI model found this review to be authentic. Here's what supported this conclusion:`,
    fakePoints,
    genuinePoints,
    hasCounterSignals: isFake && genuinePoints.length > 0,
  };
}

/**
 * Custom Tooltip for SHAP horizontal bar chart â€” TrustLens light-only
 */
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

  const summaryInsights = React.useMemo(() => {
    return generatePlainEnglishSummary(result);
  }, [result]);

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
                  <span>Top 10 SHAP Explanations</span>
                </div>
              </EmptyState>
            </Card>
          )}

          {/* State 3: Result View */}
          {!loading && result && (
            <div className="space-y-5">
              {/* Main Classification & Probability Card */}
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
                        Score falls within the boundary threshold (0.40â€“0.60 probability).
                      </span>
                    </div>
                  </div>
                )}

                {/* Gauge Meter Display */}
                <div className="flex flex-col items-center justify-center pt-1 pb-3">
                  <Gauge
                    value={result.fake_probability}
                    label="Calculated Fake Probability"
                    size={230}
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
              </Card>

              {/* Plain-English "Why this prediction?" Explanation Card */}
              {summaryInsights && (
                <Card className={`p-5 space-y-4 border-l-4 ${summaryInsights.isFake ? 'border-l-tl-fake' : 'border-l-tl-genuine'}`}>
                  {/* Headline */}
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-xl shrink-0 ${summaryInsights.isFake ? 'bg-tl-fake-bg' : 'bg-tl-genuine-bg'}`}>
                      {summaryInsights.isFake
                        ? <ShieldAlert className="w-5 h-5 text-tl-fake" />
                        : <ShieldCheck className="w-5 h-5 text-tl-genuine" />}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-tl-text">What does this result mean?</h3>
                      <p className={`text-sm font-semibold mt-0.5 ${summaryInsights.isFake ? 'text-tl-fake' : 'text-tl-genuine'}`}>
                        {summaryInsights.headline}
                      </p>
                    </div>
                  </div>

                  {/* Summary sentence */}
                  <p className="text-sm text-tl-text leading-relaxed">
                    {summaryInsights.summary}
                  </p>

                  {/* Red flags (fake signals) */}
                  {summaryInsights.fakePoints.length > 0 && (
                    <div className="space-y-2">
                      {summaryInsights.isFake && (
                        <p className="text-xs font-bold text-tl-fake uppercase tracking-wide">ðŸš© Red Flags Detected</p>
                      )}
                      <ul className="space-y-2">
                        {summaryInsights.fakePoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-tl-text leading-relaxed bg-tl-fake-bg/50 rounded-[10px] px-3 py-2.5">
                            <span className="text-tl-fake font-bold shrink-0 mt-0.5">âœ—</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Supporting genuine signals */}
                  {summaryInsights.genuinePoints.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-tl-genuine uppercase tracking-wide">
                        {summaryInsights.hasCounterSignals ? 'âœ… Some Genuine Signals Were Also Found' : 'âœ… Genuine Signals'}
                      </p>
                      <ul className="space-y-2">
                        {summaryInsights.genuinePoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2.5 text-sm text-tl-text leading-relaxed bg-tl-genuine-bg/50 rounded-[10px] px-3 py-2.5">
                            <span className="text-tl-genuine font-bold shrink-0 mt-0.5">âœ“</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* What to do */}
                  <div className={`rounded-[10px] p-3 text-xs text-tl-text leading-relaxed ${summaryInsights.isFake ? 'bg-tl-warning-bg border border-tl-warning/20' : 'bg-tl-genuine-bg border border-tl-genuine/20'}`}>
                    <span className="font-bold">ðŸ’¡ What should you do? </span>
                    {summaryInsights.isFake
                      ? 'This review shows strong indicators of being fake. We recommend not relying on it for purchase decisions. Consider reporting it to the platform.'
                      : 'This review appears to be authentic. The reviewer\'s writing style and behaviour match genuine purchase patterns.'}
                  </div>
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
                          {'â˜…'.repeat(item.input.rating)}
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
