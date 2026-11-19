import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame, TileGradients, brandEdge, diagram as d, markStyle, tileUrl, useDiagramId, type Tile} from '../Diagram';

type Phase = 'planning' | 'implementing' | 'guiding';

interface GuidedCodingDiagramProps {
  highlight?: Phase;
}

const loops =
  'Arrows lead back from the Guiding Phase: a large issue returns to the Planning Phase, a small issue to the Implementing Phase. The Planning Phase also loops on itself until the plan stabilizes.';

const descriptions: Record<Phase | 'default', string> = {
  planning: `Guided Coding workflow diagram highlighting the Planning Phase. The three phases are Planning, Implementing, and Guiding, followed by the pull request. ${loops}`,
  implementing: `Guided Coding workflow diagram highlighting the Implementing Phase. The three phases are Planning, Implementing, and Guiding, followed by the pull request. ${loops}`,
  guiding: `Guided Coding workflow diagram highlighting the Guiding Phase. The three phases are Planning, Implementing, and Guiding, followed by the pull request. ${loops}`,
  default: `Guided Coding workflow diagram showing three phases, Planning, Implementing, and Guiding, ending with a pull request. ${loops}`,
};

/** The same colours as the phases in the skill timelines. */
const phases: {id: Phase; number: number; name: string; x: number; tile: Tile}[] = [
  {id: 'planning', number: 1, name: 'Planning Phase', x: 20, tile: 'blue'},
  {id: 'implementing', number: 2, name: 'Implementing Phase', x: 286, tile: 'amber'},
  {id: 'guiding', number: 3, name: 'Guiding Phase', x: 552, tile: 'violet'},
];

const BOX_Y = 132;
const BOX_W = 232;
const BOX_H = 64;
const MID_Y = BOX_Y + BOX_H / 2;

/** A downward arrowhead whose tip touches (x, y), sized for the heavy iteration arrows. */
function HeadDown({x, y}: {x: number; y: number}): ReactNode {
  return <path className={d.head} d={`M ${x} ${y} l -11 -18 h 22 z`} />;
}

/** A right-pointing arrowhead whose tip touches (x, y). */
function HeadRight({x, y}: {x: number; y: number}): ReactNode {
  return <path className={d.head} d={`M ${x} ${y} l -10 -6 v 12 z`} />;
}

/**
 * On a page about one phase, that phase and its arrows keep their colour; the other phases turn
 * into neutral outlined boxes that stay fully readable.
 */
export default function GuidedCodingDiagram({highlight}: GuidedCodingDiagramProps): ReactNode {
  const id = useDiagramId();
  const titleId = `${id}-title`;
  const active = (phase: Phase) => !highlight || highlight === phase;
  /** A back arrow keeps its colour unless the page is about a phase it does not touch. */
  // Iteration is the heart of Guided Coding, so its arrows are the heaviest strokes.
  const loop = (tile: Tile, ...touches: Phase[]): CSSProperties => ({
    ...(!highlight || touches.includes(highlight) ? markStyle(tile) : {}),
    '--line-width': 6.5,
  }) as CSSProperties;
  /** Bold in forced colors, where the arrow's colour is gone. */
  const emphasis = (...touches: Phase[]) => (highlight && touches.includes(highlight) ? d.markActive : undefined);

  return (
    <DiagramFrame minWidth={540} label="Guided Coding workflow diagram">
      <svg
        viewBox="0 0 930 212"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={titleId}
        className={d.svg}
        style={{maxWidth: 930}}>
        <title id={titleId}>{descriptions[highlight ?? 'default']}</title>
        <defs>
          <TileGradients prefix={id} />
        </defs>

        {/* Guiding → Planning: a large issue, in the Planning Phase's colour. The two return
            arrows keep well apart, each label close to its own line. */}
        <g style={loop('blue', 'guiding', 'planning')}>
          <path className={d.line} d={`M 716 ${BOX_Y} V 48 Q 716 34 702 34 H 134 Q 120 34 120 48 V ${BOX_Y - 17}`} />
          <HeadDown x={120} y={BOX_Y - 1} />
          <text x={418} y={22} textAnchor="middle" fontSize="19" className={clsx(d.markText, d.semibold, emphasis('guiding', 'planning'))}>
            large issue
          </text>
        </g>

        {/* Guiding → Implementing: a small issue, in the Implementing Phase's colour */}
        <g style={loop('amber', 'guiding', 'implementing')}>
          <path className={d.line} d={`M 620 ${BOX_Y} V 108 Q 620 96 608 96 H 414 Q 402 96 402 108 V ${BOX_Y - 17}`} />
          <HeadDown x={402} y={BOX_Y - 1} />
          <text x={511} y={84} textAnchor="middle" fontSize="19" className={clsx(d.markText, d.semibold, emphasis('guiding', 'implementing'))}>
            small issue
          </text>
        </g>

        {/* The Planning Phase loops on itself until the plan stabilizes. */}
        <g style={loop('blue', 'planning')}>
          <path className={d.line} d={`M 224 ${BOX_Y} V 110 Q 224 100 214 100 H 198 Q 188 100 188 110 V ${BOX_Y - 17}`} />
          <HeadDown x={188} y={BOX_Y - 1} />
        </g>

        {/* Forward arrows */}
        {[phases[0].x + BOX_W, phases[1].x + BOX_W, phases[2].x + BOX_W].map((x) => (
          <g key={x}>
            <path className={d.line} d={`M ${x + 6} ${MID_Y} H ${x + 28}`} />
            <HeadRight x={x + 36} y={MID_Y} />
          </g>
        ))}

        {phases.map(({id: phase, number, name, x, tile}) => {
          const on = active(phase);
          return (
            <g key={phase}>
              <rect
                x={x}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                rx="10"
                {...(on ? {className: d.gradient, fill: tileUrl(id, tile), style: markStyle(tile)} : {className: d.box})}
              />
              <rect x={x + 14} y={BOX_Y + 16} width="32" height="32" rx="9" className={on ? d.badgeOnGradient : d.badge} />
              <text x={x + 30} y={BOX_Y + 38.5} textAnchor="middle" fontSize="18" className={clsx(d.strong, on && d.onGradient)}>
                {number}
              </text>
              {/* "Implementing Phase" on two lines, so the type can stay large. */}
              <text x={x + 60} y={BOX_Y + 28} fontSize="20" className={clsx(d.strong, on && d.onGradient)}>
                <tspan x={x + 60}>{name.split(' ')[0]}</tspan>
                <tspan x={x + 60} dy="22">
                  {name.split(' ')[1]}
                </tspan>
              </text>
            </g>
          );
        })}

        {/* The pull request */}
        <g>
          <rect
            x="818"
            y={MID_Y - 21}
            width="92"
            height="42"
            rx="21"
            {...(highlight ? {className: d.box} : {className: d.gradient, fill: tileUrl(id, 'brand'), style: brandEdge(id)})}
          />
          <path className={highlight ? d.line : d.check} d={`M 840 ${MID_Y} l 5 5 l 9 -10`} />
          <text x="862" y={MID_Y + 7} fontSize="20" className={clsx(d.strong, !highlight && d.onGradient)}>
            PR
          </text>
        </g>
      </svg>
    </DiagramFrame>
  );
}
