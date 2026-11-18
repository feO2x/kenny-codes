import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogTagsPostsPage';
import EventsListing from '@site/src/components/EventsListing';
import {groupEvents} from '@site/src/utils/eventUtils';
import {useToday} from '@site/src/utils/dateFormatting';
import {EventsContact} from '@site/src/theme/BlogListPage/EventsBlogListContent';
import styles from '@site/src/theme/BlogListPage/styles.module.css';

export default function EventsBlogTagsPostsContent({items, tag}: Props): ReactNode {
  const title = `Talks and workshops on ${tag.label}`;
  // Count what the listing shows: cancelled sessions disappear once their date has passed.
  const {upcomingEvents, pastEvents} = groupEvents(items, useToday());
  const sessionCount = upcomingEvents.length + pastEvents.length;

  return (
    <Layout title={title} description={`Talks and workshops by Kenny Pflug tagged ${tag.label}`}>
      <main className="container">
        <header className={styles.header}>
          <div className={styles.headerText}>
            <nav className={styles.backLinks} aria-label="Events">
              <Link to="/events" className={styles.back}>
                All talks and workshops
              </Link>
              <Link to="/events/tags" className={styles.back}>
                All topics
              </Link>
            </nav>
            <Heading as="h1" className={styles.title}>
              {tag.label}
            </Heading>
            <p className={styles.lede}>
              {sessionCount === 1 ? 'One session' : `${sessionCount} sessions`} tagged “{tag.label}”.
            </p>
            <EventsContact />
          </div>
        </header>

        <div className={styles.listing}>
          <EventsListing items={items} />
        </div>
      </main>
    </Layout>
  );
}
