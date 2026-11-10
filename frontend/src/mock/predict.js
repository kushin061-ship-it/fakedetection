/**
 * Mock predictor for single review and batch review submissions
 * Routes:
 * - POST /api/predict
 * - POST /api/predict/batch
 */

export const mockPredictReview = (payload = {}) => {
  const text = payload.review_text || payload.reviewText || payload.text || '';
  const rating = Number(payload.rating || 5);
  const reviewerId = payload.reviewer_id || payload.reviewerId || 'ANON_USER';
  const isVerified = payload.is_verified ?? payload.isVerified ?? (payload.verified_purchase !== false);
  const sameDayReviews = Number(payload.same_day_review_count || payload.sameDayReviews || 1);

  // 1. Textual heuristics
  const rawExclamationCount = (text.match(/!/g) || []).length;
  const words = text.trim() ? text.trim().split(/\s+/) : [];
  const wordCount = words.length;
  const charCount = text.length;
  const capsWords = words.filter((w) => w.length > 2 && w === w.toUpperCase()).length;

  const hypeTerms = [
    'best', 'must buy', 'life changing', 'perfection', 'worst ever',
    'scam', 'trash', 'miracle', '10/10', 'five stars', 'greatest', 'garbage',
    'holy grail', 'waste of money', 'broken', 'horrible', 'fake',
  ];
  const lowerText = text.toLowerCase();
  const matchedHypeCount = hypeTerms.filter((term) => lowerText.includes(term)).length;

  // 2. Base score starting at global fake baseline (0.18)
  let score = 0.18;

  // Exclamation count effect
  if (rawExclamationCount === 0) {
    score -= 0.05;
  } else if (rawExclamationCount === 1) {
    score += 0.06;
  } else if (rawExclamationCount === 2) {
    score += 0.14;
  } else {
    score += Math.min(0.35, 0.20 + (rawExclamationCount - 2) * 0.05);
  }

  // Extreme rating effect (1 or 5 stars vs 2, 3, 4 stars)
  if (rating === 1 || rating === 5) {
    score += 0.16;
  } else if (rating === 2 || rating === 4) {
    score -= 0.08;
  } else if (rating === 3) {
    score -= 0.14;
  }

  // Length effect (very short pushes fake, long & nuanced pushes genuine)
  if (wordCount === 0) {
    score += 0.20;
  } else if (wordCount < 15) {
    score += 0.22;
  } else if (wordCount < 30) {
    score += 0.08;
  } else if (wordCount < 80) {
    score -= 0.06;
  } else if (wordCount < 160) {
    score -= 0.12;
  } else {
    score -= 0.18;
  }

  // All-caps tokens
  if (capsWords >= 3) {
    score += 0.18;
  } else if (capsWords >= 1) {
    score += 0.07;
  }

  // Hype keywords
  if (matchedHypeCount >= 2) {
    score += 0.16;
  } else if (matchedHypeCount === 1) {
    score += 0.08;
  }

  // Behavioral signals
  if (!isVerified) {
    score += 0.12;
  } else {
    score -= 0.06;
  }

  if (sameDayReviews >= 5) {
    score += 0.20;
  } else if (sameDayReviews >= 3) {
    score += 0.10;
  }

  // Clamp probability between 0.04 and 0.98
  const fakeProbability = parseFloat(Math.min(0.98, Math.max(0.04, score)).toFixed(3));
  const isFake = fakeProbability >= 0.50;
  const isLowConfidence = fakeProbability >= 0.40 && fakeProbability <= 0.60;
  const label = isFake ? 'fake' : 'genuine';

  // Compute realistic Top 10 SHAP features with directional force
  const topShapFeatures = [
    {
      rank: 1,
      feature: 'exclamation_count',
      displayName: 'Exclamation Mark Density',
      group: 'textual',
      value: `${rawExclamationCount} mark${rawExclamationCount === 1 ? '' : 's'}`,
      shap_value: parseFloat((Math.min(0.35, rawExclamationCount * 0.08) || 0.05).toFixed(3)),
      direction: rawExclamationCount >= 2 ? 'pushes_fake' : 'pushes_genuine',
      impact: rawExclamationCount >= 2 ? 'high' : 'low',
    },
    {
      rank: 2,
      feature: 'extreme_rating_ratio',
      displayName: 'Extreme Rating Indicator',
      group: 'behavioral',
      value: `${rating} Star${rating > 1 ? 's' : ''}`,
      shap_value: parseFloat((rating === 1 || rating === 5 ? 0.285 : 0.142).toFixed(3)),
      direction: rating === 1 || rating === 5 ? 'pushes_fake' : 'pushes_genuine',
      impact: 'high',
    },
    {
      rank: 3,
      feature: 'review_length',
      displayName: 'Review Word Count',
      group: 'textual',
      value: `${wordCount} word${wordCount === 1 ? '' : 's'} (${charCount} chars)`,
      shap_value: parseFloat((wordCount < 20 ? 0.245 : 0.185).toFixed(3)),
      direction: wordCount < 25 ? 'pushes_fake' : 'pushes_genuine',
      impact: wordCount < 25 ? 'high' : 'medium',
    },
    {
      rank: 4,
      feature: 'sentiment_polarity',
      displayName: 'Sentiment Polarity Extremity',
      group: 'textual',
      value: matchedHypeCount > 0 ? '+0.92 (Extreme)' : (rating <= 2 ? '-0.81 (Extremely Negative)' : '+0.34 (Moderate)'),
      shap_value: parseFloat((matchedHypeCount > 0 ? 0.218 : 0.112).toFixed(3)),
      direction: matchedHypeCount > 0 || rating === 1 ? 'pushes_fake' : 'pushes_genuine',
      impact: 'medium',
    },
    {
      rank: 5,
      feature: 'same_day_review_count',
      displayName: 'Same-Day Author Velocity',
      group: 'behavioral',
      value: `${sameDayReviews} review${sameDayReviews === 1 ? '' : 's'}/day`,
      shap_value: parseFloat((sameDayReviews > 2 ? 0.194 : 0.085).toFixed(3)),
      direction: sameDayReviews >= 3 ? 'pushes_fake' : 'pushes_genuine',
      impact: sameDayReviews >= 3 ? 'high' : 'low',
    },
    {
      rank: 6,
      feature: 'verified_purchase',
      displayName: 'Verified Purchase Status',
      group: 'behavioral',
      value: isVerified ? 'Verified Buyer' : 'Unverified Submission',
      shap_value: parseFloat((!isVerified ? 0.176 : 0.115).toFixed(3)),
      direction: !isVerified ? 'pushes_fake' : 'pushes_genuine',
      impact: 'medium',
    },
    {
      rank: 7,
      feature: 'all_caps_ratio',
      displayName: 'Uppercase Words Density',
      group: 'textual',
      value: `${capsWords} all-caps token${capsWords === 1 ? '' : 's'}`,
      shap_value: parseFloat((capsWords > 0 ? 0.154 : 0.052).toFixed(3)),
      direction: capsWords > 1 ? 'pushes_fake' : 'pushes_genuine',
      impact: capsWords > 1 ? 'medium' : 'low',
    },
    {
      rank: 8,
      feature: 'burst_indicator',
      displayName: 'Temporal Surge Alignment',
      group: 'temporal',
      value: score > 0.6 ? 'High Temporal Correlation' : 'Nominal Baseline',
      shap_value: parseFloat((score > 0.6 ? 0.138 : 0.064).toFixed(3)),
      direction: score > 0.6 ? 'pushes_fake' : 'pushes_genuine',
      impact: 'medium',
    },
    {
      rank: 9,
      feature: 'lexical_diversity',
      displayName: 'Type-Token Lexical Variety',
      group: 'textual',
      value: wordCount < 15 ? '0.41 (Low Diversity)' : '0.78 (Rich Vocabulary)',
      shap_value: parseFloat((wordCount < 15 ? 0.125 : 0.071).toFixed(3)),
      direction: wordCount < 15 ? 'pushes_fake' : 'pushes_genuine',
      impact: 'low',
    },
    {
      rank: 10,
      feature: 'time_gap_days',
      displayName: 'Product Catalog Ingestion Gap',
      group: 'temporal',
      value: '4.2 days post-launch',
      shap_value: 0.098,
      direction: 'pushes_fake',
      impact: 'low',
    },
  ];

  return {
    label,
    fake_probability: fakeProbability,
    genuine_probability: parseFloat((1 - fakeProbability).toFixed(3)),
    confidence_score: parseFloat((Math.abs(fakeProbability - 0.5) * 2).toFixed(3)),
    low_confidence: isLowConfidence,
    recommendation: isLowConfidence
      ? 'Requires human auditor review (boundary score)'
      : isFake
      ? 'Flagged for moderation / quarantine'
      : 'Approved genuine review',
    top_shap_features: topShapFeatures,
    metrics_breakdown: {
      textual_score: parseFloat(Math.min(1, Math.max(0, (rawExclamationCount * 0.15 + (wordCount < 20 ? 0.4 : 0.1) + capsWords * 0.2))).toFixed(2)),
      behavioral_score: parseFloat((!isVerified ? 0.75 : 0.25).toFixed(2)),
      temporal_score: parseFloat((sameDayReviews > 2 ? 0.8 : 0.3).toFixed(2)),
    },
    disclaimer:
      'AI-generated prediction based on ensemble model (XGBoost Classifier v2.4). For human-in-the-loop validation only. Confidence thresholds: Genuine < 0.40, Low Confidence 0.40–0.60, Fake > 0.60.',
    timestamp: new Date().toISOString(),
    input_received: {
      text: text.length > 80 ? text.slice(0, 80) + '...' : text,
      rating,
      reviewerId,
    },
  };
};

/**
 * Simple CSV parser utility for batch prediction
 */
function parseCsvContent(csvText) {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line) => {
    const row = [];
    let insideQuotes = false;
    let entry = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        if (insideQuotes && line[i + 1] === '"') {
          entry += '"';
          i++;
        } else {
          insideQuotes = !insideQuotes;
        }
      } else if (char === ',' && !insideQuotes) {
        row.push(entry.trim());
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim());
    return row;
  };

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/["\s_]+/g, ''));
  const rows = lines.slice(1).map(parseLine);
  return { headers, rows };
}

/**
 * Mock predictor for batch CSV/JSON uploads
 * Parses actual CSV files, validates required headers, and performs row-by-row inference
 */
export const mockPredictBatch = async (file) => {
  if (file) {
    if (typeof file === 'object' && file.name) {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        throw new Error('Invalid file type: Only .csv files are supported.');
      }
      if (file.size > 10 * 1024 * 1024) {
        throw new Error(
          `File size exceeds limit: Uploaded file is ${(file.size / (1024 * 1024)).toFixed(2)} MB, but the maximum permitted size is 10 MB.`
        );
      }
      if (file.size === 0) {
        throw new Error('The uploaded CSV file is empty. Please select a valid file containing review rows.');
      }
    }

    let textContent = '';
    if (typeof file === 'string') {
      textContent = file;
    } else if (file.text && typeof file.text === 'function') {
      textContent = await file.text();
    } else if (typeof FileReader !== 'undefined' && file instanceof Blob) {
      textContent = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read uploaded file contents.'));
        reader.readAsText(file);
      });
    }

    if (textContent.trim().length === 0) {
      throw new Error('The uploaded CSV file is empty. Please select a file with review records.');
    }

    const { headers, rows } = parseCsvContent(textContent);

    const reviewTextIdx = headers.findIndex((h) => h === 'reviewtext' || h === 'text' || h === 'review');
    const ratingIdx = headers.findIndex((h) => h === 'rating' || h === 'stars' || h === 'score');
    const reviewerIdIdx = headers.findIndex((h) => h === 'reviewerid' || h === 'userid' || h === 'user');
    const dateIdx = headers.findIndex((h) => h === 'date' || h === 'timestamp' || h === 'createdat');

    const missingColumns = [];
    if (reviewTextIdx === -1) missingColumns.push('review_text');
    if (ratingIdx === -1) missingColumns.push('rating');

    if (missingColumns.length > 0) {
      throw new Error(
        `Missing required columns: [${missingColumns.join(', ')}]. CSV header must include "review_text" and "rating".`
      );
    }

    if (rows.length === 0) {
      throw new Error('CSV file contains a header row but no data records to evaluate.');
    }

    const results = rows.map((row, index) => {
      const reviewText = row[reviewTextIdx] || '';
      const rating = Number(row[ratingIdx]) || 5;
      const reviewerId = reviewerIdIdx !== -1 && row[reviewerIdIdx] ? row[reviewerIdIdx] : `USR-${1000 + index}`;
      const date = dateIdx !== -1 && row[dateIdx] ? row[dateIdx] : new Date().toISOString().split('T')[0];

      const pred = mockPredictReview({
        review_text: reviewText,
        rating,
        reviewer_id: reviewerId,
      });

      return {
        id: `BATCH-${String(index + 1).padStart(3, '0')}`,
        review_text: reviewText,
        rating,
        reviewer_id: reviewerId,
        date,
        fake_probability: pred.fake_probability,
        label: pred.label,
        low_confidence: pred.low_confidence,
      };
    });

    const total = results.length;
    const fakeCount = results.filter((r) => r.label === 'fake').length;
    const lowConfidenceCount = results.filter((r) => r.low_confidence).length;

    return {
      filename: file.name || 'batch_reviews_upload.csv',
      total_processed: total,
      fake_count: fakeCount,
      genuine_count: total - fakeCount,
      low_confidence_count: lowConfidenceCount,
      flagged_rate: parseFloat(((fakeCount / total) * 100).toFixed(1)),
      processed_at: new Date().toISOString(),
      results,
    };
  }

  // Fallback preset demo if invoked without file argument
  const sampleBatchResults = [
    {
      id: 'BATCH-001',
      review_text: 'BEST HEADPHONES EVER!! 10/10 MUST BUY NOW!!',
      rating: 5,
      reviewer_id: 'USR-8901',
      date: '2026-10-12',
      fake_probability: 0.94,
      label: 'fake',
      low_confidence: false,
    },
    {
      id: 'BATCH-002',
      review_text: 'Solid audio quality and comfortable for daily subway commutes. Battery lasts ~30 hours.',
      rating: 4,
      reviewer_id: 'USR-GEN-1044',
      date: '2026-10-11',
      fake_probability: 0.08,
      label: 'genuine',
      low_confidence: false,
    },
    {
      id: 'BATCH-003',
      review_text: 'Good product fast shipping.',
      rating: 5,
      reviewer_id: 'USR-8902',
      date: '2026-10-11',
      fake_probability: 0.68,
      label: 'fake',
      low_confidence: false,
    },
    {
      id: 'BATCH-004',
      review_text: 'Package arrived intact, seems ok so far.',
      rating: 3,
      reviewer_id: 'USR-EDGE-3012',
      date: '2026-10-10',
      fake_probability: 0.48,
      label: 'genuine',
      low_confidence: true,
    },
    {
      id: 'BATCH-005',
      review_text: 'TOTAL JUNK DO NOT WASTE YOUR MONEY REFUND REQUESTED!!',
      rating: 1,
      reviewer_id: 'USR-8903',
      date: '2026-10-09',
      fake_probability: 0.89,
      label: 'fake',
      low_confidence: false,
    },
    {
      id: 'BATCH-006',
      review_text: 'The color accuracy is accurate after calibration. Minimal backlight bleed.',
      rating: 5,
      reviewer_id: 'USR-GEN-1002',
      date: '2026-10-08',
      fake_probability: 0.12,
      label: 'genuine',
      low_confidence: false,
    },
  ];

  const total = sampleBatchResults.length;
  const fakeCount = sampleBatchResults.filter((r) => r.label === 'fake').length;
  const lowConfidenceCount = sampleBatchResults.filter((r) => r.low_confidence).length;

  return {
    filename: file?.name || 'sample_batch_reviews.csv',
    total_processed: total,
    fake_count: fakeCount,
    genuine_count: total - fakeCount,
    low_confidence_count: lowConfidenceCount,
    flagged_rate: parseFloat(((fakeCount / total) * 100).toFixed(1)),
    processed_at: new Date().toISOString(),
    results: sampleBatchResults,
  };
};

export default {
  mockPredictReview,
  mockPredictBatch,
};
