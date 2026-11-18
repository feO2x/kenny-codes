import React, {type ReactNode} from 'react';
import Heading from '@theme/Heading';
import useBrokenLinks from '@docusaurus/useBrokenLinks';
import type {EventFrontMatter} from '@site/src/types/event';
import {groupEvents} from '@site/src/utils/eventUtils';
import EventRow from '../EventRow';
import styles from './styles.module.css';

export interface ListingItem {
  content: {
    metadata: {
      title: string;
      permalink: string;
      date: string;
    };
    frontMatter: Record<string, unknown>;
  };
}

interface EventsListingProps<T extends ListingItem> {
  items: ReadonlyArray<T>;
  /** Shown when nothing is scheduled. */
  emptyUpcoming: ReactNode;
}

function renderRow(item: ListingItem, isUpcoming: boolean): ReactNode {
  const {metadata, frontMatter} = item.content;
  const fm = frontMatter as EventFrontMatter;
  return (
    <EventRow
      key={metadata.permalink}
      title={metadata.title}
      permalink={metadata.permalink}
      date={metadata.date}
      type={fm.type}
      duration={fm.duration}
      language={fm.language}
      location={fm.location}
      country={fm.country}
      event={fm.event}
      videoUrl={fm.videoUrl}
      cancelled={isUpcoming ? fm.cancelled : false}
      isUpcoming={isUpcoming}
      headingLevel={isUpcoming ? 'h3' : 'h4'}
    />
  );
}

function sessionsLabel(count: number): string {
  return count === 1 ? '1 session' : `${count} sessions`;
}

/** Upcoming events first, then past events grouped by year with a sticky year label. */
export default function EventsListing<T extends ListingItem>({
  items,
  emptyUpcoming,
}: EventsListingProps<T>): ReactNode {
  const {upcomingEvents, pastEventsByYear, years} = groupEvents(items);
  // Year anchors live on plain elements, so register them for the broken-anchor check.
  const brokenLinks = useBrokenLinks();
  years.forEach((year) => brokenLinks.collectAnchor(`year-${year}`));

  return (
    <>
      <section className={styles.group} aria-labelledby="upcoming-title">
        <Heading as="h2" id="upcoming-title" className={styles.groupTitle}>
          Upcoming
        </Heading>
        {upcomingEvents.length > 0 ? (
          <div className={styles.rows}>{upcomingEvents.map((item) => renderRow(item, true))}</div>
        ) : (
          <div className={styles.empty}>{emptyUpcoming}</div>
        )}
      </section>

      {years.length > 0 && (
        <section className={styles.group} aria-labelledby="past-title">
          <Heading as="h2" id="past-title" className={styles.groupTitle}>
            Past sessions
          </Heading>
          {years.map((year) => (
            <div key={year} id={`year-${year}`} className={styles.year}>
              <Heading as="h3" className={styles.yearLabel}>
                {year}
                <span className={styles.yearCount}>{sessionsLabel(pastEventsByYear[year].length)}</span>
              </Heading>
              <div className={styles.rows}>{pastEventsByYear[year].map((item) => renderRow(item, false))}</div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
