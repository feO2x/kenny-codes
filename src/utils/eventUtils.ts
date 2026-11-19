/**
 * Route base path for the events blog plugin.
 * This should match the routeBasePath in docusaurus.config.ts
 */
export const eventsId = 'events';
const eventsRoutePath = `/${eventsId}`;

/**
 * Determines if a blog post is an event page based on its metadata.
 * 
 * @param metadata - The blog post metadata (from useBlogPost hook)
 * @returns true if the post is an event page, false otherwise
 */
export function isEventPage(metadata: {source?: string; permalink?: string}): boolean {
  return Boolean(
    metadata.source?.includes(eventsRoutePath) ||
      metadata.permalink?.includes(eventsRoutePath)
  );
}

/**
 * Determines if a blog list page is the events blog list.
 * 
 * @param metadata - The blog list page metadata
 * @returns true if this is the events blog list page, false otherwise
 */
export function isEventsBlogList(metadata: {permalink: string}): boolean {
  return metadata.permalink.includes(eventsRoutePath);
}

interface EventItem {
  content: {
    metadata: {
      date: string;
    };
    frontMatter?: Record<string, unknown>;
  };
}

function isCancelled(frontMatter?: Record<string, unknown>): boolean {
  return frontMatter?.cancelled === true;
}

/**
 * Groups events into upcoming and past events, and groups past events by year.
 * Cancelled events are kept while upcoming so visitors learn about the change, and dropped once past.
 *
 * @param items - List of blog posts/events
 * @param today - Today's date as `YYYY-MM-DD` (see `useToday`)
 * @returns Object containing upcoming events, past events, grouped past events, and years
 */
export function groupEvents<T extends EventItem>(items: ReadonlyArray<T>, today: string) {
  // Day-level comparison on `YYYY-MM-DD` strings avoids timezone pitfalls.
  const day = (item: T) => item.content.metadata.date.slice(0, 10);

  const upcomingEvents = items
    .filter((item) => day(item) >= today)
    .sort((a, b) => day(a).localeCompare(day(b)));
  const pastEvents = items
    .filter(
      (item) =>
        day(item) < today &&
        !isHiddenFromArchive({date: day(item), cancelled: isCancelled(item.content.frontMatter)}, today),
    )
    .sort((a, b) => day(b).localeCompare(day(a)));

  const pastEventsByYear: Record<number, T[]> = {};
  for (const item of pastEvents) {
    const year = Number(day(item).slice(0, 4));
    (pastEventsByYear[year] ??= []).push(item);
  }

  const years = Object.keys(pastEventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return {upcomingEvents, pastEvents, pastEventsByYear, years};
}

/**
 * Sessions that took place: not cancelled and dated before today. The home page, the events
 * archive, and the topic index all quote this number, so they share one definition.
 */
export function deliveredSessions<T extends {date: string; cancelled?: boolean}>(
  sessions: ReadonlyArray<T>,
  today: string,
): T[] {
  return sessions.filter((session) => !session.cancelled && session.date.slice(0, 10) < today);
}

/**
 * Whether the archive hides a session: cancelled ones stay listed until their date has passed so
 * visitors learn about the change, then disappear. Topic counts and Newer/Older links follow suit.
 */
export function isHiddenFromArchive(session: {date: string; cancelled?: boolean}, today: string): boolean {
  return Boolean(session.cancelled) && session.date.slice(0, 10) < today;
}

