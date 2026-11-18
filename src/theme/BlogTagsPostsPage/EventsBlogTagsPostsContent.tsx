import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogTagsPostsPage';
import EventsListing from '@site/src/components/EventsListing';
import {EventsContact} from '@site/src/theme/BlogListPage/EventsBlogListContent';
import styles from '@site/src/theme/BlogListPage/styles.module.css';

export default function EventsBlogTagsPostsContent({items, tag}: Props): ReactNode {
  const title = `Talks and workshops on ${tag.label}`;

  return (
    <Layout title={title} description={`Talks and workshops by Kenny Pflug tagged ${tag.label}`}>
      <main className="container">
        <header className={styles.header}>
          <div className={styles.headerText}>
            <Link to="/events" className={styles.back}>
              All talks and workshops
            </Link>
            <Heading as="h1" className={styles.title}>
              {tag.label}
            </Heading>
            <p className={styles.lede}>
              {tag.count === 1 ? 'One session' : `${tag.count} sessions`} tagged “{tag.label}”.
            </p>
            <EventsContact />
          </div>
        </header>

        <div className={styles.listing}>
          <EventsListing
            items={items}
            emptyUpcoming={<p>No upcoming sessions on this topic right now.</p>}
          />
        </div>
      </main>
    </Layout>
  );
}
