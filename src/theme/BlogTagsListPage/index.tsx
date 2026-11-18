import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
  translateTagsPageTitle,
} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BlogLayout from '@theme/BlogLayout';
import SearchMetadata from '@theme/SearchMetadata';
import Heading from '@theme/Heading';
import Tag from '@site/src/theme/Tag';
import type {Props} from '@theme/BlogTagsListPage';
import {isEventPage} from '@site/src/utils/eventUtils';

type TagItem = Props['tags'][number];

function TagCloud({tags, hideCounts = false}: {tags: ReadonlyArray<TagItem>; hideCounts?: boolean}): ReactNode {
  return (
    <ul className="kc-tags__list kc-tag-cloud">
      {tags.map((tag) => (
        <li key={tag.permalink}>
          <Tag {...tag} hideCount={hideCounts} />
        </li>
      ))}
    </ul>
  );
}

const byCountThenLabel = (a: TagItem, b: TagItem) =>
  b.count - a.count || a.label.localeCompare(b.label, 'en', {sensitivity: 'base'});
const byLabel = (a: TagItem, b: TagItem) =>
  a.label.localeCompare(b.label, 'en', {sensitivity: 'base'});

function EventTopics({tags}: {tags: ReadonlyArray<TagItem>}): ReactNode {
  return (
    <Layout title="Topics" description="Talks and workshops by Kenny Pflug, by topic">
      <main className="container kc-narrow-page kc-wide-page">
        <header className="kc-page-header">
          <Link to="/events" className="kc-back-link">
            All talks and workshops
          </Link>
          <Heading as="h1" className="kc-page-title">
            Topics
          </Heading>
          <p className="kc-page-lede">Talks and workshops by topic, most frequent first.</p>
        </header>
        {/* Tag counts include cancelled sessions that the archive hides, so they are left out. */}
        <TagCloud tags={[...tags].sort(byCountThenLabel)} hideCounts />
      </main>
    </Layout>
  );
}

export default function BlogTagsListPage({tags, sidebar}: Props): ReactNode {
  const title = translateTagsPageTitle();
  const isEvents = tags.length > 0 && isEventPage({permalink: tags[0].permalink});

  return (
    <HtmlClassNameProvider
      className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogTagsListPage)}>
      <PageMetadata title={isEvents ? 'Topics' : title} />
      <SearchMetadata tag="blog_tags_list" />
      {isEvents ? (
        <EventTopics tags={tags} />
      ) : (
        <BlogLayout sidebar={sidebar}>
          <header className="kc-page-header">
            <Link to="/blog" className="kc-back-link">
              All articles
            </Link>
            <Heading as="h1" className="kc-page-title">
              {title}
            </Heading>
          </header>
          <TagCloud tags={[...tags].sort(byLabel)} />
        </BlogLayout>
      )}
    </HtmlClassNameProvider>
  );
}
