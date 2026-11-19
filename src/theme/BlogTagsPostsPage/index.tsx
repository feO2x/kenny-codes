import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import {useBlogTagsPostsPageTitle} from '@docusaurus/theme-common/internal';
import Link from '@docusaurus/Link';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import type {Props} from '@theme/BlogTagsPostsPage';
import BlogPostItems from '@theme/BlogPostItems';
import Unlisted from '@theme/ContentVisibility/Unlisted';
import Heading from '@theme/Heading';

import EventsBlogTagsPostsContent from './EventsBlogTagsPostsContent';
import {isEventsBlogList} from '@site/src/utils/eventUtils';

function BlogTagsPostsPageMetadata({tag}: Props): ReactNode {
  const title = useBlogTagsPostsPageTitle(tag);
  return (
    <>
      <PageMetadata title={title} description={tag.description} />
      <SearchMetadata tag="blog_tags_posts" />
    </>
  );
}

function BlogTagsPostsPageContent(props: Props): ReactNode {
  const {tag, items, sidebar, listMetadata} = props;
  
  if (isEventsBlogList(tag)) {
    return <EventsBlogTagsPostsContent {...props} />;
  }

  return (
    <BlogLayout sidebar={sidebar}>
      {tag.unlisted && <Unlisted />}
      <header className="kc-page-header kc-page-header--divided">
        <nav className="kc-back-links" aria-label="Writing">
          <Link to="/blog" className="kc-back-link">
            All articles
          </Link>
          <Link href={tag.allTagsPath} className="kc-back-link">
            All topics
          </Link>
        </nav>
        <Heading as="h1" className="kc-page-title">
          {tag.label}
        </Heading>
        <p className="kc-page-lede">
          {tag.count === 1 ? 'One article' : `${tag.count} articles`} tagged “{tag.label}”.
        </p>
      </header>
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={listMetadata} />
    </BlogLayout>
  );
}
export default function BlogTagsPostsPage(props: Props): ReactNode {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogTagPostListPage,
      )}>
      <BlogTagsPostsPageMetadata {...props} />
      <BlogTagsPostsPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
