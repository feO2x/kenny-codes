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
import homeData from '@site/src/data/home-data.json';
import {useToday} from '@site/src/utils/dateFormatting';
import type {Props} from '@theme/BlogTagsListPage';
import {isEventPage, isHiddenFromArchive} from '@site/src/utils/eventUtils';
import styles from './styles.module.css';

type TagItem = Props['tags'][number];

/** Topic pills whose accessible names read "AI, 11 sessions" rather than "AI11". */
function TagCloud({tags, unit}: {tags: ReadonlyArray<TagItem>; unit: Unit}): ReactNode {
  return (
    <ul className="kc-tags__list kc-tag-cloud">
      {tags.map((tag) => (
        <li key={tag.permalink}>
          <Link rel="tag" to={tag.permalink} title={tag.description} className="kc-tag">
            {tag.label}
            <span className="kc-tag__count">
              <span className="kc-sr-only">, </span>
              {tag.count}
              <span className="kc-sr-only"> {tag.count === 1 ? unit.one : unit.many}</span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

interface Unit {
  one: string;
  many: string;
}

/**
 * The most frequent topics as a ranked list with one square per session, the mark the speaking
 * record uses, so the index shows at a glance what the sessions are mostly about.
 */
function FrequentTopics({tags, unit}: {tags: ReadonlyArray<TagItem>; unit: Unit}): ReactNode {
  return (
    <div className={styles.rankingWrap}>
      <ol className={styles.ranking}>
        {tags.map((tag) => (
          <li key={tag.permalink}>
            <Link to={tag.permalink} className={styles.rank}>
              <span className={styles.rankLabel}>{tag.label}</span>
              <span className={styles.rankBar}>
                <span className={styles.rankSquares} aria-hidden="true">
                  {Array.from({length: tag.count}, (_, i) => (
                    <span
                      key={i}
                      className={styles.rankSquare}
                      />
                  ))}
                </span>
                <span className={styles.rankCount}>
                  <span className="kc-sr-only">, </span>
                  {tag.count}
                  <span className="kc-sr-only"> {tag.count === 1 ? unit.one : unit.many}</span>
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

/** First letter or digit, so ".NET" files under N and "C#" under C. */
function initialOf(label: string): string {
  return (label.match(/[\p{L}\d]/u)?.[0] ?? '#').toUpperCase();
}

const byLabel = (a: TagItem, b: TagItem) => a.label.localeCompare(b.label, 'en', {sensitivity: 'base'});

/**
 * Long topic lists get the most frequent topics first and then an A–Z index grouped by initial,
 * laid out on the same grid as the year groups of the events archive. Short lists stay one cloud.
 */
function TopicIndex({tags, unit}: {tags: ReadonlyArray<TagItem>; unit: Unit}): ReactNode {
  if (tags.length <= 16) {
    return <TagCloud tags={[...tags].sort(byCountThenLabel)} unit={unit} />;
  }
  const frequent = [...tags].sort(byCountThenLabel).slice(0, 10);
  const groups = new Map<string, TagItem[]>();
  for (const tag of [...tags].sort(byLabel)) {
    const initial = initialOf(tag.label);
    groups.set(initial, [...(groups.get(initial) ?? []), tag]);
  }
  const initials = [...groups.keys()].sort((a, b) => a.localeCompare(b));
  const letterId = (initial: string) => `topics-${initial.toLowerCase()}`;
  return (
    <>
      <section className={styles.section} aria-labelledby="topics-frequent">
        <h2 id="topics-frequent" className={styles.sectionTitle}>
          Most frequent
        </h2>
        <FrequentTopics tags={frequent} unit={unit} />
      </section>
      <section className={styles.section} aria-labelledby="topics-all">
        <h2 id="topics-all" className={styles.sectionTitle}>
          {`All ${tags.length} topics, A–Z`}
        </h2>
        <nav className={styles.jump} aria-label="Topics by initial">
          {initials.map((initial) => (
            <a key={initial} href={`#${letterId(initial)}`}>
              {initial}
            </a>
          ))}
        </nav>
        {initials.map((initial) => (
          <div key={initial} className={styles.letter}>
            <h3 id={letterId(initial)} className={styles.letterLabel}>
              {initial}
            </h3>
            <TagCloud tags={groups.get(initial) ?? []} unit={unit} />
          </div>
        ))}
      </section>
    </>
  );
}

const byCountThenLabel = (a: TagItem, b: TagItem) =>
  b.count - a.count || a.label.localeCompare(b.label, 'en', {sensitivity: 'base'});

/**
 * Docusaurus counts every event with a tag, including cancelled ones that the archive hides once
 * their date has passed. Subtract those so the numbers match what each topic page lists.
 */
function useHiddenSessionsBySlug(): Map<string, number> {
  const today = useToday();
  const hidden = new Map<string, number>();
  for (const event of homeData.events) {
    if (!isHiddenFromArchive(event, today)) continue;
    // Slugs come from Docusaurus's own tag normalization (see scripts/generate-home-data.ts).
    for (const slug of new Set(event.tagSlugs ?? [])) {
      hidden.set(slug, (hidden.get(slug) ?? 0) + 1);
    }
  }
  return hidden;
}

const SESSIONS: Unit = {one: 'session', many: 'sessions'};
const ARTICLES: Unit = {one: 'article', many: 'articles'};

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
          <p className="kc-page-lede">
            {topics.length} topics across past and upcoming talks, workshops, and webinars.
          </p>
          <a href="#topics-all" className="kc-text-link">
            Jump to A–Z
          </a>
        </header>
        <TopicIndex tags={topics} unit={SESSIONS} />
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
          <TopicIndex tags={tags} unit={ARTICLES} />
        </BlogLayout>
      )}
    </HtmlClassNameProvider>
  );
}
