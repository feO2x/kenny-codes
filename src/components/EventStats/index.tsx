import React from 'react';
import styles from '@site/src/css/events.module.css';
import StatCard from './StatCard';

export type EventStatsProps = {
  totalEvents: number;
  upcomingEvents: number;
  pastEvents: number;
};

export default function EventStats({totalEvents, upcomingEvents, pastEvents}: EventStatsProps) {
  return (
    <div className={styles.statsSection}>
      <StatCard number={totalEvents} label="Total Events" />
      <StatCard number={upcomingEvents} label="Upcoming" />
      <StatCard number={pastEvents} label="Past Events" />
    </div>
  );
}
