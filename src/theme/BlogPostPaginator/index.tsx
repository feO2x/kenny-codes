import React, {type ReactNode} from 'react';
import PaginatorNavLink from '@theme/PaginatorNavLink';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {Props} from '@theme/BlogPostPaginator';
import homeData from '@site/src/data/home-data.json';
import {useToday} from '@site/src/utils/dateFormatting';
import {isEventPage, isHiddenFromArchive} from '@site/src/utils/eventUtils';

type NavItem = NonNullable<Props['nextItem']>;

/**
 * The archive hides cancelled events once their date has passed, so the Newer and Older links skip
 * them too. Falls back to the plugin's neighbours if the page is not in the generated event list.
 */
function useEventNeighbours(permalink: string, fallback: Props): Props {
  const today = useToday();
  const events = homeData.events; // newest first
  const index = events.findIndex((event) => permalink.replace(/\/$/, '').endsWith(event.link));
  if (index === -1) return fallback;

  const isListed = (event: (typeof events)[number]) => !isHiddenFromArchive(event, today);
  const toItem = (event: (typeof events)[number] | undefined): NavItem | undefined =>
    event && {title: event.title, permalink: event.link};

  return {
    prevItem: toItem(events.slice(0, index).reverse().find(isListed)),
    nextItem: toItem(events.slice(index + 1).find(isListed)),
  };
}

export default function BlogPostPaginator(props: Props): ReactNode {
  const {metadata} = useBlogPost();
  const isEvent = isEventPage(metadata);
  const eventNeighbours = useEventNeighbours(metadata.permalink, props);
  const {nextItem, prevItem} = isEvent ? eventNeighbours : props;
  const itemType = isEvent ? 'event' : 'post';

  if (!nextItem && !prevItem) return null;

  return (
    <nav className="pagination-nav docusaurus-mt-lg" aria-label={`${itemType} page navigation`}>
      {prevItem && <PaginatorNavLink {...prevItem} subLabel={`Newer ${itemType}`} />}
      {nextItem && <PaginatorNavLink {...nextItem} subLabel={`Older ${itemType}`} isNext />}
    </nav>
  );
}
