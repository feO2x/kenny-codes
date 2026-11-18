import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {FaGithub, FaLinkedinIn} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import homeData from '@site/src/data/home-data.json';
import SpeakingRecord from '../SpeakingRecord';
import {todayIsoDate} from '@site/src/utils/dateFormatting';
import styles from './Home.module.css';

const socials = [
  {label: 'LinkedIn', href: 'https://www.linkedin.com/in/kenny-pflug-7a1012123/', Icon: FaLinkedinIn},
  {label: 'GitHub', href: 'https://github.com/feO2x', Icon: FaGithub},
  {label: 'X', href: 'https://x.com/feO2x', Icon: FaXTwitter},
];

function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}

export default function HeroSection(): ReactNode {
  const {eventTimeline, venues} = homeData;
  const today = todayIsoDate();
  const delivered = eventTimeline.filter((e) => !e.cancelled && e.date < today);
  const firstYear = eventTimeline[0]?.date.slice(0, 4);

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
              , conference speaker, and consultant from Regensburg, Germany.
            </p>
            <div className={styles.heroActions}>
              <Link className="button button--primary button--lg" to="/events">
                See talks and workshops
              </Link>
              <Link className="button button--secondary button--lg" to="/blog">
                Read the blog
              </Link>
              <ul className={styles.socials}>
                {socials.map(({label, href, Icon}) => (
                  <li key={label}>
                    <a href={href} target="_blank" rel="noopener noreferrer" aria-label={label} title={label}>
                      <Icon aria-hidden="true" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>
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
            <Heading as="h2" id="speaking-record-title" className={styles.recordTitle}>
              {delivered.length} talks, workshops, and webinars since {firstYear}
            </Heading>
            <p className={styles.recordText}>
              Regular speaker at {joinList(venues.slice(0, 5))}.
            </p>
            <Link to="/events" className={styles.textLink}>
              Browse all events
            </Link>
          </div>
          <SpeakingRecord
            events={eventTimeline}
            yearLink={(year) => `/events#year-${year}`}
            className={styles.recordChart}
          />
        </section>
      </div>
    </header>
  );
}
