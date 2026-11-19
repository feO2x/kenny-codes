import React, {type ReactNode} from 'react';
import {deliveredSessions} from '@site/src/utils/eventUtils';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {FaGithub, FaLinkedinIn} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import homeData from '@site/src/data/home-data.json';
import SpeakingRecord from '../SpeakingRecord';
import {useToday} from '@site/src/utils/dateFormatting';
import {CONTACT_MAILTO, FEATURED_RECORDING, GITHUB_URL, LINKEDIN_URL, X_URL} from '@site/src/utils/contact';
import styles from './Home.module.css';

const socials = [
  {label: 'LinkedIn', href: LINKEDIN_URL, Icon: FaLinkedinIn},
  {label: 'GitHub', href: GITHUB_URL, Icon: FaGithub},
  {label: 'X', href: X_URL, Icon: FaXTwitter},
];

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export default function HeroSection(): ReactNode {
  const {events, venues} = homeData;
  const today = useToday();
  const delivered = deliveredSessions(events, today);
  const firstYear = events[events.length - 1]?.date.slice(0, 4);

  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroName}>
              Kenny Pflug
            </Heading>
            <p className={styles.heroStatement}>
              I build cloud-native .NET systems and help teams stay in control when AI agents
              write the code.
            </p>
            <p className={styles.heroRole}>
              Engineering Manager at{' '}
              <a href="https://gwvs.de/" target="_blank" rel="noopener noreferrer">
                TELIS/GWVS
              </a>
              , conference speaker, and consultant from Regensburg, Germany. Book me for talks,
              in-house workshops, or consulting on cloud-native .NET and AI-assisted development.
            </p>
            <div className={styles.heroActions}>
              <a
                className="button button--primary button--lg"
                href={`${CONTACT_MAILTO}?subject=Speaking%20or%20consulting%20inquiry`}>
                Email me
              </a>
              <Link className="button button--secondary button--lg" to="/events">
                See talks and workshops
              </Link>
            </div>
            <ul className={styles.socials} aria-label="Kenny Pflug elsewhere">
              {socials.map(({label, href, Icon}) => (
                <li key={label}>
                  <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                    <Icon aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className={styles.portraitFrame}>
            <img
              src={useBaseUrl('/img/kenny-smiles.jpg')}
              alt="Portrait of Kenny Pflug"
              className={styles.portrait}
              width={1600}
              height={1200}
              fetchPriority="high"
            />
          </div>
        </div>

        <section className={styles.record} aria-labelledby="speaking-record-title">
          <div className={styles.recordIntro}>
            <h2 id="speaking-record-title" className={styles.recordTitle}>
              {delivered.length} talks, workshops, and webinars since {firstYear}
            </h2>
            <p className={styles.recordText}>
              Regular speaker at {joinList(venues.slice(0, 5))}.
            </p>
            <div className={styles.recordLinks}>
              <Link to="/events" className={styles.textLink}>
                Browse all events
              </Link>
              {/* A recording lets organizers judge the delivery, not just the record. */}
              <a
                href={FEATURED_RECORDING.url}
                className={styles.textLink}
                target="_blank"
                rel="noopener noreferrer">
                {FEATURED_RECORDING.label}
              </a>
            </div>
          </div>
          <SpeakingRecord
            events={events}
            interactive={false}
            className={styles.recordChart}
          />
        </section>
      </div>
    </header>
  );
}
