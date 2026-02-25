import React from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import clsx from 'clsx';
import { FaYoutube } from 'react-icons/fa';
import styles from './styles.module.css';

interface Tag {
  label: string;
  permalink?: string;
}

export interface ContentCardProps {
  title: string;
  link: string;
  date?: string;
  type?: string; // e.g. "Talk", "Workshop"
  location?: string;
  tags?: string[] | Tag[];
  excerpt?: string;
  className?: string;
  showAllTags?: boolean;
  organizer?: string;
  children?: React.ReactNode; // allow passing custom footer or body if needed
  videoUrl?: string;
  isUpcoming?: boolean;
}

export default function ContentCard({
  title,
  link,
  date,
  type,
  location,
  tags,
  excerpt,
  className,
  showAllTags = false,
  organizer,
  children,
  videoUrl,
  isUpcoming = false,
}: ContentCardProps) {

  const renderTags = () => {
    if (!tags || tags.length === 0) return null;

    const displayTags = showAllTags ? tags : tags.slice(0, 3);

    return (
      <div className={styles.tags}>
        {displayTags.map((tag, idx) => {
          const label = typeof tag === 'string' ? tag : tag.label;
          const tagLink = typeof tag === 'string' ? null : tag.permalink;

          if (tagLink) {
             return (
              <Link key={idx} to={tagLink} className={styles.tag}>
                {label}
              </Link>
             );
          }
          return (
            <span key={idx} className={styles.tag}>
              {label}
            </span>
          );
        })}
      </div>
    );
  };

  return (
    <div className={clsx(styles.card, 'kc-card-gradient-border', className)}>
      <div className={styles.cardMeta}>
        <div className={styles.cardMetaInfo}>
          {date && <span>📅 {date}</span>}
          {location && <span>📍 {location}</span>}
          {organizer && <span>💬 {organizer}</span>}
        </div>
        <div className={styles.badges}>
          {isUpcoming && <span className={clsx('badge badge--info', styles.upcomingBadge)}>UPCOMING</span>}
          {type && <span className={clsx('badge badge--secondary', styles.typeBadge)}>{type}</span>}
        </div>
      </div>

      <Heading as="h3" className={styles.cardTitle}>
        <Link to={link}>{title}</Link>
      </Heading>

      {renderTags()}

      {excerpt && <p className={styles.cardExcerpt}>{excerpt}</p>}

      {children}

      <div className={styles.cardFooter}>
        <Link to={link} className="button button--small button--primary">
          Read More
        </Link>
        {videoUrl && (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={clsx('button button--small', styles.videoButton)}
          >
            <FaYoutube className={styles.youtubeIcon} />
            Watch Video
          </a>
        )}
      </div>
    </div>
  );
}
