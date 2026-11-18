import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import {todayIsoDate} from '@site/src/utils/dateFormatting';
import styles from './styles.module.css';

export interface RecordEvent {
  /** ISO date, either `YYYY-MM-DD` or a full timestamp. */
  date: string;
  cancelled?: boolean;
}

interface SpeakingRecordProps {
  events: ReadonlyArray<RecordEvent>;
  /** Where a year column links to, for example an anchor on the events page. */
  yearLink: (year: number) => string;
  className?: string;
}

interface YearColumn {
  year: number;
  delivered: number;
  upcoming: number;
}

function buildColumns(events: ReadonlyArray<RecordEvent>, today: string): YearColumn[] {
  const byYear = new Map<number, YearColumn>();
  for (const event of events) {
    if (event.cancelled) continue;
    const day = event.date.slice(0, 10);
    const year = Number(day.slice(0, 4));
    const column = byYear.get(year) ?? {year, delivered: 0, upcoming: 0};
    if (day >= today) column.upcoming += 1;
    else column.delivered += 1;
    byYear.set(year, column);
  }
  if (byYear.size === 0) return [];

  const years = [...byYear.keys()];
  const first = Math.min(...years);
  const last = Math.max(...years, Number(today.slice(0, 4)));
  const columns: YearColumn[] = [];
  for (let year = first; year <= last; year++) {
    columns.push(byYear.get(year) ?? {year, delivered: 0, upcoming: 0});
  }
  return columns;
}

function sessionsLabel(count: number): string {
  return count === 1 ? '1 session' : `${count} sessions`;
}

/**
 * Every talk, workshop, and webinar as one square, stacked per year.
 * Delivered sessions are filled, upcoming ones are outlined.
 */
export default function SpeakingRecord({events, yearLink, className}: SpeakingRecordProps): ReactNode {
  const columns = buildColumns(events, todayIsoDate());
  const tallest = Math.max(1, ...columns.map((c) => c.delivered + c.upcoming));
  const hasUpcoming = columns.some((c) => c.upcoming > 0);

  return (
    <figure className={clsx(styles.record, className)}>
      <ol className={styles.chart} style={{'--rows': tallest} as CSSProperties}>
        {columns.map((column, col) => {
          const total = column.delivered + column.upcoming;
          const label =
            column.upcoming > 0
              ? `${column.year}: ${sessionsLabel(column.delivered)} delivered, ${column.upcoming} upcoming`
              : `${column.year}: ${sessionsLabel(column.delivered)}`;
          const squares = Array.from({length: total}, (_, i) => (
            <span
              key={i}
              className={clsx(styles.square, i >= column.delivered && styles.squareUpcoming)}
              style={{'--i': i, '--col': col} as CSSProperties}
            />
          ));
          const body = (
            <>
              <span className={styles.srOnly}>{label}</span>
              <span className={styles.count} aria-hidden="true">{total > 0 ? total : ''}</span>
              <span className={styles.stack} aria-hidden="true">{squares}</span>
              <span className={styles.year} aria-hidden="true">
                <span className={styles.yearLong}>{column.year}</span>
                <span className={styles.yearShort}>’{String(column.year).slice(2)}</span>
              </span>
            </>
          );
          return (
            <li key={column.year} className={styles.column}>
              {total > 0 ? (
                <Link to={yearLink(column.year)} className={styles.columnLink}>
                  {body}
                </Link>
              ) : (
                <span className={styles.columnLink}>{body}</span>
              )}
            </li>
          );
        })}
      </ol>
      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.square} aria-hidden="true" /> One talk, workshop, or webinar
        </span>
        {hasUpcoming && (
          <span className={styles.legendItem}>
            <span className={clsx(styles.square, styles.squareUpcoming)} aria-hidden="true" /> Upcoming
          </span>
        )}
      </figcaption>
    </figure>
  );
}
