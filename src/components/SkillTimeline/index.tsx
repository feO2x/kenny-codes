import React, {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {DiagramFrame} from '../Diagram';
import {methodNames, phasesFor, type Method, type Phase, type Span, type TimelineVariant} from './data';
import styles from './styles.module.css';

/**
 * A bracket beside steps `from` to `to`, from marker to marker. A loop instead runs from the end
 * of its last step back up to the first, with an arrowhead pointing at it.
 */
function SpanMark({span, loop}: {span: Span; loop?: boolean}): ReactNode {
  return (
    <li
      className={clsx(styles.span, loop && styles.loop)}
      style={{gridRow: `${span.from + 1} / ${span.to + (loop ? 2 : 1)}`}}
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

interface ArrowBox {
  top: number;
  height: number;
  left: number;
}

type Ends = Record<'small' | 'large', ArrowBox>;

/**
 * Measures the back arrows, because the step rows wrap differently at every width. Each arrow
 * leaves the Iterate step, runs up over the cards' right edge, and points at the first step of
 * the phase it returns to. The arrows appear only once measured; until then the Iterate step
 * says in words where small and large issues go.
 */
function useBackArrowEnds(list: React.RefObject<HTMLOListElement | null>): Ends | undefined {
  const [ends, setEnds] = useState<Ends>();
  useEffect(() => {
    const root = list.current;
    if (!root) return undefined;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      // An inactive tab panel has no size; wait until it is shown.
      if (origin.height === 0) return;
      const markerY = (anchor: string) => {
        const box = root.querySelector(`[data-anchor="${anchor}"] .${styles.marker}`)?.getBoundingClientRect();
        return box ? box.top + box.height / 2 - origin.top : NaN;
      };
      // The arrows start where the step text area of the middle cards ends.
      const card = root.querySelector(`:scope > .${styles.planning}`);
      if (!card) return;
      const cardBox = card.getBoundingClientRect();
      const left = cardBox.right - parseFloat(getComputedStyle(card).paddingRight) - origin.left;
      const iterate = markerY('iterate');
      // The strokes' centre lines run through the measured points.
      const halfStroke = parseFloat(getComputedStyle(root).getPropertyValue('--arrow-width')) / 2 || 0;
      const box = (target: string, offset: number): ArrowBox => {
        const top = markerY(target) - halfStroke;
        return {top, height: iterate + offset + halfStroke - top, left};
      };
      const next: Ends = {small: box('implementing', -8), large: box('planning', 8)};
      if (Object.values(next).every(({top, height}) => Number.isFinite(top) && Number.isFinite(height) && height > 0)) {
        setEnds(next);
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
  const back = (label: string, className: string, {top, height, left}: ArrowBox) => (
    <li className={clsx(styles.back, className)} style={{top, height, left}} aria-hidden="true">
      <span className={styles.backLabel}>{label}</span>
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
          {ends && back('small issue', styles.backSmall, ends.small)}
          {ends && back('large issue', styles.backLarge, ends.large)}
        </ol>
      </figure>
    </DiagramFrame>
  );
}
