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

interface BackArrow {
  /** The arrow's path, from its tail at the Iterate step to just before its head. */
  path: string;
  head: string;
  label: {x: number; y: number};
}

interface BackArrows {
  width: number;
  height: number;
  small: BackArrow;
  large: BackArrow;
}

/** A CSS length custom property of `element` in pixels (rem or px). */
function lengthOf(element: Element, property: string): number {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return value.endsWith('rem') ? parseFloat(value) * rem : parseFloat(value);
}

/**
 * Measures and draws the back arrows, because the step rows wrap differently at every width.
 * Each arrow leaves the Iterate step just after its text, runs up through the text-free band at
 * the cards' right edge, and points at the first step of the phase it returns to, just after
 * that step's text. The arrows appear only once measured; until then the Iterate step says in
 * words where small and large issues go.
 */
function useBackArrows(list: React.RefObject<HTMLOListElement | null>): BackArrows | undefined {
  const [arrows, setArrows] = useState<BackArrows>();
  useEffect(() => {
    const root = list.current;
    if (!root) return undefined;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      // An inactive tab panel has no size; wait until it is shown.
      if (origin.height === 0) return;
      const step = (anchor: string) => root.querySelector(`[data-anchor="${anchor}"]`);
      const markerY = (anchor: string) => {
        const box = step(anchor)?.querySelector(`.${styles.marker}`)?.getBoundingClientRect();
        return box ? box.top + box.height / 2 - origin.top : NaN;
      };
      /** Where the step's text ends; the arrow keeps a gap from it. */
      const textRight = (anchor: string) => {
        // Measure the text lines themselves, not the block boxes that hold them.
        const lines = [...(step(anchor)?.querySelectorAll(`.${styles.stepTitle}, .${styles.stepText}`) ?? [])].flatMap(
          (element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return [...range.getClientRects()];
          },
        );
        return lines.length ? Math.max(...lines.map((r) => r.right)) - origin.left : NaN;
      };
      const card = root.querySelector(`:scope > .${styles.planning}`);
      if (!card) return;
      const cardRight = card.getBoundingClientRect().right - origin.left;
      const stroke = lengthOf(root, '--arrow-width');
      const gap = lengthOf(root, '--arrow-gap');
      const labelGap = lengthOf(root, '--label-gap');
      const labelSize = lengthOf(root, '--label-size');
      const spread = lengthOf(root, '--tail-spread');
      const headLength = stroke * 3.2;
      const iterateY = markerY('iterate');
      const tail = textRight('iterate') + gap;

      const draw = (target: string, inset: string, offset: number): BackArrow => {
        const x = cardRight - lengthOf(root, inset);
        const top = markerY(target);
        const bottom = iterateY + offset;
        const tip = textRight(target) + gap;
        const r = Math.max(0, Math.min(stroke * 3.5, (bottom - top) / 2, x - tail, x - tip - headLength));
        return {
          path: `M ${tail} ${bottom} H ${x - r} Q ${x} ${bottom} ${x} ${bottom - r} V ${top + r} Q ${x} ${top} ${x - r} ${top} H ${tip + headLength - 1}`,
          head: `${tip},${top} ${tip + headLength},${top - headLength * 0.62} ${tip + headLength},${top + headLength * 0.62}`,
          // Inside the curve, a clear gap left of the vertical run.
          label: {x: x - stroke / 2 - labelGap - labelSize / 2, y: (top + bottom) / 2},
        };
      };
      const next: BackArrows = {
        width: origin.width,
        height: origin.height,
        small: draw('implementing', '--small-inset', -spread / 2),
        large: draw('planning', '--large-inset', spread / 2),
      };
      if ([next.small, next.large].every((arrow) => !/NaN|Infinity/.test(arrow.path + arrow.head))) {
        setArrows(next);
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [list]);
  return arrows;
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
  const arrows = useBackArrows(listRef);
  const back = (arrow: BackArrow, label: string, className: string) => (
    <g className={className}>
      <path className={styles.backLine} d={arrow.path} />
      <polygon className={styles.backHead} points={arrow.head} />
      <text
        className={styles.backLabel}
        x={arrow.label.x}
        y={arrow.label.y}
        transform={`rotate(-90 ${arrow.label.x} ${arrow.label.y})`}
        textAnchor="middle"
        dominantBaseline="central">
        {label}
      </text>
    </g>
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
          {arrows && (
            <li className={styles.backLayer} aria-hidden="true">
              <svg width={arrows.width} height={arrows.height} viewBox={`0 0 ${arrows.width} ${arrows.height}`}>
                {back(arrows.small, 'small issue', styles.backSmall)}
                {back(arrows.large, 'large issue', styles.backLarge)}
              </svg>
            </li>
          )}
        </ol>
      </figure>
    </DiagramFrame>
  );
}
