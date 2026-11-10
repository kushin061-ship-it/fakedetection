/**
 * Formats a decimal number (0.0 to 1.0) or number into a percentage string
 */
export function formatPercent(value, decimals = 1) {
  if (value === undefined || value === null || isNaN(value)) return '0%';
  const num = value > 1 ? value : value * 100;
  return `${num.toFixed(decimals)}%`;
}

/**
 * Formats large numbers with compact suffix (e.g. 1.2k, 4.5M)
 */
export function formatCompactNumber(number) {
  if (number === undefined || number === null || isNaN(number)) return '0';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(number);
}

/**
 * Returns risk level category and colors based on probability
 */
export function getRiskLevel(probability) {
  const prob = probability > 1 ? probability / 100 : probability;
  if (prob >= 0.7) {
    return {
      label: 'High Risk (Fake)',
      variant: 'fake',
      color: 'rose',
      textColor: 'text-rose-600 dark:text-rose-400',
      bgColor: 'bg-rose-50 dark:bg-rose-950/40',
      borderColor: 'border-rose-200 dark:border-rose-800',
    };
  }
  if (prob >= 0.4) {
    return {
      label: 'Suspicious / Moderate',
      variant: 'warning',
      color: 'amber',
      textColor: 'text-amber-600 dark:text-amber-400',
      bgColor: 'bg-amber-50 dark:bg-amber-950/40',
      borderColor: 'border-amber-200 dark:border-amber-800',
    };
  }
  return {
    label: 'Genuine / Low Risk',
    variant: 'genuine',
    color: 'emerald',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-50 dark:bg-emerald-950/40',
    borderColor: 'border-emerald-200 dark:border-emerald-800',
  };
}
