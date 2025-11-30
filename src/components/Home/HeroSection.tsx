import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import useBaseUrl from '@docusaurus/useBaseUrl';
import { FaLinkedin } from 'react-icons/fa';
import { FaXTwitter } from 'react-icons/fa6';
import { FaGithub } from 'react-icons/fa';
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
            Engineering Manager at <a href="https://gwvs.de/" target='_blank' rel='noopener noreferrer'>TELIS/GWVS</a>,<br />
            Conference Speaker and Consultant
          </p>
          <ul className={styles.bioList}>
            <li>Cloud Native Systems with AI integration</li>
            <li>AI-assisted development and modern tooling</li>
            <li>.NET Runtime Internals (Memory Management, Asynchronous Programming and Threading)</li>
            <li>.NET Framework internals (ASP.NET Core, DI Containers, ORMs, Serializers)</li>
          </ul>
          <div className={styles.ctaButtons}>
            <Link className="button button--primary button--lg" to="https://www.linkedin.com/in/kenny-pflug-7a1012123/" target="_blank" rel="noopener noreferrer">
              <FaLinkedin className={styles.icon} /> LinkedIn
            </Link>
            <Link className="button button--info button--lg" to="https://x.com/feO2x" target="_blank" rel="noopener noreferrer">
              <FaXTwitter className={styles.icon} /> Follow
            </Link>
            <Link className="button button--info button--lg" to="https://github.com/feO2x" target="_blank" rel="noopener noreferrer">
              <FaGithub className={styles.icon} /> GitHub
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
