import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import useIsBrowser from '@docusaurus/useIsBrowser';

/**
 * Formats a date string to a human-readable format using UTC timezone.
 * 
 * @param dateString - The date string to format (ISO 8601 or any valid date string)
 * @returns Formatted date string in "Month Day, Year" format (e.g., "January 15, 2024")
 * 
 * @example
 * formatDate('2024-01-15') // Returns "January 15, 2024"
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
}

/**
 * Today's date as `YYYY-MM-DD` in the visitor's local timezone. Comparing this string with an
 * event's `YYYY-MM-DD` date avoids Date-object timezone pitfalls for day-level logic.
 */
function todayIsoDate(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** Splits a date into the parts shown in an agenda-style date block, e.g. `Sep`, `17`, `2026`. */
export function dateParts(dateString: string): {month: string; day: string; year: string} {
  const date = new Date(dateString);
  return {
    month: date.toLocaleDateString('en-US', {month: 'short', timeZone: 'UTC'}),
    day: date.toLocaleDateString('en-US', {day: 'numeric', timeZone: 'UTC'}),
    year: date.toLocaleDateString('en-US', {year: 'numeric', timeZone: 'UTC'}),
  };
}

/**
 * Today's date as `YYYY-MM-DD`, safe for server rendering: the static HTML and the first browser
 * render use the build date, and the visitor's local date takes over right after hydration.
 */
export function useToday(): string {
  const {siteConfig} = useDocusaurusContext();
  const isBrowser = useIsBrowser();
  const buildDate = siteConfig.customFields?.buildDate as string | undefined;
  return isBrowser || !buildDate ? todayIsoDate() : buildDate;
}
