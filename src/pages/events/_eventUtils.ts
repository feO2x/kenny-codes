import { Event } from './_events';

export const isEventUpcoming = (event: Event): boolean => {
  const eventDate = new Date(event.startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to start of day for accurate comparison
  
  return eventDate >= today;
};

export const sortEventsByDate = (events: Event[], ascending = true): Event[] => {
  return [...events].sort((a, b) => {
    const dateA = new Date(a.startDate);
    const dateB = new Date(b.startDate);
    
    return ascending 
      ? dateA.getTime() - dateB.getTime()
      : dateB.getTime() - dateA.getTime();
  });
};

export const separateEvents = (events: Event[]) => {
  const upcomingEvents = events.filter(isEventUpcoming);
  const pastEvents = events.filter(event => !isEventUpcoming(event));
  
  return {
    upcoming: sortEventsByDate(upcomingEvents, true), // Upcoming events: earliest first
    past: sortEventsByDate(pastEvents, false) // Past events: most recent first
  };
};

export const getEventStats = (events: Event[]) => {
  const { upcoming, past } = separateEvents(events);
  const totalEvents = events.length;
  const upcomingCount = upcoming.length;
  const pastCount = past.length;
  
  // Get unique event types
  const eventTypes = [...new Set(events.map(event => event.type))];
  
  // Get unique locations
  const locations = [...new Set(events.map(event => event.location))];
  
  return {
    totalEvents,
    upcomingCount,
    pastCount,
    eventTypes,
    locations
  };
};