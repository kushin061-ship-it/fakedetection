/**
 * Mock data for Error Analysis endpoint
 * Route: GET /api/errors?type={type}&page={page}&search={search}&limit={limit}
 *
 * Contains:
 * - 60 False Positives (True: Genuine, Pred: Fake)
 * - 60 False Negatives (True: Fake, Pred: Genuine)
 * - 40 Low Confidence cases (Probability: 0.40 - 0.60)
 */

// Realistic base templates for False Positives (Genuine reviews misclassified as Fake due to extreme emotions, brevity, or punctuation)
const fpTemplates = [
  { text: "DO NOT BUY THIS TRASH!! Stopped working after literally two days and customer support refused to refund!!", rating: 1, baseProb: 0.89, factor: "Excessive caps & angry sentiment extremity" },
  { text: "BEST PURCHASE EVER IN MY LIFE! Seriously cannot recommend this enough, ten out of ten stars!", rating: 5, baseProb: 0.92, factor: "Hyperbolic praise & extreme sentiment" },
  { text: "Works great. Exactly as described. Fast shipping.", rating: 5, baseProb: 0.74, factor: "Very short length & generic phrasing" },
  { text: "Horrible horrible horrible!! Broke right out of the box, plastic snapped instantly!", rating: 1, baseProb: 0.86, factor: "Repetitive negative tokens" },
  { text: "Love it!! Buying 3 more for my entire family tomorrow!", rating: 5, baseProb: 0.79, factor: "High purchase velocity claim & short text" },
  { text: "Waste of money... arrived broken and missing power adapter. Very disappointed.", rating: 1, baseProb: 0.72, factor: "Sparse account history with low rating" },
  { text: "Five stars! Perfect gift for my brother's birthday.", rating: 5, baseProb: 0.69, factor: "Ultra-short praise matching spam templates" },
  { text: "SCAM ALERT! The seller sent the wrong model and won't respond to messages!", rating: 1, baseProb: 0.88, factor: "Fraud accusation keywords & caps" },
  { text: "Just wow! Exceeded all my expectations! Highly recommend to everyone!", rating: 5, baseProb: 0.82, factor: "Generic enthusiasm & punctuation spikes" },
  { text: "Returned immediately. Smelled like heavy toxic chemicals when opened.", rating: 1, baseProb: 0.68, factor: "Single-review new account profile" },
  { text: "Super fast delivery, item is flawless. Will buy again!", rating: 5, baseProb: 0.76, factor: "Boilerplate fulfillment compliment" },
  { text: "Absolute garbage quality. Felt like cheap Dollar Store plastic. Do not waste your cash.", rating: 1, baseProb: 0.84, factor: "Strong negative lexicon triggers" },
];

// Realistic base templates for False Negatives (Stealthy fake reviews misclassified as Genuine because they imitate nuanced feedback)
const fnTemplates = [
  { text: "I have been using this monitor for about three weeks now. The color accuracy out of the box is decent, although the stand could be a bit sturdier. For the price point, it offers great value.", rating: 5, baseProb: 0.22, factor: "Engineered balanced critique mimicking organic user" },
  { text: "Compared to my older Sony headphones, the soundstage here is slightly narrower, but the battery life easily lasted me 30 hours during my commute. Comfortable padding around the ears.", rating: 5, baseProb: 0.18, factor: "Plausible technical comparison to mask paid promotion" },
  { text: "Was a bit hesitant due to the mixed reviews, but after testing the blender for morning smoothies, it crushed frozen berries and ice without overheating. Cleaning is straightforward.", rating: 5, baseProb: 0.26, factor: "Constructed objection-handling narrative" },
  { text: "The keyboard layout took a day or two to get used to, but the tactile switches feel surprisingly crisp. Comes with extra keycaps and a braided USB cable which is nice.", rating: 4, baseProb: 0.15, factor: "Subtle 4-star paid placement to avoid 5-star anomaly flags" },
  { text: "I bought this ergonomic chair for my home office setup. Assembly took roughly 25 minutes. Lumbar support is adjustable and the mesh keeps cool during long work sessions.", rating: 5, baseProb: 0.28, factor: "Normal word-count distribution evades length filters" },
  { text: "The fabric feels reasonably breathable after two laundry cycles. Fit is true to size around the shoulders, though sleeves are maybe half an inch long. Would recommend.", rating: 4, baseProb: 0.19, factor: "Fabricated detail mimicking authentic apparel reviews" },
  { text: "Decent budget espresso machine. Pressure gauge seems fairly accurate and the steam wand has adequate power for microfoam once you get the technique down.", rating: 5, baseProb: 0.31, factor: "Domain jargon used by outsourced PR agency" },
  { text: "Initial setup with the companion app took two attempts to pair over 2.4GHz Wi-Fi, but since then connectivity has been seamless. Schedules run reliably.", rating: 5, baseProb: 0.24, factor: "Faux minor friction complaint to boost credibility" },
  { text: "The vacuum suction is strong enough for hardwood and low-pile rugs. Dust bin is slightly smaller than Dyson but for half the price it performs admirably.", rating: 5, baseProb: 0.21, factor: "Competitor contrast framing evasion" },
  { text: "Packaging was neat and secure. Sound isolation is adequate for open office spaces and the microphone clarity is fine for Zoom calls.", rating: 4, baseProb: 0.17, factor: "Bland but realistic tone passing NLP sentiment filters" },
  { text: "Switched from a traditional backpack to this sling. Fits an 11-inch iPad, chargers, and a notebook easily. Water-resistant nylon handled a light rain shower well.", rating: 5, baseProb: 0.25, factor: "Coordinated syndicate with aged sleeper account" },
  { text: "Been taking these supplements for a month alongside my workout regimen. Energy levels throughout afternoon slumps have noticeably stabilized without jitteriness.", rating: 5, baseProb: 0.33, factor: "Long-term usage claim fabricated by astroturf group" },
];

// Realistic base templates for Low Confidence cases (Ambiguous, borderline probability: 0.40 - 0.60)
const lcTemplates = [
  { text: "It's alright. Does what it says on the box, nothing more nothing less.", rating: 3, baseProb: 0.49, factor: "Neutral sentiment with zero distinctive behavioral cues" },
  { text: "Package arrived in good condition. Haven't fully tested all functions yet, will update later if anything changes.", rating: 4, baseProb: 0.52, factor: "Incomplete trial review with borderline lexical features" },
  { text: "Good product but shipping took 10 days instead of 2. Product itself is 4 stars, logistics 2 stars.", rating: 3, baseProb: 0.46, factor: "Mixed focus between product quality and logistics" },
  { text: "Decent quality for the cost. Meets my expectations for occasional household use.", rating: 4, baseProb: 0.54, factor: "Short unverified purchase with moderate baseline score" },
  { text: "A bit smaller than I thought it would be from the photos, but build is sturdy enough.", rating: 3, baseProb: 0.47, factor: "Balanced subjective perception with average length" },
  { text: "Received as a gift. Works as expected so far.", rating: 4, baseProb: 0.53, factor: "Gift recipient profile with low account activity" },
  { text: "Works fine, looks nice on my desk. Price could be a few dollars lower.", rating: 4, baseProb: 0.48, factor: "Ambiguous polarity near decision boundary" },
  { text: "Not bad, but not amazing either. Average performance compared to similar items.", rating: 3, baseProb: 0.51, factor: "Symmetric pros/cons near neutral threshold" },
];

const products = [
  'UltraBass ANC Pro Headphones', 'Smart Health Watch V4', 'Ergonomic Mesh Chair Elite',
  '4K OLED Ultra Gaming Monitor', 'HydroGlow Smart Bottle', 'Mechanical Keyboard 75%',
  'Cordless Multi-Cyclonic Vacuum', 'AirPure HEPA Room Purifier', 'Sonic Clean Electric Toothbrush',
  'Dual-Zone Air Fryer 8Qt', 'PowerPulse Portable Charger', 'AromaMist Ultrasonic Diffuser',
];

// Generate 60 False Positives
const falsePositives = Array.from({ length: 60 }, (_, i) => {
  const tmpl = fpTemplates[i % fpTemplates.length];
  const prod = products[i % products.length];
  const jitter = ((i * 7) % 15 - 7) / 100;
  const prob = parseFloat(Math.min(0.96, Math.max(0.64, tmpl.baseProb + jitter)).toFixed(2));

  return {
    id: `ERR-FP-${String(i + 1).padStart(3, '0')}`,
    error_type: 'false_positive',
    review_text: i >= fpTemplates.length ? `${tmpl.text} [Product: ${prod}]` : tmpl.text,
    rating: tmpl.rating,
    predicted_label: 'fake',
    true_label: 'genuine',
    probability: prob,
    reviewer_id: `USR-GEN-${1000 + i}`,
    product_name: prod,
    primary_factor: tmpl.factor,
    confidence_delta: parseFloat((prob - 0.5).toFixed(2)),
  };
});

// Generate 60 False Negatives
const falseNegatives = Array.from({ length: 60 }, (_, i) => {
  const tmpl = fnTemplates[i % fnTemplates.length];
  const prod = products[(i + 3) % products.length];
  const jitter = ((i * 9) % 16 - 8) / 100;
  const prob = parseFloat(Math.min(0.38, Math.max(0.08, tmpl.baseProb + jitter)).toFixed(2));

  return {
    id: `ERR-FN-${String(i + 1).padStart(3, '0')}`,
    error_type: 'false_negative',
    review_text: i >= fnTemplates.length ? `${tmpl.text} (Reviewed ${prod})` : tmpl.text,
    rating: tmpl.rating,
    predicted_label: 'genuine',
    true_label: 'fake',
    probability: prob,
    reviewer_id: `USR-SYND-${2000 + i}`,
    product_name: prod,
    primary_factor: tmpl.factor,
    confidence_delta: parseFloat((0.5 - prob).toFixed(2)),
  };
});

// Generate 40 Low Confidence cases
const lowConfidence = Array.from({ length: 40 }, (_, i) => {
  const tmpl = lcTemplates[i % lcTemplates.length];
  const prod = products[(i + 5) % products.length];
  const jitter = ((i * 11) % 17 - 8) / 100;
  const prob = parseFloat(Math.min(0.59, Math.max(0.41, tmpl.baseProb + jitter)).toFixed(2));
  const pred = prob >= 0.50 ? 'fake' : 'genuine';
  const trueLabel = (i % 2 === 0) ? 'genuine' : 'fake';

  return {
    id: `ERR-LC-${String(i + 1).padStart(3, '0')}`,
    error_type: 'low_confidence',
    review_text: i >= lcTemplates.length ? `${tmpl.text} (${prod})` : tmpl.text,
    rating: tmpl.rating,
    predicted_label: pred,
    true_label: trueLabel,
    probability: prob,
    reviewer_id: `USR-EDGE-${3000 + i}`,
    product_name: prod,
    primary_factor: tmpl.factor,
    confidence_delta: parseFloat(Math.abs(prob - 0.5).toFixed(2)),
  };
});

// All 160 cases combined
export const allMockErrors = [...falsePositives, ...falseNegatives, ...lowConfidence];

/**
 * Filter, search, and paginate mock error cases
 */
export const filterMockErrors = ({
  type = 'all',
  page = 1,
  pageSize = 10,
  search = '',
} = {}) => {
  let filtered = allMockErrors;

  // Filter by error type
  if (type && type !== 'all') {
    const normalizedType = type.toLowerCase().replace(/[-_\s]/g, '');
    if (normalizedType.includes('positive') || normalizedType === 'fp') {
      filtered = filtered.filter((e) => e.error_type === 'false_positive');
    } else if (normalizedType.includes('negative') || normalizedType === 'fn') {
      filtered = filtered.filter((e) => e.error_type === 'false_negative');
    } else if (normalizedType.includes('confidence') || normalizedType === 'lc') {
      filtered = filtered.filter((e) => e.error_type === 'low_confidence');
    }
  }

  // Filter by search query
  if (search && search.trim() !== '') {
    const term = search.toLowerCase().trim();
    filtered = filtered.filter(
      (e) =>
        e.id.toLowerCase().includes(term) ||
        e.review_text.toLowerCase().includes(term) ||
        e.reviewer_id.toLowerCase().includes(term) ||
        e.product_name.toLowerCase().includes(term) ||
        e.primary_factor.toLowerCase().includes(term)
    );
  }

  const total = filtered.length;
  const currentPage = Math.max(1, parseInt(page, 10) || 1);
  const limit = Math.max(1, parseInt(pageSize, 10) || 10);
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (currentPage - 1) * limit;
  const paginatedData = filtered.slice(startIndex, startIndex + limit);

  return {
    data: paginatedData,
    total,
    page: currentPage,
    pageSize: limit,
    totalPages,
    summary: {
      totalFalsePositives: 60,
      totalFalseNegatives: 60,
      totalLowConfidence: 40,
      totalOverall: 160,
      currentFilteredCount: total,
    },
  };
};

export default {
  falsePositives,
  falseNegatives,
  lowConfidence,
  all: allMockErrors,
  filterMockErrors,
};
