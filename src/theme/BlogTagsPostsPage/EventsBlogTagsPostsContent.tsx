import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogTagsPostsPage';
import EventsListing from '@site/src/components/EventsListing';
import SpeakingRecord from '@site/src/components/SpeakingRecord';
import type {EventFrontMatter} from '@site/src/types/event';
import {groupEvents} from '@site/src/utils/eventUtils';
import {useToday} from '@site/src/utils/dateFormatting';
import {EventsContact} from '@site/src/theme/BlogListPage/EventsBlogListContent';
import styles from '@site/src/theme/BlogListPage/styles.module.css';

export default function EventsBlogTagsPostsContent({items, tag}: Props): ReactNode {
  const title = `Talks and workshops on ${tag.label}`;
  // Count what the listing shows: cancelled sessions disappear once their date has passed.
  const {upcomingEvents, pastEvents} = groupEvents(items, useToday());
  const sessionCount = upcomingEvents.length + pastEvents.length;
  const sessions = items.map((item) => ({
    date: item.content.metadata.date,
    cancelled: (item.content.frontMatter as EventFrontMatter).cancelled,
  }));

  return (
    <Layout title={title} description={`Talks and workshops by Kenny Pflug tagged ${tag.label}`}>
      <main className="container kc-page">
        <header className={styles.header}>
          <div>
            <nav className="kc-back-links" aria-label="Events">
              <Link to="/events" className="kc-back-link">
                All talks and workshops
              </Link>
              <Link to="/events/tags" className="kc-back-link">
                All topics
              </Link>
            </nav>
            <Heading as="h1" className="kc-page-title">
              {tag.label}
            </Heading>
            <p className={styles.lede}>
              {sessionCount === 1 ? 'One session' : `${sessionCount} sessions`} tagged “{tag.label}”.
            </p>
            <EventsContact />
          </div>
          {sessionCount > 1 && (
            <section className={styles.topicRecord} aria-label={`Sessions on ${tag.label} per year`}>
              <SpeakingRecord
                events={sessions}
                yearLink={(year) => `#year-${year}`}
                upcomingLink="#upcoming"
              />
            </section>
          )}
        </header>

        <EventsListing items={items} />
      </main>
    </Layout>
  );
}
