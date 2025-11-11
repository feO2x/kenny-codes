import React from 'react';
import Layout from '@theme/Layout';
import HeaderWithImage from '@site/src/components/HeaderWithImage';
import EventCard from '@site/src/components/EventCard';
import type {Props} from '@theme/BlogListPage';
import type {EventFrontMatter} from '@site/src/types/event';
import styles from './styles.module.css';

type EventsBlogListContentProps = {
  items: Props['items'];
};

type BlogListItem = EventsBlogListContentProps['items'][number];

export default function EventsBlogListContent({items}: EventsBlogListContentProps) {
  // Custom layout for events page
  // Normalize to UTC midnight for consistent date comparisons
  const now = new Date();
  const nowUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const upcomingEvents = items.filter(item => {
    const eventDate = new Date(item.content.metadata.date);
    return eventDate.getTime() >= nowUtc;
  });

  const pastEvents = items.filter(item => {
    const eventDate = new Date(item.content.metadata.date);
    return eventDate.getTime() < nowUtc;
  });

  // Sort upcoming earliest first, past most recent first
  upcomingEvents.sort((a, b) =>
    new Date(a.content.metadata.date).getTime() -
    new Date(b.content.metadata.date).getTime(),
  );
  pastEvents.sort((a, b) =>
    new Date(b.content.metadata.date).getTime() -
    new Date(a.content.metadata.date).getTime(),
  );

  // Group past events by year
  const pastEventsByYear = pastEvents.reduce((acc, item) => {
    const year = new Date(item.content.metadata.date).getFullYear();
    if (!acc[year]) {
      acc[year] = [];
    }
    acc[year].push(item);
    return acc;
  }, {} as Record<number, BlogListItem[]>);

  // Get years in descending order
  const years = Object.keys(pastEventsByYear)
    .map(Number)
    .sort((a, b) => b - a);

  return (
    <Layout title="Events" description="Past and upcoming events">
      <HeaderWithImage title="Events" imageUrl="/kenny-codes/img/events.jpg" />

      <div className={styles.eventsContainer}>
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{items.length}</span>
            <span className={styles.statLabel}>Total Events</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{upcomingEvents.length}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{pastEvents.length}</span>
            <span className={styles.statLabel}>Past Events</span>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
            {upcomingEvents.map((item, index) => {
              const frontMatter = item.content.frontMatter as EventFrontMatter;
              return (
                <EventCard
                  key={index}
                  title={item.content.metadata.title}
                  permalink={item.content.metadata.permalink}
                  date={item.content.metadata.date}
                  formattedDate={formatDate(item.content.metadata.date)}
                  type={frontMatter.type}
                  duration={frontMatter.duration}
                  language={frontMatter.language}
                  location={frontMatter.location}
                  country={frontMatter.country}
                  event={frontMatter.event}
                  description={item.content.metadata.description}
                  tags={item.content.metadata.tags}
                />
              );
            })}
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Past Events</h2>
          {years.map(year => (
            <div key={year}>
              <h3 className={styles.yearHeader}>{year}</h3>
              {pastEventsByYear[year].map((item, index) => {
                const frontMatter = item.content.frontMatter as EventFrontMatter;
                return (
                  <EventCard
                    key={index}
                    title={item.content.metadata.title}
                    permalink={item.content.metadata.permalink}
                    date={item.content.metadata.date}
                    formattedDate={formatDate(item.content.metadata.date)}
                    type={frontMatter.type}
                    duration={frontMatter.duration}
                    language={frontMatter.language}
                    location={frontMatter.location}
                    country={frontMatter.country}
                    event={frontMatter.event}
                    description={item.content.metadata.description}
                    tags={item.content.metadata.tags}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
