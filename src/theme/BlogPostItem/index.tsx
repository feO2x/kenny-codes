import React, {type ReactNode} from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import type {Props} from '@theme/BlogPostItem';
import EventInvite from '@site/src/components/EventInvite';
import EventDetails from '@site/src/components/EventDetails';
import {isEventPage} from '@site/src/utils/eventUtils';

export default function BlogPostItem({children, className}: Props): ReactNode {
  const {metadata, isBlogPostPage} = useBlogPost();

  // Event pages read facts, description, invitation in that order. Wide screens move the facts and
  // the invitation into a column beside the description (see .kc-event-layout in custom.css).
  if (isBlogPostPage && isEventPage(metadata)) {
    return (
      <BlogPostItemContainer className={className}>
        <BlogPostItemHeader />
        <div className="kc-event-layout">
          <div className="kc-event-layout__details">
            <EventDetails />
          </div>
          <div className="kc-event-layout__body">
            <BlogPostItemContent>{children}</BlogPostItemContent>
            {/* Tags follow the description directly, however tall the side column is. */}
            <BlogPostItemFooter />
          </div>
          <div className="kc-event-layout__invite">
            <EventInvite />
          </div>
        </div>
      </BlogPostItemContainer>
    );
  }

  return (
    <BlogPostItemContainer className={className}>
      <BlogPostItemHeader />
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
    </BlogPostItemContainer>
  );
}
