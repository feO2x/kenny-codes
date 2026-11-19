import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';
import {isEventPage} from '@site/src/utils/eventUtils';

export default function BlogPostItemHeader(): ReactNode {
  const {metadata, isBlogPostPage} = useBlogPost();
  const isEvent = isEventPage(metadata);

  return (
    <header>
      {isEvent && isBlogPostPage && (
        <Link to="/events" className="kc-back-link">
          All talks and workshops
        </Link>
      )}
      <BlogPostItemHeaderTitle />
      <BlogPostItemHeaderInfo />
      <BlogPostItemHeaderAuthors />
    </header>
  );
}
