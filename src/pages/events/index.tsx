import Layout from "@theme/Layout";
import { ReactNode } from "react";
import HeaderWithImage from "@site/src/components/HeaderWithImage";
import EventsList from "@site/src/components/EventsList";
import { separateEvents, getEventStats } from "./_eventUtils";
import { events } from "./_events";
import styles from "./styles.module.css";

export default function Events(): ReactNode {
  const { upcoming, past } = separateEvents(events);
  const stats = getEventStats(events);

  return (
    <Layout title="Events" description="Past and upcoming events">
      <HeaderWithImage title="Events" imageUrl="/kenny-codes/img/events.jpg" />
      
      <div className={styles.eventsContainer}>
        <div className={styles.statsSection}>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.totalEvents}</span>
            <span className={styles.statLabel}>Total Events</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.upcomingCount}</span>
            <span className={styles.statLabel}>Upcoming</span>
          </div>
          <div className={styles.statCard}>
            <span className={styles.statNumber}>{stats.pastCount}</span>
            <span className={styles.statLabel}>Past Events</span>
          </div>
        </div>

        {upcoming.length > 0 && (
          <EventsList 
            events={upcoming} 
            title="Upcoming Events" 
            emptyMessage="No upcoming events scheduled."
          />
        )}
        
        <EventsList 
          events={past} 
          title="Past Events" 
          emptyMessage="No past events found."
        />
      </div>
    </Layout>
  );
}
