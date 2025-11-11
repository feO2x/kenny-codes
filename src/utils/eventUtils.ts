/**
 * Determines if a blog post is an event page based on its metadata.
 * 
 * @param metadata - The blog post metadata (from useBlogPost hook)
 * @returns true if the post is an event page, false otherwise
 */
export function isEventPage(metadata: {source?: string; permalink?: string}): boolean {
  return metadata.source?.includes('/events/') || metadata.permalink?.includes('/events/');
}
