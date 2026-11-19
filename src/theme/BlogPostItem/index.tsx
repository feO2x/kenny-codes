import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemContainer from '@theme/BlogPostItem/Container';
import BlogPostItemHeader from '@theme/BlogPostItem/Header';
import BlogPostItemContent from '@theme/BlogPostItem/Content';
import BlogPostItemFooter from '@theme/BlogPostItem/Footer';
import type {Props} from '@theme/BlogPostItem';
import EventInvite from '@site/src/components/EventInvite';
import EventDetails from '@site/src/components/EventDetails';
import {isEventPage} from '@site/src/utils/eventUtils';

// apply a bottom margin in list view
function useContainerClassName() {
  const {isBlogPostPage} = useBlogPost();
  return !isBlogPostPage ? 'margin-bottom--xl' : undefined;
}

export default function BlogPostItem({children, className}: Props): ReactNode {
  const containerClassName = useContainerClassName();
  const {metadata, isBlogPostPage} = useBlogPost();

  // Event pages: facts and the invitation sit beside the description on wide screens
  // (see .kc-event-layout in custom.css) and above and below it on narrow ones.
  if (isBlogPostPage && isEventPage(metadata)) {
    return (
      <BlogPostItemContainer className={clsx(containerClassName, className)}>
        <BlogPostItemHeader />
        <div className="kc-event-layout">
          <div className="kc-event-layout__body">
            <BlogPostItemContent>{children}</BlogPostItemContent>
          </div>
          <div className="kc-event-layout__side">
            <div className="kc-event-layout__details">
              <EventDetails />
            </div>
            <div className="kc-event-layout__invite">
              <EventInvite />
            </div>
          </div>
        </div>
        <BlogPostItemFooter />
      </BlogPostItemContainer>
    );
  }

  return (
    <BlogPostItemContainer className={clsx(containerClassName, className)}>
      <BlogPostItemHeader />
      <BlogPostItemContent>{children}</BlogPostItemContent>
      <BlogPostItemFooter />
    </BlogPostItemContainer>
  );
}
