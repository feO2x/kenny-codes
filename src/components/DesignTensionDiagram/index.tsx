import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame} from '../Diagram';
import styles from './styles.module.css';

const extremes: {title: string; bullets: string[]}[] = [
  {
    title: 'Too Little Abstraction',
    bullets: [
      'Thousands of lines of code in a single file.',
      'Little or no abstraction: SQL statements, HTTP calls, business logic, UI manipulation all reside in the same scope.',
      'Tight coupling makes individual parts impossible to cover with automated tests without third-party systems running.',
    ],
  },
  {
    title: 'Excessive Abstraction',
    bullets: [
      'Loose coupling everywhere: new functionality → new class, new interface. Results in an army of interfaces and tiny objects.',
      'Many test doubles scatter the test suite.',
      'Static methods are considered tight-coupling and are forbidden.',
      'You have to jump to the definition ten times to find the code that actually does the work.',
    ],
  },
];

/** The two design extremes, with the tension between them. */
export default function DesignTensionDiagram(): ReactNode {
  const [left, right] = extremes;
  // Reading order: each title with its list. The grid places titles and arrow in one row.
  return (
    <DiagramFrame>
      <figure className={styles.diagram}>
        <figcaption className="kc-sr-only">
          The tension between two design extremes: too little abstraction and excessive
          abstraction.
        </figcaption>
        <p className={clsx(styles.title, styles.leftTitle)}>{left.title}</p>
        <ul className={clsx(styles.bullets, styles.leftList)}>
          {left.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
        <div className={styles.tension} aria-hidden="true">
          <span className={styles.arrow} />
          {/* A lightning bolt on an amber tile: the old diagram's warning sign, restyled. */}
          <span className={styles.symbol}>
            <svg viewBox="0 0 24 24">
              <path d="M13.5 2 4.5 13.5h6.5L10 22l9.5-12H13z" />
            </svg>
          </span>
          <span className={styles.tensionLabel}>Tension</span>
        </div>
        <p className={clsx(styles.title, styles.rightTitle)}>{right.title}</p>
        <ul className={clsx(styles.bullets, styles.rightList)}>
          {right.bullets.map((bullet) => (
            <li key={bullet}>{bullet}</li>
          ))}
        </ul>
      </figure>
    </DiagramFrame>
  );
}
