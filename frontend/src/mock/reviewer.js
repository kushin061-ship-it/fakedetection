/**
 * Mock data for Reviewer Profile and Timeline
 * Route: GET /api/reviewer/{id}
 *
 * Provides stats plus an interactive review timeline
 */

import { mockSuspiciousReviewers } from './patterns.js';

export const mockDetailedReviewers = {
  'REV-USR-0104': {
    id: 'REV-USR-0104',
    name: 'FlashPromo_Global',
    email: 'ops@flashpromo-network.io',
    account_created_at: '2026-09-20',
    account_age_days: 22,
    status: 'flagged',
    risk_score: 98,
    reputation_tier: 'High Risk (Syndicate Node)',
    verified_purchases_ratio: 0.08,
    primary_syndicate_id: 'SYN-CLUSTER-409',
    stats: {
      total_reviews: 184,
      fake_reviews_count: 173,
      genuine_reviews_count: 11,
      fake_share: 0.94,
      fake_percentage: 94.0,
      average_rating: 4.96,
      rating_variance: 0.12,
      extreme_rating_ratio: 0.97, // 97% of ratings are 5-star or 1-star
      burst_count: 11,
      max_reviews_single_day: 18,
      avg_review_length_words: 16.8,
      avg_sentiment_polarity: 0.92,
      helpfulness_upvotes_received: 3,
    },
    top_flagged_patterns: [
      'extreme_rating + same-day_burst + short_text (Lift: 5.23)',
      'unverified_purchase + 5_stars + extreme_sentiment (Lift: 5.08)',
      'new_account (<3d) + burst_period + 5_stars (Lift: 5.34)',
    ],
    timeline: [
      {
        review_id: 'REV-EV-101',
        product_id: 'PRD-8821',
        product_name: 'UltraBass Wireless ANC Pro',
        category: 'Audio',
        date: '2026-10-10',
        timestamp: '2026-10-10T14:22:10Z',
        rating: 5,
        review_text: 'BEST HEADPHONES EVER IN HUMAN HISTORY!! MUST BUY!! Life changing sound!',
        fake_probability: 0.96,
        status: 'fake',
        is_burst: true,
        burst_name: 'Launch Syndicate Surge',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-102',
        product_id: 'PRD-8822',
        product_name: 'Smart Water Bottle HydroGlow',
        category: 'Fitness',
        date: '2026-10-10',
        timestamp: '2026-10-10T14:26:45Z',
        rating: 5,
        review_text: 'Works great!! Love it love it love it! 10/10 recommendation buy for everyone.',
        fake_probability: 0.94,
        status: 'fake',
        is_burst: true,
        burst_name: 'Launch Syndicate Surge',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-103',
        product_id: 'PRD-8823',
        product_name: 'Mechanical Keyboard RGB 75%',
        category: 'Peripherals',
        date: '2026-10-10',
        timestamp: '2026-10-10T14:31:02Z',
        rating: 5,
        review_text: 'Amazing tactile click sound is marvelous top seller top seller fast delivery!',
        fake_probability: 0.95,
        status: 'fake',
        is_burst: true,
        burst_name: 'Launch Syndicate Surge',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-104',
        product_id: 'PRD-9102',
        product_name: 'Ergonomic Mesh Chair Pro',
        category: 'Office',
        date: '2026-10-08',
        timestamp: '2026-10-08T03:14:20Z',
        rating: 5,
        review_text: 'Item exactly as described 5 stars fast shipping highly recommended.',
        fake_probability: 0.88,
        status: 'fake',
        is_burst: true,
        burst_name: 'Diurnal Night Owl Surge',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-105',
        product_id: 'PRD-7401',
        product_name: 'Competitor Dual Air Fryer',
        category: 'Kitchen',
        date: '2026-10-05',
        timestamp: '2026-10-05T02:40:11Z',
        rating: 1,
        review_text: 'DO NOT BUY THIS TRASH! Burned out immediately and smelled toxic! Total scam!',
        fake_probability: 0.92,
        status: 'fake',
        is_burst: true,
        burst_name: 'Competitor Smear Campaign',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-106',
        product_id: 'PRD-5509',
        product_name: 'USB-C Fast Charging Cable 3-Pack',
        category: 'Cables',
        date: '2026-09-28',
        timestamp: '2026-09-28T19:05:40Z',
        rating: 4,
        review_text: 'Cables arrived on time. Plugs fit snugly into my tablet and phone.',
        fake_probability: 0.38,
        status: 'genuine',
        is_burst: false,
        verified_purchase: true,
      },
      {
        review_id: 'REV-EV-107',
        product_id: 'PRD-4412',
        product_name: 'Sonic Clean Toothbrush V2',
        category: 'Personal Care',
        date: '2026-09-25',
        timestamp: '2026-09-25T11:48:33Z',
        rating: 5,
        review_text: 'Best sonic toothbrush on the market bar none! Teeth feel dentist clean every day!',
        fake_probability: 0.91,
        status: 'fake',
        is_burst: true,
        burst_name: 'End-of-Month Promotion',
        verified_purchase: false,
      },
      {
        review_id: 'REV-EV-108',
        product_id: 'PRD-3211',
        product_name: 'Wireless Bluetooth Travel Mouse',
        category: 'Peripherals',
        date: '2026-09-21',
        timestamp: '2026-09-21T09:12:00Z',
        rating: 5,
        review_text: 'Five stars flawless item love it so much buy now.',
        fake_probability: 0.89,
        status: 'fake',
        is_burst: false,
        verified_purchase: false,
      },
    ],
  },

  'USR-GEN-1000': {
    id: 'USR-GEN-1000',
    name: 'Dr. Michael Chen',
    email: 'mchen.research@techlab.org',
    account_created_at: '2021-03-14',
    account_age_days: 2038,
    status: 'genuine',
    risk_score: 4,
    reputation_tier: 'Verified Trusted Reviewer',
    verified_purchases_ratio: 0.96,
    primary_syndicate_id: null,
    stats: {
      total_reviews: 42,
      fake_reviews_count: 0,
      genuine_reviews_count: 42,
      fake_share: 0.0,
      fake_percentage: 0.0,
      average_rating: 4.12,
      rating_variance: 0.78,
      extreme_rating_ratio: 0.38, // balanced natural spread (2, 3, 4, 5 stars)
      burst_count: 0,
      max_reviews_single_day: 1,
      avg_review_length_words: 84.5,
      avg_sentiment_polarity: 0.28,
      helpfulness_upvotes_received: 284,
    },
    top_flagged_patterns: [],
    timeline: [
      {
        review_id: 'REV-EV-201',
        product_id: 'PRD-8821',
        product_name: 'UltraBass Wireless ANC Pro',
        category: 'Audio',
        date: '2026-10-09',
        timestamp: '2026-10-09T18:40:15Z',
        rating: 4,
        review_text: 'Decent battery life lasting around 28 hours. The noise cancellation is solid in office environments, though bass can feel slightly boomy on default EQ settings.',
        fake_probability: 0.06,
        status: 'genuine',
        is_burst: false,
        verified_purchase: true,
      },
      {
        review_id: 'REV-EV-202',
        product_id: 'PRD-6710',
        product_name: '4K OLED Gaming Monitor 27"',
        category: 'Displays',
        date: '2026-08-14',
        timestamp: '2026-08-14T20:12:44Z',
        rating: 5,
        review_text: 'Color calibration out of the box had Delta E under 1.4. Black levels are truly inky as expected from OLED panels. Text clarity with ClearType is acceptable for coding.',
        fake_probability: 0.04,
        status: 'genuine',
        is_burst: false,
        verified_purchase: true,
      },
      {
        review_id: 'REV-EV-203',
        product_id: 'PRD-4102',
        product_name: 'Studio Condenser USB Microphone',
        category: 'Audio',
        date: '2026-05-22',
        timestamp: '2026-05-22T16:05:10Z',
        rating: 3,
        review_text: 'Capsule sensitivity is high which picks up typing noise easily. You definitely need a boom arm and shock mount. Cardioid pattern is adequate.',
        fake_probability: 0.08,
        status: 'genuine',
        is_burst: false,
        verified_purchase: true,
      },
    ],
  },
};

/**
 * Get reviewer profile with fallback generator for arbitrary IDs
 * Throws an error for invalid IDs
 */
export const getMockReviewer = (id = 'REV-USR-0104') => {
  // Validate reviewer ID: must be a non-empty string with at least 3 valid chars
  if (!id || typeof id !== 'string') {
    throw new Error('Invalid reviewer ID: Identifier must be a non-empty string.');
  }

  const cleanId = id.trim();
  if (cleanId.length < 3) {
    throw new Error(`Invalid reviewer ID "${cleanId}": Identifier must contain at least 3 characters.`);
  }

  // Reject explicitly invalid test queries
  if (/^(null|undefined|invalid|NaN|test-error|@!#)$/i.test(cleanId) || /[^a-zA-Z0-9_\-.]/.test(cleanId)) {
    throw new Error(`Invalid reviewer ID "${cleanId}": ID contains unsupported characters or is malformed.`);
  }

  if (mockDetailedReviewers[cleanId]) {
    return mockDetailedReviewers[cleanId];
  }

  // Check if ID matches any of the 15 suspicious reviewers in patterns
  const suspiciousMatch = mockSuspiciousReviewers.find(
    (r) => r.id.toLowerCase() === cleanId.toLowerCase() || r.name.toLowerCase() === cleanId.toLowerCase()
  );

  if (suspiciousMatch) {
    const totalReviews = suspiciousMatch.total_reviews;
    const fakeShare = suspiciousMatch.fake_share;
    const fakeCount = Math.round(totalReviews * fakeShare);
    const genuineCount = totalReviews - fakeCount;

    return {
      id: suspiciousMatch.id,
      name: suspiciousMatch.name,
      email: `${suspiciousMatch.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@network-syndicate.org`,
      account_created_at: '2026-08-15',
      account_age_days: suspiciousMatch.account_age_days,
      status: suspiciousMatch.status,
      risk_score: suspiciousMatch.risk_score,
      reputation_tier: suspiciousMatch.risk_score > 90 ? 'High Risk (Syndicate Node)' : 'Flagged Reviewer Profile',
      verified_purchases_ratio: 0.08,
      primary_syndicate_id: 'SYN-CLUSTER-409',
      stats: {
        total_reviews: totalReviews,
        fake_reviews_count: fakeCount,
        genuine_reviews_count: genuineCount,
        fake_share: fakeShare,
        fake_percentage: parseFloat((fakeShare * 100).toFixed(1)),
        average_rating: suspiciousMatch.avg_rating,
        rating_variance: 0.15,
        extreme_rating_ratio: 0.94,
        burst_count: suspiciousMatch.burst_count,
        max_reviews_single_day: Math.min(18, Math.max(5, Math.round(suspiciousMatch.burst_count * 1.5))),
        avg_review_length_words: 17.4,
        avg_sentiment_polarity: suspiciousMatch.avg_rating > 3 ? 0.91 : -0.85,
        helpfulness_upvotes_received: 4,
      },
      top_flagged_patterns: [
        suspiciousMatch.dominant_pattern,
        'extreme_rating + same-day_burst + short_text',
      ],
      timeline: [
        {
          review_id: `REV-${suspiciousMatch.id}-01`,
          product_id: 'PRD-8821',
          product_name: 'UltraBass Wireless ANC Pro',
          category: 'Audio',
          date: suspiciousMatch.flagged_date,
          timestamp: `${suspiciousMatch.flagged_date}T14:22:10Z`,
          rating: suspiciousMatch.avg_rating > 3 ? 5 : 1,
          review_text: suspiciousMatch.avg_rating > 3
            ? 'BEST PURCHASE EVER!! Absolutely incredible item must buy 5 stars!'
            : 'COMPLETE SCAM DO NOT BUY!! Broke immediately seller won’t refund!!',
          fake_probability: 0.96,
          status: 'fake',
          is_burst: true,
          burst_name: 'Coordinated Launch Surge',
          verified_purchase: false,
        },
        {
          review_id: `REV-${suspiciousMatch.id}-02`,
          product_id: 'PRD-6710',
          product_name: '4K OLED Gaming Monitor 27"',
          category: 'Displays',
          date: '2026-09-18',
          timestamp: '2026-09-18T10:14:02Z',
          rating: suspiciousMatch.avg_rating > 3 ? 5 : 1,
          review_text: suspiciousMatch.avg_rating > 3
            ? 'Item exactly as described top quality seller fast shipping!'
            : 'DO NOT BUY THIS TRASH! Screen stopped turning on after two days!',
          fake_probability: 0.93,
          status: 'fake',
          is_burst: true,
          burst_name: 'Diurnal Surge',
          verified_purchase: false,
        },
        {
          review_id: `REV-${suspiciousMatch.id}-03`,
          product_id: 'PRD-5509',
          product_name: 'USB-C Fast Charging Cable 3-Pack',
          category: 'Cables',
          date: '2026-08-28',
          timestamp: '2026-08-28T19:05:40Z',
          rating: 4,
          review_text: 'Cables arrived on time. Plugs fit snugly into my tablet.',
          fake_probability: 0.28,
          status: 'genuine',
          is_burst: false,
          verified_purchase: true,
        },
      ],
    };
  }

  // Deterministic fallback generator for unknown reviewer IDs
  let hash = 0;
  for (let i = 0; i < cleanId.length; i++) {
    hash = (hash * 31 + cleanId.charCodeAt(i)) >>> 0;
  }
  const isSuspicious = hash % 2 === 0;
  const totalReviews = 12 + (hash % 85);
  const fakeShare = isSuspicious
    ? parseFloat((0.65 + (hash % 30) / 100).toFixed(2))
    : parseFloat(((hash % 15) / 100).toFixed(2));
  const fakeCount = Math.round(totalReviews * fakeShare);
  const genuineCount = totalReviews - fakeCount;
  const avgRating = isSuspicious ? (hash % 3 === 0 ? 1.25 : 4.88) : 4.12;
  const ratingVariance = isSuspicious ? 0.18 : 0.76;
  const extremeRatio = isSuspicious ? 0.92 : 0.35;
  const burstCount = isSuspicious ? 2 + (hash % 6) : 0;
  const riskScore = isSuspicious ? 76 + (hash % 22) : 6 + (hash % 18);

  return {
    id: cleanId,
    name: isSuspicious ? `FlaggedReviewer_${cleanId.slice(-4)}` : `Consumer_${cleanId.slice(-4)}`,
    email: `${cleanId.toLowerCase().replace(/[^a-z0-9]/g, '')}@marketplace-user.org`,
    account_created_at: isSuspicious ? '2026-07-20' : '2024-03-10',
    account_age_days: isSuspicious ? 82 : 940,
    status: isSuspicious ? 'flagged' : 'genuine',
    risk_score: riskScore,
    reputation_tier: isSuspicious ? 'Suspicious Reviewer Profile' : 'Standard Verified Consumer',
    verified_purchases_ratio: isSuspicious ? 0.12 : 0.88,
    primary_syndicate_id: isSuspicious ? 'SYN-NODE-GEN' : null,
    stats: {
      total_reviews: totalReviews,
      fake_reviews_count: fakeCount,
      genuine_reviews_count: genuineCount,
      fake_share: fakeShare,
      fake_percentage: parseFloat((fakeShare * 100).toFixed(1)),
      average_rating: avgRating,
      rating_variance: ratingVariance,
      extreme_rating_ratio: extremeRatio,
      burst_count: burstCount,
      max_reviews_single_day: isSuspicious ? 8 : 2,
      avg_review_length_words: isSuspicious ? 18.5 : 56.4,
      avg_sentiment_polarity: isSuspicious ? 0.88 : 0.34,
      helpfulness_upvotes_received: isSuspicious ? 6 : 82,
    },
    top_flagged_patterns: isSuspicious
      ? ['extreme_rating + same-day_burst + short_text', 'unverified_purchase + 5_stars']
      : [],
    timeline: [
      {
        review_id: `REV-${cleanId}-01`,
        product_id: 'PRD-8821',
        product_name: 'UltraBass Wireless ANC Pro',
        category: 'Audio',
        date: '2026-10-08',
        timestamp: '2026-10-08T12:00:00Z',
        rating: isSuspicious ? (avgRating > 3 ? 5 : 1) : 4,
        review_text: isSuspicious
          ? 'Amazing product!! Loved everything about it, 5 stars MUST BUY!'
          : 'Good audio performance and reasonable battery life. Comfortable headband for long wear.',
        fake_probability: isSuspicious ? 0.91 : 0.07,
        status: isSuspicious ? 'fake' : 'genuine',
        is_burst: isSuspicious,
        burst_name: isSuspicious ? 'Surge Window' : null,
        verified_purchase: !isSuspicious,
      },
      {
        review_id: `REV-${cleanId}-02`,
        product_id: 'PRD-6710',
        product_name: '4K OLED Gaming Monitor 27"',
        category: 'Displays',
        date: '2026-09-19',
        timestamp: '2026-09-19T15:30:00Z',
        rating: isSuspicious ? (avgRating > 3 ? 5 : 1) : 5,
        review_text: isSuspicious
          ? 'Five stars item as described top quality seller.'
          : 'Colors and black levels look fantastic. Very little blooming around subtitles.',
        fake_probability: isSuspicious ? 0.86 : 0.05,
        status: isSuspicious ? 'fake' : 'genuine',
        is_burst: false,
        verified_purchase: !isSuspicious,
      },
      {
        review_id: `REV-${cleanId}-03`,
        product_id: 'PRD-4102',
        product_name: 'Studio Condenser USB Microphone',
        category: 'Audio',
        date: '2026-08-25',
        timestamp: '2026-08-25T11:15:00Z',
        rating: isSuspicious ? 1 : 3,
        review_text: isSuspicious
          ? 'GARBAGE SCAM!! Broke on arrival do not buy!'
          : 'Muffled on the low end without an external preamp, but fine for casual video calls.',
        fake_probability: isSuspicious ? 0.89 : 0.12,
        status: isSuspicious ? 'fake' : 'genuine',
        is_burst: isSuspicious,
        burst_name: isSuspicious ? 'Coordinated Attack' : null,
        verified_purchase: !isSuspicious,
      },
    ],
  };
};

export default {
  mockDetailedReviewers,
  getMockReviewer,
};
