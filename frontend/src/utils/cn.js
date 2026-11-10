import { clsx } from 'clsx';

/**
 * Combines CSS class names conditionally
 */
export function cn(...inputs) {
  return clsx(inputs);
}
