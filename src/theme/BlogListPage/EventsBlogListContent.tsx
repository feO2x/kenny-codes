import React from 'react';
import Layout from '@theme/Layout';
import HeaderWithImage from '@site/src/components/HeaderWithImage';
import EventCard from '@site/src/components/EventCard';
import type {Props} from '@theme/BlogListPage';
import type {EventFrontMatter} from '@site/src/types/event';
import {formatDate} from '@site/src/utils/dateFormatting';
import styles from '@site/src/css/events.module.css';

import {groupEvents} from '@site/src/utils/eventUtils';
import EventStats from '@site/src/components/EventStats';

type EventsBlogListContentProps = {
  items: Props['items'];
};

type BlogListItem = EventsBlogListContentProps['items'][number];

export default function EventsBlogListContent({items}: EventsBlogListContentProps) {
  const {upcomingEvents, pastEvents, pastEventsByYear, years} = groupEvents<BlogListItem>(items);

  return (
    <Layout title="Events" description="Past and upcoming events">
      <HeaderWithImage title="Events" imageUrl="/kenny-codes/img/events.jpg" />

      <div className={styles.eventsContainer}>
        <EventStats
          totalEvents={items.length}
          upcomingEvents={upcomingEvents.length}
          pastEvents={pastEvents.length}
        />

        {upcomingEvents.length > 0 && (
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Upcoming Events</h2>
            <div className={styles.cardList}>
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
                    videoUrl={frontMatter.videoUrl}
                  />
                );
              })}
            </div>
          </div>
        )}

        <div className={styles.section}>
          <h2 className={styles.sectionTitle}>Past Events</h2>
          {years.map(year => (
            <div key={year}>
              <h3 className={styles.yearHeader}>{year}</h3>
              <div className={styles.cardList}>
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
                      videoUrl={frontMatter.videoUrl}
                    />
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
