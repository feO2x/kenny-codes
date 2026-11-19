import React, {type ReactNode, useEffect, useRef, useState} from 'react';
import clsx from 'clsx';
import {DiagramFrame} from '../Diagram';
import {methodNames, phasesFor, type Method, type Phase, type Span, type TimelineVariant} from './data';
import styles from './styles.module.css';

/**
 * Every bracket and arrow in the timeline follows one design: it starts and ends on one shared
 * column just after the text's maximum width, runs vertically in its own lane right of it, and
 * carries an upright label to the right of that run. The lanes, from the text outwards: brackets
 * inside a card, then "small issue", then "large issue".
 */
type Lane = 'inner' | 'small' | 'large';

interface Mark {
  key: string;
  lane: Lane;
  /** Step anchors of the two ends: the arrowhead (or upper end) and the tail (or lower end). */
  top: string;
  bottom: string;
  /** Moves the lower end up or down, so the two arrows leaving Iterate run apart. */
  bottomOffset?: number;
  arrow: boolean;
  /** The phase whose colour the mark takes. */
  tone: Phase['kind'];
  label: string[];
}

interface DrawnMark extends Mark {
  path: string;
  head?: string;
  /** Centre of each label line, before rotating the text upright. */
  lines: {x: number; y: number}[];
}

interface Drawing {
  width: number;
  height: number;
  marks: DrawnMark[];
}

const stepAnchor = (phase: Phase['kind'], index: number) => `${phase}-${index}`;

/** The brackets inside cards, and the two arrows back from the Guiding Phase. */
function marksFor(phases: Phase[]): Mark[] {
  const marks: Mark[] = [];
  for (const phase of phases) {
    for (const [span, arrow] of [
      [phase.choice, false],
      [phase.loop, true],
    ] as [Span | undefined, boolean][]) {
      if (!span) continue;
      marks.push({
        key: `${phase.kind}-${span.from}`,
        lane: 'inner',
        top: stepAnchor(phase.kind, span.from),
        bottom: stepAnchor(phase.kind, span.to),
        arrow,
        tone: phase.kind,
        label: span.label,
      });
    }
  }
  const guiding = phases.find((phase) => phase.kind === 'guiding');
  const iterate = stepAnchor('guiding', guiding?.steps.findIndex((step) => step.title === 'Iterate') ?? -1);
  marks.push(
    {key: 'small', lane: 'small', top: stepAnchor('implementing', 0), bottom: iterate, bottomOffset: -1, arrow: true, tone: 'implementing', label: ['small issue']},
    {key: 'large', lane: 'large', top: stepAnchor('planning', 0), bottom: iterate, bottomOffset: 1, arrow: true, tone: 'planning', label: ['large issue']},
  );
  return marks;
}

/** A CSS length custom property of `element` in pixels (rem or px). */
function lengthOf(element: Element, property: string): number {
  const value = getComputedStyle(element).getPropertyValue(property).trim();
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return value.endsWith('rem') ? parseFloat(value) * rem : parseFloat(value);
}

/**
 * Measures and draws the marks, because the step rows wrap differently at every width. The marks
 * appear only once measured; until then the sr-only descriptions and the Iterate step say in
 * words what they show.
 */
function useDrawing(list: React.RefObject<HTMLOListElement | null>, marks: Mark[]): Drawing | undefined {
  const [drawing, setDrawing] = useState<Drawing>();
  useEffect(() => {
    const root = list.current;
    if (!root) return undefined;
    const measure = () => {
      const origin = root.getBoundingClientRect();
      // An inactive tab panel has no size; wait until it is shown.
      if (origin.height === 0) return;
      const step = (anchor: string) => root.querySelector(`[data-step="${anchor}"]`);
      const markerY = (anchor: string) => {
        const box = step(anchor)?.querySelector(`.${styles.marker}`)?.getBoundingClientRect();
        return box ? box.top + box.height / 2 - origin.top : NaN;
      };
      // The step list of a middle card ends where its text may end at most.
      const steps = root.querySelector(`:scope > .${styles.planning} .${styles.steps}`);
      if (!steps) return;
      const textEnd = steps.getBoundingClientRect().right - origin.left;
      const length = (property: string) => lengthOf(root, property);
      const stroke = length('--arrow-width');
      const headLength = stroke * 3.2;
      const labelGap = length('--label-gap');
      const labelSize = length('--label-size');
      const spread = length('--tail-spread');
      // One shared column for every end, just after the text's maximum width, and the three lanes
      // at fixed distances from it: the arrows stay with the text, however wide the card is.
      const column = textEnd + length('--arrow-gap');
      const inner = column + length('--arm');
      const lane: Record<Lane, number> = {
        inner,
        small: inner + length('--inner-lane') - length('--small-lane'),
        large: inner + length('--inner-lane') - length('--large-lane'),
      };

      const drawn: DrawnMark[] = marks.map((mark) => {
        const x = lane[mark.lane];
        const top = markerY(mark.top);
        const bottom = markerY(mark.bottom) + (mark.bottomOffset ?? 0) * (spread / 2);
        const width = mark.arrow ? stroke : stroke * 0.55;
        const r = Math.max(0, Math.min(stroke * 3.5, (bottom - top) / 2, x - column - (mark.arrow ? headLength : 0)));
        const end = column + (mark.arrow ? headLength - 1 : 0);
        const lineHeight = labelSize * 1.2;
        const firstLine = x + width / 2 + labelGap + labelSize / 2;
        return {
          ...mark,
          path: `M ${column} ${bottom} H ${x - r} Q ${x} ${bottom} ${x} ${bottom - r} V ${top + r} Q ${x} ${top} ${x - r} ${top} H ${end}`,
          head: mark.arrow
            ? `${column},${top} ${column + headLength},${top - headLength * 0.62} ${column + headLength},${top + headLength * 0.62}`
            : undefined,
          lines: mark.label.map((_, index) => ({x: firstLine + index * lineHeight, y: (top + bottom) / 2})),
        };
      });
      if (drawn.every((mark) => !/NaN|Infinity/.test(mark.path + (mark.head ?? '')))) {
        setDrawing({width: origin.width, height: origin.height, marks: drawn});
      }
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [list, marks]);
  return drawing;
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
      <ol className={styles.steps}>
        {phase.steps.map((step, index) => (
          <li key={index} className={clsx(styles.step, styles[step.kind])} data-step={stepAnchor(phase.kind, index)}>
            <span className={styles.marker} aria-hidden="true" />
            <span className={styles.stepBody}>
              <span className="kc-sr-only">{step.kind === 'skill' ? 'Skill: ' : 'You: '}</span>
              <span className={styles.stepTitle}>{step.title}</span>
              <span className={styles.stepText}>{step.description}</span>
            </span>
          </li>
        ))}
      </ol>
    </li>
  );
}

/**
 * The skills of Guided Coding or Guided Learning in the order you use them, as real text so it
 * reflows on phones, with the iteration drawn over the cards.
 */
export default function SkillTimeline({
  method,
  variant = 'manual',
}: {
  method: Method;
  variant?: TimelineVariant;
}): ReactNode {
  const phases = phasesFor(method, variant);
  const [marks] = useState(() => marksFor(phases));
  const listRef = useRef<HTMLOListElement>(null);
  const drawing = useDrawing(listRef, marks);

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
          {drawing && (
            <li className={styles.marks} aria-hidden="true">
              <svg width={drawing.width} height={drawing.height} viewBox={`0 0 ${drawing.width} ${drawing.height}`}>
                {drawing.marks.map((mark) => (
                  <g key={mark.key} className={clsx(styles[`tone-${mark.tone}`], !mark.arrow && styles.bracket)}>
                    <path className={styles.markLine} d={mark.path} />
                    {mark.head && <polygon className={styles.markHead} points={mark.head} />}
                    {mark.lines.map(({x, y}, index) => (
                      <text
                        key={index}
                        className={styles.markLabel}
                        x={x}
                        y={y}
                        transform={`rotate(-90 ${x} ${y})`}
                        textAnchor="middle"
                        dominantBaseline="central">
                        {mark.label[index]}
                      </text>
                    ))}
                  </g>
                ))}
              </svg>
            </li>
          )}
        </ol>
      </figure>
    </DiagramFrame>
  );
}
