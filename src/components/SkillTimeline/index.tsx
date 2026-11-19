import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame} from '../Diagram';
import {methodNames, phasesFor, type Method, type Phase, type Span, type TimelineVariant} from './data';
import styles from './styles.module.css';

/** A bracket beside steps `from` to `to`; a loop gets an arrowhead pointing back at `from`. */
function SpanMark({span, loop}: {span: Span; loop?: boolean}): ReactNode {
  return (
    <li
      className={clsx(styles.span, loop && styles.loop)}
      style={{gridRow: `${span.from + 1} / ${span.to + 1}`}}
      aria-hidden="true">
      <span className={styles.spanLine}>
        <span className={styles.spanLabel}>
          <span>{span.label[0]}</span> <span>{span.label[1]}</span>
        </span>
      </span>
    </li>
  );
}

function PhaseCard({phase, row}: {phase: Phase; row: number}): ReactNode {
  const spans = [phase.choice, phase.loop].filter(Boolean) as Span[];
  return (
    <li className={clsx(styles.phase, styles[phase.kind])} style={{gridRow: row}}>
      <p className={styles.phaseHead}>
        {phase.number && <span className={styles.badge}>{phase.number}</span>}
        {phase.kind === 'done' && (
          <span className={clsx(styles.badge, styles.badgeDone)} aria-hidden="true">
            <svg viewBox="0 0 16 16">
              <path d="M3.5 8.5l3 3 6-7" />
            </svg>
          </span>
        )}
        <span className={styles.phaseTitle}>
          {phase.title}
          {phase.note && <span className={styles.phaseNote}> – {phase.note}</span>}
        </span>
        {spans.map((span) => (
          <span key={span.from} className="kc-sr-only">
            {' '}
            {span.description}
          </span>
        ))}
      </p>
      <ol className={clsx(styles.steps, spans.length > 0 && styles.withSpans)}>
        {phase.steps.map((step, index) => (
          <li key={index} className={clsx(styles.step, styles[step.kind])} style={{gridRow: index + 1}}>
            <span className={styles.marker} aria-hidden="true" />
            <span className={styles.stepBody}>
              <span className="kc-sr-only">{step.kind === 'skill' ? 'Skill: ' : 'You: '}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepText}>{step.description}</span>
            </span>
          </li>
        ))}
        {phase.choice && <SpanMark span={phase.choice} />}
        {phase.loop && <SpanMark span={phase.loop} loop />}
      </ol>
    </li>
  );
}

/**
 * The skills of Guided Coding or Guided Learning in the order you use them, as real text so it
 * reflows on phones. Two arrows lead back from the Guiding Phase, as in the phase diagram.
 */
export default function SkillTimeline({
  method,
  variant = 'manual',
}: {
  method: Method;
  variant?: TimelineVariant;
}): ReactNode {
  const phases = phasesFor(method, variant);
  const rowOf = (kind: Phase['kind']) => phases.findIndex((phase) => phase.kind === kind) + 1;
  const back = (target: Phase['kind'], label: string, className: string) => (
    <li
      className={clsx(styles.back, className)}
      style={{gridRow: `${rowOf(target)} / ${rowOf('guiding')}`} as CSSProperties}
      aria-hidden="true">
      <span className={styles.backLine}>
        <span className={styles.backLabel}>{label}</span>
      </span>
    </li>
  );

  return (
    <DiagramFrame>
      <figure className={styles.timeline}>
        <figcaption className="kc-sr-only">
          Timeline of the {methodNames[method]} skills. Filled squares are skills; hollow squares
          are steps you take yourself. In the Guiding Phase, a small issue returns to the
          Implementing Phase and a large issue to the start of the Planning Phase.
        </figcaption>
        <ol className={styles.phases}>
          {phases.map((phase, index) => (
            <PhaseCard key={phase.kind} phase={phase} row={index + 1} />
          ))}
          {back('implementing', 'small issue', styles.backSmall)}
          {back('planning', 'large issue', styles.backLarge)}
        </ol>
      </figure>
    </DiagramFrame>
  );
}
