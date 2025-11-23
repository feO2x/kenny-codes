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
  return metadata.source?.includes(eventsRoutePath) || metadata.permalink?.includes(eventsRoutePath);
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

export interface EventItem {
  content: {
    metadata: {
      date: string;
    };
  };
}

/**
 * Groups events into upcoming and past events, and groups past events by year.
 * 
 * @param items - List of blog posts/events
 * @returns Object containing upcoming events, past events, grouped past events, and years
 */
export function groupEvents<T extends EventItem>(items: ReadonlyArray<T>) {
  // Normalize to UTC midnight for consistent date comparisons
  const now = new Date();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const upcomingEvents = items.filter(item => {
    const eventDate = new Date(item.content.metadata.date);
    return eventDate.getTime() >= nowUtc;
  });

  const pastEvents = items.filter(item => {
    const eventDate = new Date(item.content.metadata.date);
    return eventDate.getTime() < nowUtc;
  });

  // Sort upcoming earliest first, past most recent first
  upcomingEvents.sort((a, b) =>
    new Date(a.content.metadata.date).getTime() -
    new Date(b.content.metadata.date).getTime(),
  );
  pastEvents.sort((a, b) =>
    new Date(b.content.metadata.date).getTime() -
    new Date(a.content.metadata.date).getTime(),
  );

  // Group past events by year
  const pastEventsByYear = pastEvents.reduce((acc, item) => {
    const year = new Date(item.content.metadata.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {} as Record<number, T[]>);

  // Get years in descending order
  const years = Object.keys(pastEventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return {
    upcomingEvents,
    pastEvents,
    pastEventsByYear,
    years
  };
}
