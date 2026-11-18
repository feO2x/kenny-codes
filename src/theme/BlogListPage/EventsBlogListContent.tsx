import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import type {Props} from '@theme/BlogListPage';
import type {EventFrontMatter} from '@site/src/types/event';
import SpeakingRecord from '@site/src/components/SpeakingRecord';
import EventsListing from '@site/src/components/EventsListing';
import {todayIsoDate} from '@site/src/utils/dateFormatting';
import styles from './styles.module.css';

type EventsBlogListContentProps = {
  items: Props['items'];
};

export function EventsContact(): ReactNode {
  return (
    <p className={styles.contact}>
      Want me at your conference, user group, or company? Write to{' '}
      <a href="mailto:info@kenny-codes.net">info@kenny-codes.net</a> or message me on{' '}
      <a href="https://www.linkedin.com/in/kenny-pflug-7a1012123/" target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      .
    </p>
  );
}

export default function EventsBlogListContent({items}: EventsBlogListContentProps): ReactNode {
  const today = todayIsoDate();
  const sessions = items.map((item) => ({
    date: item.content.metadata.date,
    cancelled: (item.content.frontMatter as EventFrontMatter).cancelled,
    language: (item.content.frontMatter as EventFrontMatter).language,
  }));
  const delivered = sessions.filter((s) => !s.cancelled && s.date.slice(0, 10) < today);
  const firstYear = Math.min(...sessions.map((s) => Number(s.date.slice(0, 4))));
  const germanShare = delivered.filter((s) => s.language === 'German').length / Math.max(1, delivered.length);

  return (
    <Layout title="Events" description="Past and upcoming talks, workshops, and webinars by Kenny Pflug">
      <main className="container">
        <header className={styles.header}>
          <div className={styles.headerText}>
            <Heading as="h1" className={styles.title}>
              Talks and workshops
            </Heading>
            <p className={styles.lede}>
              Since {firstYear}, I have given {delivered.length} talks, workshops, and webinars at
              conferences, user groups, and universities
              {germanShare > 0.5 ? ', most of them in German' : ''}.
            </p>
            <EventsContact />
          </div>
          <figure className={styles.photo}>
            <img
              src={useBaseUrl('/img/conference.jpg')}
              alt="Kenny Pflug on stage in front of a full room of developers with laptops"
              width={800}
              height={1066}
            />
            <figcaption>Teaching a workshop at BASTA!</figcaption>
          </figure>
        </header>

        <section className={styles.record} aria-label="Sessions per year">
          <SpeakingRecord events={sessions} yearLink={(year) => `#year-${year}`} />
        </section>

        <div className={styles.listing}>
          <EventsListing
            items={items}
            emptyUpcoming={
              <p>
                No public sessions are scheduled right now. New dates appear here first, and I
                announce them on LinkedIn.
              </p>
            }
          />
        </div>
      </main>
    </Layout>
  );
}
