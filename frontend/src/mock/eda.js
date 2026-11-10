/**
 * Mock data for Exploratory Data Analysis (EDA) endpoint
 * Route: GET /api/eda
 */

export const mockEdaData = {
  summary: {
    totalReviews: 50000,
    genuineCount: 41000,
    fakeCount: 9000,
    fakePercentage: 18.0,
    genuinePercentage: 82.0,
    totalReviewers: 32410,
    totalProducts: 4820,
    avgRatingGenuine: 3.78,
    avgRatingFake: 4.12,
    avgLengthGenuine: 342,
    avgLengthFake: 186,
    burstPeriodsIdentified: 3,
  },

  // Class Distribution (Fake: 18%, Genuine: 82%)
  classDistribution: [
    { label: 'Genuine', count: 41000, percentage: 82.0, color: '#10b981' },
    { label: 'Fake', count: 9000, percentage: 18.0, color: '#ef4444' },
  ],

  // Rating Distribution by Class (1-5 Stars)
  // Shows bimodal extreme distribution for fake reviews (1-star attacks & 5-star promotions)
  ratingDistribution: [
    {
      star: 1,
      rating: '1 Star',
      genuineCount: 3321,
      genuinePercentage: 8.1,
      fakeCount: 2025,
      fakePercentage: 22.5,
    },
    {
      star: 2,
      rating: '2 Stars',
      genuineCount: 3854,
      genuinePercentage: 9.4,
      fakeCount: 378,
      fakePercentage: 4.2,
    },
    {
      star: 3,
      rating: '3 Stars',
      genuineCount: 6642,
      genuinePercentage: 16.2,
      fakeCount: 549,
      fakePercentage: 6.1,
    },
    {
      star: 4,
      rating: '4 Stars',
      genuineCount: 13038,
      genuinePercentage: 31.8,
      fakeCount: 1008,
      fakePercentage: 11.2,
    },
    {
      star: 5,
      rating: '5 Stars',
      genuineCount: 14145,
      genuinePercentage: 34.5,
      fakeCount: 5040,
      fakePercentage: 56.0,
    },
  ],

  // Review Length Histogram by Class (in words)
  // Fake reviews cluster heavily at very short boilerplate lengths (<30 words)
  reviewLengthHistogram: [
    { range: '1-20 words', genuine: 3200, fake: 3840, genuinePct: 7.8, fakePct: 42.7 },
    { range: '21-50 words', genuine: 6850, fake: 2520, genuinePct: 16.7, fakePct: 28.0 },
    { range: '51-100 words', genuine: 11400, fake: 1440, genuinePct: 27.8, fakePct: 16.0 },
    { range: '101-180 words', genuine: 10250, fake: 720, genuinePct: 25.0, fakePct: 8.0 },
    { range: '181-300 words', genuine: 6100, fake: 360, genuinePct: 14.9, fakePct: 4.0 },
    { range: '300+ words', genuine: 3200, fake: 120, genuinePct: 7.8, fakePct: 1.3 },
  ],

  // Reviews-per-Reviewer Distribution by Class
  // Fake accounts show high concentration of 1-time throwaway accounts and extreme burst farms
  reviewsPerReviewer: [
    { bin: '1 review', genuine: 21500, fake: 5940, genuinePct: 52.4, fakePct: 66.0 },
    { bin: '2-3 reviews', genuine: 11800, fake: 1170, genuinePct: 28.8, fakePct: 13.0 },
    { bin: '4-6 reviews', genuine: 4920, fake: 630, genuinePct: 12.0, fakePct: 7.0 },
    { bin: '7-10 reviews', genuine: 1845, fake: 450, genuinePct: 4.5, fakePct: 5.0 },
    { bin: '11-20 reviews', genuine: 697, fake: 360, genuinePct: 1.7, fakePct: 4.0 },
    { bin: '21+ reviews', genuine: 238, fake: 450, genuinePct: 0.6, fakePct: 5.0 },
  ],

  // Monthly Review Volume for 24 Months by Class (2024-11 to 2026-10)
  // Genuine is organic & smooth; Fake has 3 prominent spike burst anomalies:
  // Spike 1: 2025-06 (Summer Promo Attack - 1,420 fake reviews)
  // Spike 2: 2026-01 (Post-Holiday Smear Campaign - 1,890 fake reviews)
  // Spike 3: 2026-08 (Coordinated Product Launch Burst - 2,460 fake reviews)
  monthlyVolume: [
    { month: '2024-11', genuine: 1480, fake: 210, isSpike: false, label: 'Nov 24' },
    { month: '2024-12', genuine: 1820, fake: 280, isSpike: false, label: 'Dec 24' },
    { month: '2025-01', genuine: 1510, fake: 230, isSpike: false, label: 'Jan 25' },
    { month: '2025-02', genuine: 1420, fake: 205, isSpike: false, label: 'Feb 25' },
    { month: '2025-03', genuine: 1560, fake: 240, isSpike: false, label: 'Mar 25' },
    { month: '2025-04', genuine: 1610, fake: 260, isSpike: false, label: 'Apr 25' },
    { month: '2025-05', genuine: 1690, fake: 290, isSpike: false, label: 'May 25' },
    { month: '2025-06', genuine: 1720, fake: 1420, isSpike: true, spikeName: 'Summer Promo Burst', label: 'Jun 25' },
    { month: '2025-07', genuine: 1680, fake: 320, isSpike: false, label: 'Jul 25' },
    { month: '2025-08', genuine: 1710, fake: 295, isSpike: false, label: 'Aug 25' },
    { month: '2025-09', genuine: 1640, fake: 270, isSpike: false, label: 'Sep 25' },
    { month: '2025-10', genuine: 1750, fake: 285, isSpike: false, label: 'Oct 25' },
    { month: '2025-11', genuine: 1810, fake: 310, isSpike: false, label: 'Nov 25' },
    { month: '2025-12', genuine: 1980, fake: 350, isSpike: false, label: 'Dec 25' },
    { month: '2026-01', genuine: 1650, fake: 1890, isSpike: true, spikeName: 'Post-Holiday Attack', label: 'Jan 26' },
    { month: '2026-02', genuine: 1590, fake: 275, isSpike: false, label: 'Feb 26' },
    { month: '2026-03', genuine: 1690, fake: 290, isSpike: false, label: 'Mar 26' },
    { month: '2026-04', genuine: 1740, fake: 305, isSpike: false, label: 'Apr 26' },
    { month: '2026-05', genuine: 1820, fake: 330, isSpike: false, label: 'May 26' },
    { month: '2026-06', genuine: 1870, fake: 360, isSpike: false, label: 'Jun 26' },
    { month: '2026-07', genuine: 1830, fake: 340, isSpike: false, label: 'Jul 26' },
    { month: '2026-08', genuine: 1910, fake: 2460, isSpike: true, spikeName: 'Launch Syndicate Burst', label: 'Aug 26' },
    { month: '2026-09', genuine: 1860, fake: 380, isSpike: false, label: 'Sep 26' },
    { month: '2026-10', genuine: 1930, fake: 345, isSpike: false, label: 'Oct 26' },
  ],
};

export default mockEdaData;
