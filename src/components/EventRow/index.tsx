import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {FaYoutube} from 'react-icons/fa';
import type {EventFrontMatter} from '@site/src/types/event';
import {dateParts} from '@site/src/utils/dateFormatting';
import styles from './styles.module.css';

export interface EventRowProps extends EventFrontMatter {
  title: string;
  permalink: string;
  /** ISO date, either `YYYY-MM-DD` or a full timestamp. */
  date: string;
  isUpcoming?: boolean;
  headingLevel?: 'h3' | 'h4';
  /** Hide the year when the row already sits under a year heading. */
  showYear?: boolean;
}

/** Joins location and country without repeating the country ("Nürnberg, Germany" + "Germany"). */
export function formatPlace(location?: string, country?: string): string {
  if (!location) return country ?? '';
  if (!country || location.toLowerCase().includes(country.toLowerCase())) return location;
  return `${location}, ${country}`;
}

export function formatSessionFormat({type, duration, language}: EventFrontMatter): string {
  return [type, duration, language].filter(Boolean).join(', ');
}

export default function EventRow({
  title,
  permalink,
  date,
  type,
  duration,
  language,
  location,
  country,
  event,
  videoUrl,
  cancelled,
  isUpcoming = false,
  headingLevel = 'h3',
  showYear = true,
}: EventRowProps): ReactNode {
  const {month, day, year} = dateParts(date);
  const place = formatPlace(location, country);
  const format = formatSessionFormat({type, duration, language});
  const Heading = headingLevel;

  return (
    <article className={clsx(styles.row, cancelled && styles.cancelled)}>
      <time className={styles.date} dateTime={date.slice(0, 10)}>
        <span className={styles.month}>{month}</span>
        <span className={styles.day}>{day}</span>
        {showYear ? (
          <span className={styles.year}>{year}</span>
        ) : (
          <span className={styles.srOnly}>{year}</span>
        )}
      </time>

      <div className={styles.body}>
        {(cancelled || isUpcoming) && (
          <p className={styles.status}>
            {cancelled ? (
              <span className={clsx(styles.badge, styles.badgeCancelled)}>Cancelled</span>
            ) : (
              <span className={clsx(styles.badge, styles.badgeUpcoming)}>Upcoming</span>
            )}
          </p>
        )}
        <Heading className={styles.title}>
          <Link to={permalink} className={styles.titleLink}>
            {title}
          </Link>
        </Heading>
        <p className={styles.venue}>
          {event && <span className={styles.event}>{event}</span>}
          {place && <span className={styles.place}>{place}</span>}
        </p>
      </div>

      <div className={styles.aside}>
        {format && <span className={styles.format}>{format}</span>}
        {videoUrl && (
          <a className={styles.video} href={videoUrl} target="_blank" rel="noopener noreferrer">
            <FaYoutube aria-hidden="true" /> Watch recording
          </a>
        )}
      </div>
    </article>
  );
}
