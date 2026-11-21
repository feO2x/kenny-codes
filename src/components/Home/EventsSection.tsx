import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import clsx from 'clsx';
import homeData from '@site/src/data/home-data.json';
import EventRow from '../EventRow';
import SpeakingRecord from '../SpeakingRecord';
import {useToday} from '@site/src/utils/dateFormatting';
import {deliveredSessions} from '@site/src/utils/eventUtils';
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

const maxVisibleSessions = 4;

export default function EventsSection(): ReactNode {
  const events = homeData.events as HomeEvent[];
  const today = useToday();
  const delivered = deliveredSessions(events, today);
  const firstYear = events[events.length - 1]?.date.slice(0, 4);

  // Nearest upcoming sessions first (cancelled ones included so visitors learn about the
  // change), then the most recent delivered sessions fill the remaining rows.
  const upcoming = events
    .filter((event) => event.date.slice(0, 10) >= today)
    .reverse()
    .slice(0, maxVisibleSessions);
  const recent = delivered.slice(0, maxVisibleSessions - upcoming.length);
  const sessionGroups = [
    {title: 'Upcoming', sessions: upcoming, isUpcoming: true},
    {title: 'Recent sessions', sessions: recent, isUpcoming: false},
  ];

  return (
    <section className={styles.section} aria-labelledby="talks-title">
      <div className="container">
        <div className={styles.split}>
          <div className={styles.splitIntro}>
            <h2 id="talks-title" className={styles.sectionTitle}>
              Talks and workshops
            </h2>
            <p className={styles.sectionLede}>
              Conference sessions, workshops, and user group talks. I speak about:
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
            {sessionGroups
              .filter(({sessions}) => sessions.length > 0)
              .map(({title, sessions, isUpcoming}) => (
                <React.Fragment key={title}>
                  <h3 className={clsx(styles.sessionGroupTitle, isUpcoming && styles.upcomingTitle)}>
                    {title}
                  </h3>
                  {sessions.map((event) => (
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
                      isUpcoming={isUpcoming}
                      headingLevel="h4"
                      cancelled={event.cancelled}
                    />
                  ))}
                </React.Fragment>
              ))}
          </div>
        </div>

        <div className={styles.record}>
          <div className={styles.recordIntro}>
            <h3 className={styles.recordTitle}>
              {delivered.length} talks, workshops, and webinars since {firstYear}
            </h3>
            <Link to="/events" className={styles.textLink}>
              Browse all events
            </Link>
          </div>
          <SpeakingRecord events={events} interactive={false} className={styles.recordChart} />
        </div>
      </div>
    </section>
  );
}
