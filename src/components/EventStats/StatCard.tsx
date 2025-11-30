import React from 'react';
import clsx from 'clsx';
import styles from '@site/src/css/events.module.css';

export type StatCardProps = {
  number: number;
  label: string;
};

export default function StatCard({number, label}: StatCardProps) {
  return (
    <div className={clsx(styles.statCard, 'kc-card-gradient-border')}>
      <span className={styles.statNumber}>{number}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}
