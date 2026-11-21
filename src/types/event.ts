/**
 * Shared types for event-related components
 */

export interface EventFrontMatter {
  type?: string;
  duration?: string;
  language?: string;
  location?: string;
  country?: string;
  event?: string;
  videoUrl?: string;
  cancelled?: boolean;
}

/** Event summary displayed by `SpeakingRecord` squares, popovers, and the touch details bar. */
export interface RecordEvent extends Omit<EventFrontMatter, 'videoUrl'> {
  title: string;
  /** ISO date, either `YYYY-MM-DD` or a full timestamp. */
  date: string;
  /** Internal route path to the event page. */
  permalink: string;
}
