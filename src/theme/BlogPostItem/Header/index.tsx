import React, {type ReactNode} from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import BlogPostItemHeaderTitle from '@theme/BlogPostItem/Header/Title';
import BlogPostItemHeaderInfo from '@theme/BlogPostItem/Header/Info';
import BlogPostItemHeaderAuthors from '@theme/BlogPostItem/Header/Authors';
import EventDetails from '@site/src/components/EventDetails';

export default function BlogPostItemHeader(): ReactNode {
  const {metadata} = useBlogPost();
  const isEventPage = metadata.source?.includes('/events/') || metadata.permalink?.includes('/events/');

  return (
    <header>
      <BlogPostItemHeaderTitle />
      <BlogPostItemHeaderInfo />
      <BlogPostItemHeaderAuthors />
      {isEventPage && <EventDetails />}
    </header>
  );
}
