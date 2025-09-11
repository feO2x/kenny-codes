import React from 'react';
import styles from './styles.module.css';
import { Event } from '../../pages/events/events';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toISOString().split('T')[0]; // yyyy-MM-dd format
  };

  const formatDateRange = () => {
    if (event.endDate && event.startDate !== event.endDate) {
      return `${formatDate(event.startDate)} - ${formatDate(event.endDate)}`;
    }
    return formatDate(event.startDate);
  };

  const getTypeDisplay = () => {
    if (event.duration) {
      return `${event.type} ${event.duration}`;
    }
    return event.type;
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <h3 className={styles.eventTitle}>
          <a href={event.url} target="_blank" rel="noopener noreferrer">
            {event.title}
          </a>
        </h3>
        <div className={styles.eventMeta}>
          <span className={styles.eventType}>{getTypeDisplay()}</span>
          <span className={styles.eventLanguage}>({event.language})</span>
        </div>
      </div>
      
      <div className={styles.eventDetails}>
        <div className={styles.eventInfo}>
          <div className={styles.eventConference}>{event.event}</div>
          <div className={styles.eventDateTime}>
            {formatDateRange()}
            {event.startTime && ` | ${event.startTime}`}
          </div>
          <div className={styles.eventLocation}>
            {event.location}
            {event.country && `, ${event.country}`}
          </div>
        </div>
        
        <div className={styles.eventDescription}>
          {event.description}
        </div>
        
        {event.tags.length > 0 && (
          <div className={styles.eventTags}>
            {event.tags.map((tag, index) => (
              <span key={index} className={styles.tag}>
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;