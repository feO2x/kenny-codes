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
