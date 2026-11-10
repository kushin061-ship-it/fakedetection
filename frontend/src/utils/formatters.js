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
 * Returns risk level category and colors based on probability.
 * Uses TrustLens design-system tokens only (no dark mode).
 */
export function getRiskLevel(probability) {
  const prob = probability > 1 ? probability / 100 : probability;
  if (prob >= 0.7) {
    return {
      label: 'High Risk (Fake)',
      variant: 'fake',
      color: '#E05A5A',
      textColor: 'text-tl-fake',
      bgColor: 'bg-tl-fake-bg',
      borderColor: 'border-tl-fake/30',
      inlineColor: '#E05A5A',
      inlineBg: 'rgba(224,90,90,0.14)',
      inlineBorder: 'rgba(224,90,90,0.3)',
    };
  }
  if (prob >= 0.4) {
    return {
      label: 'Suspicious / Moderate',
      variant: 'warning',
      color: '#E8A838',
      textColor: 'text-tl-warning',
      bgColor: 'bg-tl-warning-bg',
      borderColor: 'border-tl-warning/30',
      inlineColor: '#E8A838',
      inlineBg: 'rgba(232,168,56,0.14)',
      inlineBorder: 'rgba(232,168,56,0.3)',
    };
  }
  return {
    label: 'Genuine / Low Risk',
    variant: 'genuine',
    color: '#2FAE7A',
    textColor: 'text-tl-genuine',
    bgColor: 'bg-tl-genuine-bg',
    borderColor: 'border-tl-genuine/30',
    inlineColor: '#2FAE7A',
    inlineBg: 'rgba(47,174,122,0.14)',
    inlineBorder: 'rgba(47,174,122,0.3)',
  };
}
