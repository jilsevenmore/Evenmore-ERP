/**
 * Safe string manipulation utilities.
 * Handles null, undefined, objects, numbers, and unexpected types without throwing runtime exceptions.
 */

/**
 * Returns a guaranteed string, or the fallback if value is null/undefined/non-string.
 */
export function safeString(value, fallback = '') {
  if (value === null || value === undefined) return fallback;
  if (typeof value === 'string') return value;
  if (typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (typeof value === 'object') {
    return value.name || value.title || value.label || value.companyName || value.company || fallback;
  }
  return fallback;
}

/**
 * Safely extracts the first uppercase character for avatar initials.
 */
export function getInitial(value, fallback = '—') {
  const str = safeString(value, '').trim();
  if (!str) return fallback;
  return str.charAt(0).toUpperCase();
}

/**
 * Capitalizes the first letter of a string safely.
 */
export function capitalize(value, fallback = '') {
  const str = safeString(value, fallback).trim();
  if (!str) return fallback;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Converts kebab-case or hyphenated path segment to title case cleanly.
 */
export function toTitleCase(value, fallback = '') {
  const str = safeString(value, fallback);
  if (!str) return fallback;
  return str
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Strips accidental leading zeros while typing in number inputs (e.g. "0100" -> "100"),
 * while preserving valid single zero "0", decimals like "0.5", and empty string "".
 */
export function sanitizeNumberInput(value) {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str === '') return '';
  return str.replace(/^0+(?=\d)/, '');
}

/**
 * Focus event handler for number inputs to auto-select text so typing immediately replaces the existing number.
 */
export function handleNumberInputFocus(e) {
  if (e && e.target && typeof e.target.select === 'function') {
    e.target.select();
  }
}
