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
