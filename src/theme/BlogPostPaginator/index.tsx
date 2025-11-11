import React, {type ReactNode} from 'react';
import PaginatorNavLink from '@theme/PaginatorNavLink';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {Props} from '@theme/BlogPostPaginator';
import {isEventPage} from '@site/src/utils/eventUtils';

export default function BlogPostPaginator(props: Props): ReactNode {
  const {nextItem, prevItem} = props;
  const {metadata} = useBlogPost();
  
  const itemType = isEventPage(metadata) ? 'event' : 'post';

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
