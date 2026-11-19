import React, {type CSSProperties, type ReactNode, useEffect, useRef, useState} from 'react';
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

/** Where the back arrows start (Iterate) and end (the first step of their target phase). */
function anchorOf(phase: Phase, index: number): string | undefined {
  if (index === 0 && (phase.kind === 'planning' || phase.kind === 'implementing')) return phase.kind;
  if (phase.kind === 'guiding' && phase.steps[index].title === 'Iterate') return 'iterate';
  return undefined;
}

type Ends = Record<'small' | 'large', {top: number; bottom: number}>;

/**
 * Measures where the back arrows must start and end, because the step rows wrap differently at
 * every width. Before hydration the arrows run between the phase headings instead.
 */
function useBackArrowEnds(list: React.RefObject<HTMLOListElement | null>): Ends | undefined {
  const [ends, setEnds] = useState<Ends>();
  useEffect(() => {
    const root = list.current;
    if (!root) return undefined;
    const markerY = (anchor: string) => {
      const marker = root.querySelector(`[data-anchor="${anchor}"] .${styles.marker}`);
      const box = marker?.getBoundingClientRect();
      return box ? box.top + box.height / 2 : NaN;
    };
    const measure = () => {
      const iterate = markerY('iterate');
      const next: Partial<Ends> = {};
      for (const [arrow, target, offset] of [
        ['small', 'implementing', -7],
        ['large', 'planning', 7],
      ] as const) {
        const rail = root.querySelector(`.${arrow === 'small' ? styles.backSmall : styles.backLarge}`);
        if (!rail) return;
        const box = rail.getBoundingClientRect();
        next[arrow] = {top: markerY(target) - box.top, bottom: box.bottom - (iterate + offset)};
      }
      if ([next.small, next.large].every((end) => end && Number.isFinite(end.top) && Number.isFinite(end.bottom))) {
        setEnds(next as Ends);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [list]);
  return ends;
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
          <li
            key={index}
            className={clsx(styles.step, styles[step.kind])}
            style={{gridRow: index + 1}}
            data-anchor={anchorOf(phase, index)}>
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
  const listRef = useRef<HTMLOListElement>(null);
  const ends = useBackArrowEnds(listRef);
  const rowOf = (kind: Phase['kind']) => phases.findIndex((phase) => phase.kind === kind) + 1;
  const back = (target: Phase['kind'], label: string, className: string, end?: Ends['small']) => (
    <li
      className={clsx(styles.back, className)}
      style={{gridRow: `${rowOf(target)} / ${rowOf('guiding')}`} as CSSProperties}
      aria-hidden="true">
      <span className={styles.backLine} style={end && {top: end.top, bottom: end.bottom}}>
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
        <ol className={styles.phases} ref={listRef}>
          {phases.map((phase, index) => (
            <PhaseCard key={phase.kind} phase={phase} row={index + 1} />
          ))}
          {back('implementing', 'small issue', styles.backSmall, ends?.small)}
          {back('planning', 'large issue', styles.backLarge, ends?.large)}
        </ol>
      </figure>
    </DiagramFrame>
  );
}
