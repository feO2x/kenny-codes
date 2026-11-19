import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {FaGithub, FaLinkedinIn, FaRegEnvelope, FaYoutube} from 'react-icons/fa';
import {FaXTwitter} from 'react-icons/fa6';
import {CONTACT_MAILTO, FEATURED_RECORDING, GITHUB_URL, LINKEDIN_URL, X_URL} from '@site/src/utils/contact';
import styles from './Home.module.css';

// LinkedIn is the main call to action, so the row keeps the other ways to reach me.
const socials = [
  {label: 'Email', href: `${CONTACT_MAILTO}?subject=Speaking%20or%20consulting%20inquiry`, Icon: FaRegEnvelope},
  {label: 'GitHub', href: GITHUB_URL, Icon: FaGithub},
  {label: 'X', href: X_URL, Icon: FaXTwitter},
];

export default function HeroSection(): ReactNode {
  return (
    <header className={styles.hero}>
      <div className="container">
        <div className={styles.heroGrid}>
          <div className={styles.heroText}>
            <Heading as="h1" className={styles.heroName}>
              <span className={styles.greeting}>Hi, I’m</span>{' '}
              <span className={styles.greetingName}>Kenny.</span>
            </Heading>
            <p className={styles.heroStatement}>
              I build cloud-native .NET systems and help teams stay in control when AI agents
              write the code.
            </p>
            <p className={styles.heroRole}>
              {/* The greeting uses my first name; the full name belongs right under it. */}
              <strong className={styles.heroFullName}>Kenny Pflug</strong>, Engineering Manager at{' '}
              <a href="https://gwvs.de/">TELIS/GWVS</a>, conference speaker, and consultant from
              Regensburg, Germany. Book me for talks, in-house workshops, or consulting.
            </p>
            <div className={styles.heroActions}>
              <a className={`button button--primary button--lg ${styles.ctaIcon}`} href={LINKEDIN_URL}>
                <FaLinkedinIn aria-hidden="true" /> Get in touch on LinkedIn
              </a>
              <Link className="button button--secondary button--lg" to="/events">
                See talks and workshops
              </Link>
            </div>
            {/* A recording lets organizers judge the delivery, not just the record. */}
            <a href={FEATURED_RECORDING.url} className={styles.watch}>
              <FaYoutube aria-hidden="true" /> {FEATURED_RECORDING.label}
            </a>
            <ul className={styles.socials} aria-label="Email and social profiles">
              {socials.map(({label, href, Icon}) => (
                <li key={label}>
                  <a href={href} aria-label={label} title={label}>
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

      </div>
    </header>
  );
}
