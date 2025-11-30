import React from 'react';
import type { EventFrontMatter } from '@site/src/types/event';
import ContentCard from '../ContentCard';

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
    const parts = [];
    if (type) parts.push(type);
    if (duration) parts.push(duration);
    if (language) parts.push(`(${language})`);
    return parts.join(' • ');
  };

  const fullLocation = [location, country].filter(Boolean).join(', ');

  return (
    <ContentCard
      title={title}
      link={permalink}
      date={formattedDate}
      type={getTypeDisplay()}
      location={fullLocation}
      tags={tags}
      excerpt={description}
      showAllTags={true}
      organizer={event}
    />
  );
};

export default EventCard;
