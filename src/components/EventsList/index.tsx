import React from 'react';
import EventCard from '../EventCard';
import { Event } from '../../pages/events/_events';
import styles from './styles.module.css';

interface EventsListProps {
  events: Event[];
  title: string;
  emptyMessage?: string;
}

const EventsList: React.FC<EventsListProps> = ({ events, title, emptyMessage = "No events found." }) => {
  if (events.length === 0) {
    return (
      <section className={styles.eventsSection}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        <p className={styles.emptyMessage}>{emptyMessage}</p>
      </section>
    );
  }

  return (
    <section className={styles.eventsSection}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={styles.eventsList}>
        {events.map((event, index) => (
          <EventCard key={index} event={event} />
        ))}
      </div>
    </section>
  );
};

export default EventsList;