import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from './Home.module.css';

const LEVELS = 3;

/** Who writes the code in the Implementing Phase depends on how well you know the domain. */
const implementers = {
  coding: {name: 'Senior', level: 3, text: 'The agent writes the code. You save time.'},
  learning: [
    {name: 'Advanced', level: 2, text: 'You write the code, the agent challenges you.'},
    {name: 'Beginner', level: 1, text: 'The agent shows the code and explains, you type.'},
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
      <span>
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

/**
 * A pocket version of the CHACK diagram: the Core in the middle, every arrow points to it. The Humble
 * Objects and the Automated Tests sit on the process boundary, as they do in the diagram.
 */
function ChackMap(): ReactNode {
  return (
    <div
      className={styles.chackMap}
      role="img"
      aria-label="CHACK in miniature. A dashed box marks the process boundary. The Humble Objects are centred across its top edge, with a dashed, hollow-headed arrow pointing down to the full-width Core. They perform I/O calls, map data, and implement the Core's I/O abstractions. The Core contains in-memory logic and performs no I/O itself. The Automated Tests sit at the lower left, crossing the bottom edge, and the Composition Root sits level with them at the lower right, inside the boundary. Two solid arrows point up to the Core, from the Automated Tests and the Composition Root, because both reference it. The Core and the Composition Root sit inside the process boundary, while the Automated Tests extend across it, because tests may run inside or outside the process. The Automated Tests are unit, integration, and end-to-end tests, following the Test Pyramid. The Composition Root assembles all parts of the app. The process boundary's label sits on its lower-right edge.">
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackHumble)}>
        Humble Objects
        <small className={styles.chackNote}>Perform I/O calls and map data</small>
      </span>
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
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackBottom, styles.chackTests)}>
        Automated Tests
        <small className={styles.chackNote}>
          Unit, Integration, <span className={styles.chackNowrap}>E2E -</span> following the Test Pyramid
        </small>
      </span>
      <span className={clsx(styles.chackBox, styles.chackTile, styles.chackBottom, styles.chackRoot)}>
        Composition Root
        <small className={styles.chackNote}>Assembles all parts of the app</small>
      </span>
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
            How I approach Software Development
          </h2>
          <p className={styles.sectionLede}>
            Free docs for the approaches I use in my own projects.
          </p>
        </div>

        <div className={styles.methods}>
          <article className={styles.method}>
            <Heading as="h3" className={styles.methodName}>
              Guided Coding & Guided Learning
            </Heading>
            <p className={styles.methodText}>
              Write enterprise-grade software with coding agents without losing control of your
              codebase. Are you a junior developer? Guided Learning lets you write the code yourself while
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
                  One focused plan, verified by feedback loops. Let the agent write the code and save time,
                  or write the code yourself and learn from the agent.
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
                  You review the changes and iterate with fixes or follow-up plans.
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
              A simple way to structure software apps: every piece of code belongs to one of four
              categories. Based on DDD, Hexagonal Architecture, and Vertical Slice Architecture,
              CHACK is easier to learn and pushes junior devs into the pit of success.
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
