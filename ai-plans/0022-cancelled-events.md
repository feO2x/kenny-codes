# 0022 Cancelled Events

## Rationale

Occasionally, events get cancelled after they've already been published on the website. Rather than removing cancelled events entirely, they should remain visible with a clear "Cancelled" indicator while they are still upcoming, so visitors are informed. Once a cancelled event's date has passed, it should no longer appear in any listing (cards or stats) — as if it never happened. The event detail page should always remain accessible (via direct URL) and clearly state the cancellation.

## Acceptance Criteria

- [ ] Events support a `cancelled: true` frontmatter field
- [ ] On the events listing page (`/events`), a cancelled upcoming event shows a "CANCELLED" badge (red) instead of the "UPCOMING" badge (teal)
- [ ] On the events listing page, cancelled events are excluded from the past events section once their date has passed
- [ ] On tag-filtered listing pages (`/events/tags/[tag]`), the same cancelled logic applies (badge swap for upcoming, exclusion for past)
- [ ] The `EventStats` counts exclude cancelled events (both from "Total Events" and from "Upcoming"/"Past Events")
- [ ] On the event detail page, a prominent cancelled banner is shown above the event details grid when `cancelled: true`
- [ ] On the home page, a cancelled upcoming event shows the "CANCELLED" badge
- [ ] On the home page, a cancelled past event is filtered out at render time; `home-data.json` contains replacement events so 4 event cards are always displayed
- [ ] The `generate-home-data.ts` script includes the `cancelled` field in its output and generates `4 + N` events where N is the number of cancelled events among the top 4
- [ ] The workshop `2026-05-04-adc-workshop-ai-powered-cloud-native-backends-with-aspire-and-mea.md` has `cancelled: true` in its frontmatter

## Technical Details

### Frontmatter & Types

Add `cancelled?: boolean` to `EventFrontMatter` in `src/types/event.ts`. Set `cancelled: true` in the workshop's frontmatter.

### Badge Rendering (ContentCard)

In `src/components/ContentCard/index.tsx`, add a `cancelled` prop to `ContentCardProps`. In the badges section, when `cancelled` is true and `isUpcoming` is true, render a "CANCELLED" badge instead of "UPCOMING". When `cancelled` is true and the event is past, the card won't be rendered at all (handled by filtering), so no special badge logic is needed for that case.

Add a `.cancelledBadge` CSS class in `src/components/ContentCard/styles.module.css` styled with a red color scheme (`--kc-color-cancelled` / `--kc-color-cancelled-text`) to clearly distinguish it from the teal upcoming badge. Define the CSS custom properties in `src/css/custom.css`.

### EventCard Prop Forwarding

In `src/components/EventCard/index.tsx`, add `cancelled` to `EventCardProps` and forward it to `ContentCard`.

### Event Detail Page (EventDetails)

In `src/components/EventDetails/index.tsx`, read `cancelled` from `frontMatter`. When true, render a prominent banner above the metadata grid (e.g. a `div` with red/warning styling and text like "This event has been cancelled."). Add the corresponding CSS class in `src/components/EventDetails/styles.module.css`.

### Filtering in `groupEvents()` (eventUtils)

In `src/utils/eventUtils.ts`, extend the `EventItem` interface to include `content.frontMatter` (typed loosely or with `cancelled?: boolean`). In `groupEvents()`, after splitting into upcoming/past:
- Filter cancelled events **out of `pastProcessed`** (and consequently out of `pastEvents`, `pastEventsByYear`, and `years`)
- Keep cancelled events **in `upcomingProcessed`** (they show with the cancelled badge)
- This single change covers both the main listing page and the tag-filtered page since both use `groupEvents()`

Additionally, return a `cancelledUpcomingCount` from `groupEvents()` so that `EventStats` can subtract cancelled upcoming events from the "Upcoming" count (and from the total). Both `EventsBlogListContent.tsx` and `EventsBlogTagsPostsContent.tsx` pass these adjusted counts to `EventStats`.

### Listing Pages

In `EventsBlogListContent.tsx` and `EventsBlogTagsPostsContent.tsx`, pass `cancelled={frontMatter.cancelled}` when rendering `EventCard` for upcoming events. Adjust the `EventStats` counts using the `cancelledUpcomingCount` returned by `groupEvents()`.

### Home Page Data Generation (`generate-home-data.ts`)

In `scripts/generate-home-data.ts`:
- Read the `cancelled` frontmatter field and include it in the `ContentItem` interface (as `cancelled?: boolean`)
- After sorting events by date descending, take the top 4 and count how many are cancelled (N). Then take `4 + N` events total, so there are enough replacements
- Write `cancelled: true` to the JSON for affected events

### Home Page Rendering (`EventsSection.tsx`)

In `src/components/Home/EventsSection.tsx`:
- Filter out cancelled events whose date has passed
- Take the first 4 from the remaining list
- Pass `cancelled={event.cancelled}` to `EventCard`
