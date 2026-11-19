import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {BrandGradient, DiagramFrame, diagram as d, useGradientId} from '../Diagram';

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

const phases: {id: Phase; number: number; name: string; x: number}[] = [
  {id: 'planning', number: 1, name: 'Planning Phase', x: 20},
  {id: 'implementing', number: 2, name: 'Implementing Phase', x: 286},
  {id: 'guiding', number: 3, name: 'Guiding Phase', x: 552},
];

const BOX_Y = 132;
const BOX_W = 232;
const BOX_H = 58;
const MID_Y = BOX_Y + BOX_H / 2;

/** A downward arrowhead whose tip touches (x, y). */
function HeadDown({x, y}: {x: number; y: number}): ReactNode {
  return <path className={d.head} d={`M ${x} ${y} l -6 -10 h 12 z`} />;
}

/** A right-pointing arrowhead whose tip touches (x, y). */
function HeadRight({x, y}: {x: number; y: number}): ReactNode {
  return <path className={d.head} d={`M ${x} ${y} l -10 -6 v 12 z`} />;
}

export default function GuidedCodingDiagram({highlight}: GuidedCodingDiagramProps): ReactNode {
  const gradient = useGradientId();
  const titleId = `guided-coding-diagram-title${highlight ? `-${highlight}` : ''}`;
  const dim = 0.3;
  const o = (phase: Phase) => (highlight && highlight !== phase ? dim : 1);
  const either = (a: Phase, b: Phase) => Math.max(o(a), o(b));

  return (
    <DiagramFrame minWidth={640} label="Guided Coding workflow diagram">
      <svg
        viewBox="0 0 930 210"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={titleId}
        className={d.svg}
        style={{maxWidth: 930}}>
        <title id={titleId}>{descriptions[highlight ?? 'default']}</title>
        <defs>
          <BrandGradient id={gradient} />
        </defs>

        {/* Guiding → Planning: a large issue */}
        <g opacity={either('guiding', 'planning')}>
          <path className={d.line} d={`M 700 ${BOX_Y} V 52 Q 700 40 688 40 H 148 Q 136 40 136 52 V ${BOX_Y - 9}`} />
          <HeadDown x={136} y={BOX_Y - 1} />
          <text x={418} y={30} textAnchor="middle" fontSize="14" className={clsx(d.muted, d.semibold)}>
            large issue
          </text>
        </g>

        {/* Guiding → Implementing: a small issue */}
        <g opacity={either('guiding', 'implementing')}>
          <path className={d.line} d={`M 640 ${BOX_Y} V 96 Q 640 84 628 84 H 414 Q 402 84 402 96 V ${BOX_Y - 9}`} />
          <HeadDown x={402} y={BOX_Y - 1} />
          <text x={521} y={74} textAnchor="middle" fontSize="14" className={clsx(d.muted, d.semibold)}>
            small issue
          </text>
        </g>

        {/* The Planning Phase loops on itself until the plan stabilizes. */}
        <g opacity={o('planning')}>
          <path className={d.line} d={`M 224 ${BOX_Y} V 110 Q 224 100 214 100 H 198 Q 188 100 188 110 V ${BOX_Y - 9}`} />
          <HeadDown x={188} y={BOX_Y - 1} />
        </g>

        {/* Forward arrows */}
        <g opacity={highlight ? dim : 1}>
          {[phases[0].x + BOX_W, phases[1].x + BOX_W, phases[2].x + BOX_W].map((x) => (
            <g key={x}>
              <path className={d.line} d={`M ${x + 6} ${MID_Y} H ${x + 28}`} />
              <HeadRight x={x + 36} y={MID_Y} />
            </g>
          ))}
        </g>

        {phases.map(({id, number, name, x}) => {
          const focal = highlight === id;
          return (
            <g key={id} opacity={o(id)}>
              <rect
                x={x}
                y={BOX_Y}
                width={BOX_W}
                height={BOX_H}
                rx="10"
                className={focal ? d.gradient : d.box}
                fill={focal ? `url(#${gradient})` : undefined}
              />
              <rect
                x={x + 14}
                y={BOX_Y + 15}
                width="28"
                height="28"
                rx="8"
                className={focal ? d.badgeOnGradient : d.badge}
              />
              <text
                x={x + 28}
                y={BOX_Y + 34}
                textAnchor="middle"
                fontSize="14"
                className={clsx(d.strong, focal && d.onGradient)}>
                {number}
              </text>
              <text x={x + 54} y={BOX_Y + 35} fontSize="16" className={clsx(d.strong, focal && d.onGradient)}>
                {name}
              </text>
            </g>
          );
        })}

        {/* The pull request */}
        <g opacity={highlight ? dim : 1}>
          <rect x="818" y={MID_Y - 21} width="92" height="42" rx="21" className={d.gradient} fill={`url(#${gradient})`} />
          <path
            className={d.line}
            style={{stroke: 'var(--kc-on-gradient)', strokeWidth: 2.25}}
            d={`M 840 ${MID_Y} l 5 5 l 9 -10`}
          />
          <text x="863" y={MID_Y + 5.5} fontSize="16" className={clsx(d.strong, d.onGradient)}>
            PR
          </text>
        </g>
      </svg>
    </DiagramFrame>
  );
}
