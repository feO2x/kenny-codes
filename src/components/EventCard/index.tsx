import React from 'react';
import Link from '@docusaurus/Link';
import type { EventFrontMatter } from '@site/src/types/event';
import styles from './styles.module.css';

interface EventCardProps extends EventFrontMatter {
  title: string;
  permalink: string;
  date: string;
  formattedDate: string;
  description?: string;
  tags?: Array<{ label: string; permalink: string }>;
}

const EventCard: React.FC<EventCardProps> = ({
  title,
  permalink,
  date,
  formattedDate,
  type,
  duration,
  language,
  location,
  country,
  event,
  description,
  tags,
}) => {
  const getTypeDisplay = () => {
    if (duration) {
      return `${type} ${duration}`;
    }
    return type;
  };

  return (
    <div className={styles.eventCard}>
      <div className={styles.eventHeader}>
        <h3 className={styles.eventTitle}>
          <Link to={permalink}>{title}</Link>
        </h3>
        <div className={styles.eventMeta}>
          {type && <span className={styles.eventType}>{getTypeDisplay()}</span>}
          {language && <span className={styles.eventLanguage}>({language})</span>}
        </div>
      </div>
      
      <div className={styles.eventDetails}>
        <div className={styles.eventInfo}>
          {event && <div className={styles.eventConference}>{event}</div>}
          <div className={styles.eventDateTime}>{formattedDate}</div>
          {location && (
            <div className={styles.eventLocation}>
              {location}
              {country && `, ${country}`}
            </div>
          )}
        </div>
        
        {description && (
          <div className={styles.eventDescription}>
            {description}
          </div>
        )}
        
        {tags && tags.length > 0 && (
          <div className={styles.eventTags}>
            {tags.map((tag, index) => (
              <Link key={index} to={tag.permalink} className={styles.tag}>
                {tag.label}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EventCard;
