import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from '@site/src/css/section.module.css';
import homeData from '@site/src/data/home-data.json';
import EventCard from '../EventCard';
import {formatDate} from '@site/src/utils/dateFormatting';

interface HomeEvent {
  title: string;
  date: string;
  link: string;
  excerpt: string;
  tags?: string[];
  type?: string;
  location?: string;
  duration?: string;
  language?: string;
  country?: string;
  event?: string;
  cancelled?: boolean;
}

export default function EventsSection() {
  const recentEvents = homeData.recentEvents as HomeEvent[];

  // Derive today as YYYY-MM-DD in the user's local timezone.
  // String comparison against the event's YYYY-MM-DD date avoids
  // all Date-object timezone pitfalls for day-level logic.
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Filter out cancelled past events, then take first 4
  const visibleEvents = recentEvents
    .filter((event) => {
      const isPast = event.date < todayStr;
      return !(isPast && event.cancelled);
    })
    .slice(0, 4);

  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Upcoming & Recent Events
        </Heading>
        <div className={styles.cardGrid}>
          {visibleEvents.map((event, idx) => {
            const isUpcoming = event.date >= todayStr;
            
            return (
              <EventCard
                key={idx}
                title={event.title}
                permalink={event.link}
                date={event.date}
                formattedDate={formatDate(event.date)}
                type={event.type}
                duration={event.duration}
                language={event.language}
                location={event.location}
                country={event.country}
                event={event.event}
                description={event.excerpt}
                tags={event.tags?.map(tag => ({ label: tag, permalink: '' }))}
                isUpcoming={isUpcoming}
                cancelled={event.cancelled}
              />
            );
          })}
        </div>
        <div className="text--center margin-top--lg">

          <Link to="/events" className="button button--info button--lg">
            View All Events
          </Link>
        </div>
      </div>
    </section>
  );
}
