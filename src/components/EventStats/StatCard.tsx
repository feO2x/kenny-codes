import React from 'react';
import styles from '@site/src/css/events.module.css';

export type StatCardProps = {
  number: number;
  label: string;
};

export default function StatCard({number, label}: StatCardProps) {
  return (
    <div className={styles.statCard}>
      <span className={styles.statNumber}>{number}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
