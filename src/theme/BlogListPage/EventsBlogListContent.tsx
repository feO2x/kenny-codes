import React, {type ReactNode} from 'react';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/BlogListPage';
import type {EventFrontMatter} from '@site/src/types/event';
import SpeakingRecord from '@site/src/components/SpeakingRecord';
import EventsListing from '@site/src/components/EventsListing';
import {useToday} from '@site/src/utils/dateFormatting';
import {deliveredSessions} from '@site/src/utils/eventUtils';
import {CONTACT_EMAIL, CONTACT_MAILTO, LINKEDIN_URL} from '@site/src/utils/contact';
import styles from './styles.module.css';

type EventsBlogListContentProps = {
  items: Props['items'];
};

export function EventsContact(): ReactNode {
  return (
    <p className={styles.contact}>
      Want me at your conference, user group, or company? Write to{' '}
      <a href={CONTACT_MAILTO}>{CONTACT_EMAIL}</a> or message me on{' '}
      <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
        LinkedIn
      </a>
      .
    </p>
  );
}

export default function EventsBlogListContent({items}: EventsBlogListContentProps): ReactNode {
  const today = useToday();
  const sessions = items.map((item) => ({
    date: item.content.metadata.date,
    cancelled: (item.content.frontMatter as EventFrontMatter).cancelled,
    language: (item.content.frontMatter as EventFrontMatter).language,
  }));
  const delivered = deliveredSessions(sessions, today);
  const firstYear = Math.min(...sessions.map((s) => Number(s.date.slice(0, 4))));
  const hasUpcoming = sessions.some((s) => s.date.slice(0, 10) >= today);
  const germanShare = delivered.filter((s) => s.language === 'German').length / Math.max(1, delivered.length);

  return (
    <Layout title="Talks and workshops" description="Past and upcoming talks, workshops, and webinars by Kenny Pflug">
      <main className="container kc-page">
        <header className={styles.header}>
          <div>
            <Heading as="h1" className={styles.title}>
              Talks and workshops
            </Heading>
            <p className={styles.lede}>
              Since {firstYear}, I have given {delivered.length} talks, workshops, and webinars at
              conferences, user groups, and universities
              {germanShare > 0.5 ? ', most of them in German' : ''}.
            </p>
            <EventsContact />
            <nav className={styles.jump} aria-label="On this page">
              {hasUpcoming && <Link to="#upcoming">Upcoming</Link>}
              <Link to="#past">Past sessions</Link>
              <Link to="/events/tags">Browse by topic</Link>
            </nav>
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
          <SpeakingRecord
            events={sessions}
            yearLink={(year) => `#year-${year}`}
            upcomingLink="#upcoming"
          />
        </section>

        <div>
          <EventsListing
            items={items}
            emptyUpcoming={
              <p>
                No public sessions are scheduled right now. New dates appear here first, and I
                announce them on{' '}
                <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
                  LinkedIn
                </a>
                .
              </p>
            }
          />
        </div>
      </main>
    </Layout>
  );
}
