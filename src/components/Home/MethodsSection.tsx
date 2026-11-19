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

const stages = [
  {name: 'Beginning', mode: 'Show me', text: 'the agent shows complete code for you to type in and discuss.'},
  {name: 'Advancing', mode: 'Coach me', text: 'you write the code; the agent reviews it and hints when you’re stuck.'},
  {name: 'Mastering', mode: 'Guided Coding', text: 'the agent writes the code; you plan and guide.'},
];

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
      <span className={clsx(styles.chackBox, styles.chackHumble)}>Humble Objects</span>
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
      <span className={styles.chackBox}>Automated Tests</span>
      <span className={styles.chackBox}>Composition Root</span>
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
              codebase.
            </p>
            <ol className={clsx(styles.methodVisual, styles.phases)}>
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
              Guided Learning
            </Heading>
            <p className={styles.methodText}>
              Guided Coding for developers new to a domain: the agent teaches you to write the code
              yourself and steps back as you grow.
            </p>
            {/* The meter fills as you grow; the agent's help changes with it. */}
            <ol className={clsx(styles.methodVisual, styles.stages)}>
              {stages.map((stage, index) => (
                <li key={stage.name} className={styles.stage}>
                  <span className={styles.meter} aria-hidden="true">
                    {stages.map((_, square) => (
                      <span key={square} className={square <= index ? styles.meterOn : undefined} />
                    ))}
                  </span>
                  <span className={styles.stageName}>{stage.name}</span>
                  <span className={styles.phaseText}>
                    <span className={styles.stageMode}>{stage.mode}:</span> {stage.text}
                  </span>
                </li>
              ))}
            </ol>
            <Link to="/docs/guided-coding/guided-learning-getting-started" className={styles.methodLink}>
              Read the Guided Learning guide
            </Link>
          </article>

          <article className={styles.method}>
            <Heading as="h3" className={styles.methodName}>
              CHACK
            </Heading>
            <p className={styles.methodText}>
              A simple way to structure an application: every piece of code belongs to one of four
              categories. And the K? That’s me.
            </p>
            <div className={styles.methodVisual}>
              <ChackMap />
            </div>
            <Link to="/docs/chack" className={styles.methodLink}>
              Read the CHACK guide
            </Link>
          </article>
        </div>
      </div>
    </section>
  );
}
