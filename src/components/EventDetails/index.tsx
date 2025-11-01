import React from 'react';
import { useBlogPost } from '@docusaurus/plugin-content-blog/client';
import type { EventFrontMatter } from '@site/src/types/event';
import styles from './styles.module.css';

export default function EventDetails() {
  const { metadata } = useBlogPost();
  const { frontMatter } = metadata;

  // Type the frontMatter with event-specific fields
  const eventFrontMatter = frontMatter as EventFrontMatter;

  const { type, duration, language, location, country, event } = eventFrontMatter;

  // Validate that event has required metadata
  if (!type && !duration && !language && !location && !country && !event) {
    throw new Error(
      `Event page is missing required frontmatter. ` +
      `At least one of the following fields must be provided: type, duration, language, location, country, event. ` +
      `Page: ${metadata.permalink}`
    );
  }

  return (
    <div className={styles.eventDetails}>
      <div className={styles.eventDetailsGrid}>
        {type && (
          <div className={styles.eventDetailItem}>
            <span className={styles.eventDetailLabel}>Type:</span>
            <span className={styles.eventDetailValue}>
              {type}
              {duration && ` (${duration})`}
            </span>
          </div>
        )}
        {language && (
          <div className={styles.eventDetailItem}>
            <span className={styles.eventDetailLabel}>Language:</span>
            <span className={styles.eventDetailValue}>{language}</span>
          </div>
        )}
        {event && (
          <div className={styles.eventDetailItem}>
            <span className={styles.eventDetailLabel}>Event:</span>
            <span className={styles.eventDetailValue}>{event}</span>
          </div>
        )}
        {(location || country) && (
          <div className={styles.eventDetailItem}>
            <span className={styles.eventDetailLabel}>Location:</span>
            <span className={styles.eventDetailValue}>
              {location}
              {location && country && ', '}
              {country}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
