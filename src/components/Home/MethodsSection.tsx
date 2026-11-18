import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './Home.module.css';

const phases = [
  {name: 'Plan', text: 'Agree on the approach with the agent and freeze the plan in git.'},
  {name: 'Implement', text: 'The agent implements one focused plan, verified by feedback loops.'},
  {name: 'Guide', text: 'You review every change and steer with fixes or follow-up plans.'},
];

const chack = [
  {letter: 'C', word: 'Core'},
  {letter: 'H', word: 'Humble objects'},
  {letter: 'A', word: 'Automated tests'},
  {letter: 'C', word: 'Composition root'},
  {letter: 'K', word: 'Kenny'},
];

export default function MethodsSection(): ReactNode {
  return (
    <section className={clsx(styles.section, styles.methodsBand)} aria-labelledby="methods-title">
      <div className="container">
        <div className={styles.sectionHead}>
          <Heading as="h2" id="methods-title" className={styles.sectionTitle}>
            Methods I teach
          </Heading>
          <p className={styles.sectionLede}>
            Free, complete documentation for the approaches I use in my own projects and teach in
            workshops.
          </p>
        </div>

        <div className={styles.methods}>
          <article className={styles.method}>
            <Heading as="h3" className={styles.methodName}>
              Guided Coding
            </Heading>
            <p className={styles.methodText}>
              Write enterprise-grade software with coding agents without losing control of your
              codebase.
            </p>
            <ol className={styles.phases}>
              {phases.map((phase) => (
                <li key={phase.name} className={styles.phase}>
                  <span className={styles.phaseName}>{phase.name}</span>
                  <span className={styles.phaseText}>{phase.text}</span>
                </li>
              ))}
            </ol>
            <Link to="/docs/guided-coding" className={styles.methodLink}>
              Read the Guided Coding guide
            </Link>
          </article>

          <article className={styles.method}>
            <Heading as="h3" className={styles.methodName}>
              CHACK
            </Heading>
            <p className={styles.methodText}>
              A simple way to structure an application: every piece of code belongs to exactly one
              of four categories.
            </p>
            <ul className={styles.chack}>
              {chack.map(({letter, word}, index) => (
                <li key={index} className={styles.chackItem}>
                  <span className={styles.chackLetter} aria-hidden="true">
                    {letter}
                  </span>
                  <span className={styles.chackWord}>{word}</span>
                </li>
              ))}
            </ul>
            <Link to="/docs/chack" className={styles.methodLink}>
              Read the CHACK guide
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
