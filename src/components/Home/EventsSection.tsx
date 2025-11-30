import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from '@site/src/css/section.module.css';
import homeData from '@site/src/data/home-data.json';
import EventCard from '../EventCard';

export default function EventsSection() {
  const {recentEvents} = homeData;

  return (
    <section className={styles.section}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Upcoming & Recent Events
        </Heading>
        <div className={styles.cardGrid}>
          {recentEvents.map((event, idx) => (
            <EventCard
              key={idx}
              title={event.title}
              permalink={event.link}
              date={event.date}
              formattedDate={new Date(event.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              type={event.type}
              duration={event.duration}
              language={event.language}
              location={event.location}
              country={event.country}
              event={event.event}
              description={event.excerpt}
              tags={event.tags?.map(tag => ({ label: tag, permalink: '' }))}
            />
          ))}
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
