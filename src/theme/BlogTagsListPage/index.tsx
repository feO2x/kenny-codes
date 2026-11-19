import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import BlogLayout from '@theme/BlogLayout';
import SearchMetadata from '@theme/SearchMetadata';
import Heading from '@theme/Heading';
import Tag from '@theme/Tag';
import homeData from '@site/src/data/home-data.json';
import {useToday} from '@site/src/utils/dateFormatting';
import type {Props} from '@theme/BlogTagsListPage';
import {isEventPage} from '@site/src/utils/eventUtils';

type TagItem = Props['tags'][number];

function TagCloud({tags}: {tags: ReadonlyArray<TagItem>}): ReactNode {
  return (
    <ul className="kc-tags__list kc-tag-cloud">
      {tags.map((tag) => (
        <li key={tag.permalink}>
          <Tag {...tag} />
        </li>
      ))}
    </ul>
  );
}

const byCountThenLabel = (a: TagItem, b: TagItem) =>
  b.count - a.count || a.label.localeCompare(b.label, 'en', {sensitivity: 'base'});

/**
 * Approximates lodash's kebabCase, which Docusaurus uses to turn inline tags into permalinks, so
 * "performance" and "Performance" or "async await" and "async-await" land on the same topic.
 */
function tagSlug(tag: string): string {
  return tag
    .replace(/([a-z\d])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z\d]+/)
    .filter(Boolean)
    .join('-');
}

/**
 * Docusaurus counts every event with a tag, including cancelled ones that the archive hides once
 * their date has passed. Subtract those so the numbers match what each topic page lists.
 */
function useHiddenSessionsBySlug(): Map<string, number> {
  const today = useToday();
  const hidden = new Map<string, number>();
  for (const event of homeData.events) {
    if (!(event.cancelled && event.date < today)) continue;
    for (const slug of new Set((event.tags ?? []).map(tagSlug))) {
      hidden.set(slug, (hidden.get(slug) ?? 0) + 1);
    }
  }
  return hidden;
}

function EventTopics({tags}: {tags: ReadonlyArray<TagItem>}): ReactNode {
  const hidden = useHiddenSessionsBySlug();
  const topics = tags
    .map((tag) => {
      const slug = tag.permalink.split('/').filter(Boolean).pop() ?? '';
      return {...tag, count: tag.count - (hidden.get(slug) ?? 0)};
    })
    .filter((tag) => tag.count > 0)
    .sort(byCountThenLabel);
  return (
    <Layout title="Talk topics" description="Talks and workshops by Kenny Pflug, by topic">
      <main className="container kc-page">
        <header className="kc-page-header">
          <Link to="/events" className="kc-back-link">
            All talks and workshops
          </Link>
          <Heading as="h1" className="kc-page-title">
            Topics
          </Heading>
          <p className="kc-page-lede">Talks and workshops by topic, most frequent first.</p>
        </header>
        <TagCloud tags={topics} />
      </main>
    </Layout>
  );
}

export default function BlogTagsListPage({tags, sidebar}: Props): ReactNode {
  const title = 'Topics';
  const isEvents = tags.length > 0 && isEventPage({permalink: tags[0].permalink});
  // The visible h1 is "Topics" on both indexes; tab titles and descriptions tell them apart.
  const metaTitle = isEvents ? 'Talk topics' : 'Article topics';
  const metaDescription = isEvents
    ? 'Talks and workshops by Kenny Pflug, by topic'
    : 'Articles by Kenny Pflug, by topic';

  return (
    <HtmlClassNameProvider
      className={clsx(ThemeClassNames.wrapper.blogPages, ThemeClassNames.page.blogTagsListPage)}>
      <PageMetadata title={metaTitle} description={metaDescription} />
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
            <p className="kc-page-lede">Articles by topic, most frequent first.</p>
          </header>
          <TagCloud tags={[...tags].sort(byCountThenLabel)} />
        </BlogLayout>
      )}
    </HtmlClassNameProvider>
  );
}
