import React, {type ReactNode} from 'react';
import clsx from 'clsx';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import type {Props} from '@theme/BlogListPage';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import EventsBlogListContent from './EventsBlogListContent';
import {isEventsBlogList} from '@site/src/utils/eventUtils';

function BlogListPageMetadata(props: Props): ReactNode {
  const {metadata} = props;
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function BlogListPageContent(props: Props): ReactNode {
  const {metadata, items, sidebar} = props;
  const isEventsPage = isEventsBlogList(metadata);

  if (isEventsPage) {
    return <EventsBlogListContent items={items} />;
  }

  // Default blog layout for regular blog
  const isFirstPage = !metadata.previousPage;
  return (
    <BlogLayout sidebar={sidebar}>
      <header className="kc-page-header kc-page-header--divided">
        <Heading as="h1" className="kc-page-title">
          Blog
        </Heading>
        {isFirstPage && (
          <>
            <p className="kc-page-lede">
              Articles on AI-assisted development, software design, and .NET.
            </p>
            <Link to="/blog/tags" className="kc-text-link">
              Browse by topic
            </Link>
          </>
        )}
      </header>
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
