import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import homeData from '@site/src/data/home-data.json';
import EventRow from '../EventRow';
import {todayIsoDate} from '@site/src/utils/dateFormatting';
import styles from './Home.module.css';

interface HomeEvent {
  title: string;
  date: string;
  link: string;
  type?: string;
  location?: string;
  duration?: string;
  language?: string;
  country?: string;
  event?: string;
  cancelled?: boolean;
}

const topics = [
  'Cloud-native systems with AI integration',
  'AI-assisted development with coding agents',
  '.NET runtime internals: memory management, async programming, and threading',
  '.NET framework internals: ASP.NET Core, DI containers, ORMs, and serializers',
];

export default function EventsSection(): ReactNode {
  const recentEvents = homeData.recentEvents as HomeEvent[];
  const today = todayIsoDate();

  // Cancelled events stay visible while they are upcoming so visitors learn about the change.
  const visibleEvents = recentEvents
    .filter((event) => !(event.date < today && event.cancelled))
    .slice(0, 4);

  return (
    <section className={styles.section} aria-labelledby="talks-title">
      <div className="container">
        <div className={styles.split}>
          <div className={styles.splitIntro}>
            <Heading as="h2" id="talks-title" className={styles.sectionTitle}>
              Talks and workshops
            </Heading>
            <p className={styles.sectionLede}>
              Conference sessions, in-house workshops, and user group talks, mostly in German.
              I speak about:
            </p>
            <ul className={styles.topics}>
              {topics.map((topic) => (
                <li key={topic}>{topic}</li>
              ))}
            </ul>
            <Link to="/events" className={styles.textLink}>
              All talks and workshops
            </Link>
          </div>

          <div className={styles.splitList}>
            {visibleEvents.map((event) => (
              <EventRow
                key={event.link}
                title={event.title}
                permalink={event.link}
                date={event.date}
                type={event.type}
                duration={event.duration}
                language={event.language}
                location={event.location}
                country={event.country}
                event={event.event}
                isUpcoming={event.date >= today}
                cancelled={event.cancelled}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
