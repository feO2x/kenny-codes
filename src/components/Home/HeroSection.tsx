import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './HeroSection.module.css';

export default function HeroSection() {
  return (
    <section className={styles.heroSection}>
      <div className={clsx('container', styles.heroContainer)}>
        <div className={styles.heroText}>
          <Heading as="h1" className={styles.heroTitle}>
            Hi, I'm Kenny
          </Heading>
          <p className={styles.heroSubtitle}>
            Engineering Manager at <a href="https://gwvs.de/">TELIS/GWVS</a>,<br />
            Conference Speaker and Consultant
          </p>
          <ul className={styles.bioList}>
            <li>Cloud Native Systems with AI integration</li>
            <li>AI-assisted development and modern tooling</li>
            <li>.NET Runtime Internals (Memory Management, Asynchronous Programming and Threading)</li>
            <li>.NET Framework internals (ASP.NET Core, DI Containers, ORMs, Serializers)</li>
          </ul>
          <div className={styles.ctaButtons}>
            <Link className="button button--primary button--lg" to="/blog">
              Read Blog
            </Link>
            <Link className="button button--info button--lg" to="/events">
              See Events
            </Link>
            <Link className="button button--info button--lg" to="https://github.com/feO2x">
              GitHub
            </Link>
          </div>
        </div>
        <div className={styles.heroImageContainer}>
          <img
            src={useBaseUrl('/img/kenny-smiles.jpg')}
            alt="Kenny Pflug smiling"
            className={styles.heroImage}
          />
        </div>
      </div>
    </section>
  );
}
