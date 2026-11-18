import React, {type ReactNode} from 'react';
import {useBlogPost} from '@docusaurus/plugin-content-blog/client';
import type {EventFrontMatter} from '@site/src/types/event';
import {formatDate} from '@site/src/utils/dateFormatting';
import {formatPlace} from '@site/src/components/EventRow';
import styles from './styles.module.css';

export default function EventDetails(): ReactNode {
  const {metadata} = useBlogPost();
  const {frontMatter, date} = metadata;

  const {type, duration, language, location, country, event, cancelled} =
    frontMatter as EventFrontMatter;

  // Validate that event has required metadata
  if (!type && !duration && !language && !location && !country && !event) {
    throw new Error(
      `Event page is missing required frontmatter. ` +
        `At least one of the following fields must be provided: type, duration, language, location, country, event. ` +
        `Page: ${metadata.permalink}`,
    );
  }

  const place = formatPlace(location, country);
  const details: Array<[string, string | undefined]> = [
    ['Event', event],
    ['Date', date ? formatDate(date) : undefined],
    ['Format', type],
    ['Duration', duration],
    ['Location', place || undefined],
    ['Language', language],
  ];

  return (
    <div className={styles.eventDetails}>
      {cancelled && <p className={styles.cancelledBanner}>This event has been cancelled.</p>}
      <dl className={styles.grid}>
        {details
          .filter(([, value]) => Boolean(value))
          .map(([label, value]) => (
            <div key={label} className={styles.item}>
              <dt className={styles.label}>{label}</dt>
              <dd className={styles.value}>{value}</dd>
            </div>
          ))}
      </dl>
    </div>
  );
}
