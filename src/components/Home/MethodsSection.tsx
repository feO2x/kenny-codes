import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './Home.module.css';

const LEVELS = 3;

/** Who writes the code in the Implementing Phase depends on how well you know the domain. */
const implementers = {
  coding: {name: 'Mastering', level: 3, text: 'The agent writes the code.'},
  learning: [
    {name: 'Advancing', level: 2, text: 'You write the code; the agent coaches you.'},
    {name: 'Beginning', level: 1, text: 'The agent shows the code; you type it in.'},
  ],
};

function Level({name, level, text}: {name: string; level: number; text: string}): ReactNode {
  return (
    <li className={styles.level}>
      {/* The speaking record's square as a meter: filled up to how well you know the domain. */}
      <span className={styles.meter} aria-hidden="true">
        {Array.from({length: LEVELS}, (_, square) => (
          <span key={square} className={square < level ? styles.meterOn : undefined} />
        ))}
      </span>
      <span className={styles.levelText}>
        <strong>{name}:</strong> {text}
      </span>
    </li>
  );
}

/** Solid arrows reference the Core; the dashed one implements the Core's I/O abstractions. */
function Arrow({up = false, implementsAbstraction = false}: {up?: boolean; implementsAbstraction?: boolean}): ReactNode {
  return (
    <svg className={styles.chackArrow} viewBox="0 0 12 22" aria-hidden="true">
      {implementsAbstraction ? (
        <>
          <path d="M6 1v12" strokeDasharray="2.5 2.5" />
          <path d="M1.5 14.5h9L6 20.5z" />
        </>
      ) : (
        <path d={up ? 'M6 21V2M1.5 6.5 6 2l4.5 4.5' : 'M6 1v19M1.5 15.5 6 20l4.5-4.5'} />
      )}
    </svg>
  );
}

/** A pocket version of the CHACK diagram: the Core in the middle, every arrow points to it. */
function ChackMap(): ReactNode {
  return (
    <div
      className={styles.chackMap}
      role="img"
      aria-label="CHACK in miniature: the Humble Objects sit on the process boundary and implement the Core's I/O abstractions. Unit tests and the Composition Root reference the Core, which performs no I/O itself.">
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackHumble)}>Humble Objects</span>
      <span className={styles.chackDown}>
        <Arrow implementsAbstraction />
      </span>
      <span className={clsx(styles.chackBox, styles.chackCore)}>
        Core
        <small>In-memory logic, no I/O</small>
      </span>
      <span className={styles.chackUp}>
        <Arrow up />
      </span>
      <span className={styles.chackUp}>
        <Arrow up />
      </span>
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackTests)}>Automated Tests</span>
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackRoot)}>Composition Root</span>
      <span className={styles.chackBoundary} aria-hidden="true">
        process boundary
      </span>
    </div>
  );
}

export default function MethodsSection(): ReactNode {
  return (
    <section className={clsx(styles.section, styles.methodsBand)} aria-labelledby="methods-title">
      <div className="container">
        <div className={styles.sectionHead}>
          <h2 id="methods-title" className={styles.sectionTitle}>
            Methods I teach
          </h2>
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
              codebase. New to a domain? Guided Learning lets you write the code yourself while
              the agent teaches you.
            </p>
            <ol className={clsx(styles.methodVisual, styles.phases)}>
              <li className={styles.phase}>
                <span className={styles.phaseName}>Plan</span>
                <span className={styles.phaseText}>
                  Agree on the approach with the agent and freeze the plan in git.
                </span>
              </li>
              <li className={styles.phase}>
                <span className={styles.phaseName}>Implement</span>
                <span className={styles.phaseText}>
                  One focused plan, verified by feedback loops. Who writes the code depends on how
                  well you know the domain:
                </span>
                <div className={styles.implementers}>
                  <ul className={styles.levels}>
                    <Level {...implementers.coding} />
                  </ul>
                  <div className={styles.learning}>
                    <span className={styles.learningLabel}>Guided Learning</span>
                    <ul className={styles.levels}>
                      {implementers.learning.map((level) => (
                        <Level key={level.name} {...level} />
                      ))}
                    </ul>
                  </div>
                </div>
              </li>
              <li className={styles.phase}>
                <span className={styles.phaseName}>Guide</span>
                <span className={styles.phaseText}>
                  You review every change and steer with fixes or follow-up plans.
                </span>
              </li>
            </ol>
            <div className={styles.methodLinks}>
              <Link to="/docs/guided-coding" className={styles.textLink}>
                Read the Guided Coding guide
              </Link>
              <Link to="/docs/guided-coding/guided-learning-getting-started" className={styles.textLink}>
                Start with Guided Learning
              </Link>
            </div>
          </article>

          <article className={styles.method}>
            <Heading as="h3" className={styles.methodName}>
              CHACK
            </Heading>
            <p className={styles.methodText}>
              A simple way to structure an application: every piece of code belongs to one of four
              categories. And the K? That’s me.
            </p>
            <div className={clsx(styles.methodVisual, styles.chackVisual)}>
              <ChackMap />
            </div>
            <div className={styles.methodLinks}>
              <Link to="/docs/chack" className={styles.textLink}>
                Read the CHACK guide
              </Link>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
