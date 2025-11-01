import React, {type ReactNode} from 'react';
import PaginatorNavLink from '@theme/PaginatorNavLink';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {Props} from '@theme/BlogPostPaginator';

export default function BlogPostPaginator(props: Props): ReactNode {
  const {nextItem, prevItem} = props;
  const {metadata} = useBlogPost();
  
  // Check if this is an event page
  const isEventPage = metadata.source?.includes('/events/') || metadata.permalink?.includes('/events/');
  const itemType = isEventPage ? 'event' : 'post';

  return (
    <nav
      className="pagination-nav docusaurus-mt-lg"
      aria-label={`${itemType} page navigation`}>
      {prevItem && (
        <PaginatorNavLink
          {...prevItem}
          subLabel={`Newer ${itemType}`}
        />
      )}
      {nextItem && (
        <PaginatorNavLink
          {...nextItem}
          subLabel={`Older ${itemType}`}
          isNext
        />
      )}
    </nav>
  );
}
