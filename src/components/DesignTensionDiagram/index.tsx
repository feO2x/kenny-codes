import React, {type ReactNode} from 'react';
import {DiagramFrame} from '../Diagram';
import styles from './styles.module.css';

const extremes: {title: string; bullets: string[]}[] = [
  {
    title: 'Too Little Abstraction',
    bullets: [
      'Thousands of lines of code in a single file',
      'Little or no abstraction: SQL statements, HTTP calls, business logic, UI manipulation all reside in the same scope',
      'Tight coupling makes individual parts impossible to test automatically without third-party systems',
    ],
  },
  {
    title: 'Excessive Abstraction',
    bullets: [
      'Loose coupling everywhere: new functionality → new class, new interface, an army of interfaces and tiny objects',
      'Many test doubles scatter the test suite',
      'Static methods are considered tight-coupling and are forbidden',
      'You have to jump to the definition ten times to find the code that actually does the work',
    ],
  },
];

/** The two design extremes, with the tension between them. */
export default function DesignTensionDiagram(): ReactNode {
  const [left, right] = extremes;
  const side = ({title, bullets}: (typeof extremes)[number]) => (
    <div className={styles.extreme}>
      <p className={styles.title}>{title}</p>
      <ul className={styles.bullets}>
        {bullets.map((bullet) => (
          <li key={bullet}>{bullet}</li>
        ))}
      </ul>
    </div>
  );

  return (
    <DiagramFrame>
      <figure className={styles.diagram}>
        <figcaption className="kc-sr-only">
          The tension between two design extremes: too little abstraction and excessive
          abstraction.
        </figcaption>
        {side(left)}
        <div className={styles.tension} aria-hidden="true">
          <span className={styles.arrow} />
          <span className={styles.tensionLabel}>Tension</span>
        </div>
        {side(right)}
      </figure>
    </DiagramFrame>
  );
}
