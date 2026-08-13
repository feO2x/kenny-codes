type StepKind = 'skill' | 'manual';

interface Step {
  kind: StepKind;
  title: string;
  description: string;
}

interface Loop {
  from: number;
  to: number;
  label: [string, string];
}

interface Card {
  color: string;
  header: string;
  steps: Step[];
  loop?: Loop;
}

const cards: Card[] = [
  {
    color: '#4B5563',
    header: 'ONCE PER REPOSITORY',
    steps: [
      {
        kind: 'skill',
        title: 'guided-coding-setup',
        description: 'Writes AGENTS.md and ai-plans/, records feedback loops.',
      },
    ],
  },
  {
    color: '#0078D4',
    header: '1. PLANNING PHASE',
    loop: {from: 3, to: 5, label: ['repeat until', 'it stabilizes']},
    steps: [
      {
        kind: 'manual',
        title: 'Discuss the approach',
        description: '"As an expert architect, how would you tackle this?"',
      },
      {
        kind: 'skill',
        title: 'guided-coding-prepare-issue-for-plan',
        description: 'After you agree: empty issue, clean local branch.',
      },
      {
        kind: 'skill',
        title: 'guided-coding-write-plan',
        description: 'Writes the draft. Invoked once per plan.',
      },
      {
        kind: 'manual',
        title: 'Further discussion',
        description: 'Question the draft; revise it with plain prompts.',
      },
      {
        kind: 'skill',
        title: 'guided-coding-review-plan',
        description: 'Optional second opinion, in a fresh conversation.',
      },
      {
        kind: 'manual',
        title: 'Further discussion',
        description: '"Would you change anything about the plan?"',
      },
      {
        kind: 'skill',
        title: 'guided-coding-finish-plan',
        description: 'Commits and freezes the plan; publishes it to the issue.',
      },
    ],
  },
  {
    color: '#E88A00',
    header: '2. IMPLEMENTING PHASE',
    steps: [
      {
        kind: 'manual',
        title: 'Hand over the plan in a fresh conversation',
        description: 'No skill. The frozen plan and feedback loops steer it.',
      },
    ],
  },
  {
    color: '#6B2FA0',
    header: '3. GUIDING PHASE',
    steps: [
      {
        kind: 'manual',
        title: 'Review every changed file',
        description: 'Read it yourself; optionally add an agent review.',
      },
      {
        kind: 'manual',
        title: 'Iterate',
        description: 'Small issue: to Implementing. Large: to Planning.',
      },
      {
        kind: 'skill',
        title: 'guided-coding-write-deviations',
        description: 'Only when the code materially departs from the plans.',
      },
    ],
  },
  {
    color: '#107C10',
    header: '',
    steps: [
      {
        kind: 'manual',
        title: 'Open the pull request',
        description: 'Reviewers read the first plan and the Plan Deviations.',
      },
    ],
  },
];

const HEADER_HEIGHT = 34;
const STEP_HEIGHT = 46;
const CARD_PADDING = 22;
const CARD_GAP = 16;
const CARD_X = 20;
const CARD_WIDTH = 660;
const TEXT_X = 68;
const SVG_WIDTH = 700;
const CONNECTOR_WIDTH = 4;

// The two iteration arrows run over the cards, in the empty band right of the
// step text. Keep both corridors left of the card edge, and the arrow heads
// left of both corridors, or the arms invert and the heads flip outward.
const INNER_CORRIDOR_X = 604;
const OUTER_CORRIDOR_X = 644;
// Where a head stops, just right of the longest text it points at.
const ARROW_TIP_X = 430;

const description =
  'Timeline of the Guided Coding skills. Run guided-coding-setup once per repository. ' +
  'The Planning Phase starts with a discussion of the approach. Once you agree on the direction, run ' +
  'guided-coding-prepare-issue-for-plan, then guided-coding-write-plan once to produce the draft. ' +
  'Discuss the draft further and prompt the agent to revise it directly, optionally run ' +
  'guided-coding-review-plan in a fresh conversation, and discuss again. Discussion, review, and ' +
  'revision repeat until the plan stabilizes, after which guided-coding-finish-plan ' +
  'commits and freezes it. In the Implementing Phase, hand the frozen plan to a fresh conversation ' +
  'without any skill. In the Guiding Phase, review every changed file, and run ' +
  'guided-coding-write-deviations when the code materially departs from the plans. Two arrows lead ' +
  'back from the Guiding Phase: a small issue returns to the Implementing Phase, and a large issue ' +
  'returns to the start of the Planning Phase. Finally, open the pull request.';

export default function GuidedCodingSkillTimeline() {
  let y = 20;
  const markerPositions: number[][] = [];
  const rendered = cards.map((card, cardIndex) => {
    const contentHeight =
      (card.header ? HEADER_HEIGHT : 0) + card.steps.length * STEP_HEIGHT;
    const cardHeight = contentHeight + CARD_PADDING;
    const cardTop = y;
    let cursor = cardTop + (card.header ? HEADER_HEIGHT + 12 : 16);

    const positions: number[] = [];
    const steps = card.steps.map((step, stepIndex) => {
      const markerY = cursor + 10;
      positions.push(markerY);
      const element = (
        <g key={stepIndex}>
          {step.kind === 'skill' ? (
            <circle cx={52} cy={markerY} r={6} fill={card.color} />
          ) : (
            <circle
              cx={52}
              cy={markerY}
              r={5.5}
              fill="#FFFFFF"
              stroke={card.color}
              strokeWidth="2.5"
            />
          )}
          <text
            x={TEXT_X}
            y={markerY + 4}
            fill="#1A1A1A"
            fontFamily={
              step.kind === 'skill'
                ? 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace'
                : 'Segoe UI, sans-serif'
            }
            fontSize="13"
            fontWeight="600"
          >
            {step.title}
          </text>
          <text
            x={TEXT_X}
            y={markerY + 22}
            fill="#4B5563"
            fontFamily="Segoe UI, sans-serif"
            fontSize="12.5"
          >
            {step.description}
          </text>
        </g>
      );
      cursor += STEP_HEIGHT;
      return element;
    });
    markerPositions.push(positions);

    y = cardTop + cardHeight + CARD_GAP;

    const firstMarkerY = cardTop + (card.header ? HEADER_HEIGHT + 12 : 16) + 10;
    const loopTop = card.loop ? firstMarkerY + card.loop.from * STEP_HEIGHT : 0;
    const loopBottom = card.loop ? firstMarkerY + card.loop.to * STEP_HEIGHT : 0;

    return (
      <g key={cardIndex}>
        <rect
          x={CARD_X}
          y={cardTop}
          width={CARD_WIDTH}
          height={cardHeight}
          rx="6"
          fill="#FFFFFF"
        />
        <rect x={CARD_X} y={cardTop} width={6} height={cardHeight} rx="3" fill={card.color} />
        {card.loop && (
          <g>
            <path
              d={`M 471 ${loopTop} H 484 Q 500 ${loopTop} 500 ${loopTop + 16} V ${loopBottom - 16} Q 500 ${loopBottom} 484 ${loopBottom} H 456`}
              fill="none"
              stroke={card.color}
              strokeWidth={CONNECTOR_WIDTH}
            />
            <polygon
              points={`454,${loopTop} 472,${loopTop - 7.5} 472,${loopTop + 7.5}`}
              fill={card.color}
            />
            <text
              x={512}
              y={(loopTop + loopBottom) / 2 - 3}
              fill={card.color}
              fontFamily="Segoe UI, sans-serif"
              fontSize="11"
              fontWeight="600"
            >
              {card.loop.label[0]}
            </text>
            <text
              x={512}
              y={(loopTop + loopBottom) / 2 + 11}
              fill={card.color}
              fontFamily="Segoe UI, sans-serif"
              fontSize="11"
              fontWeight="600"
            >
              {card.loop.label[1]}
            </text>
          </g>
        )}
        {card.header && (
          <text
            x={44}
            y={cardTop + 26}
            fill={card.color}
            fontFamily="Segoe UI, sans-serif"
            fontSize="12"
            fontWeight="700"
            letterSpacing="0.8"
          >
            {card.header}
          </text>
        )}
        {steps}
      </g>
    );
  });

  const totalHeight = y - CARD_GAP + 20;

  // Iteration arrows out of the Guiding Phase, mirroring the phase diagram.
  // Both leave the "Iterate" row; the small hop runs inside the large one.
  const iterateY = markerPositions[3][1];
  const iterationArrows = [
    {
      color: '#E88A00',
      corridor: INNER_CORRIDOR_X,
      startY: iterateY - 8,
      targetY: markerPositions[2][0],
      label: 'small issue',
    },
    {
      color: '#0078D4',
      corridor: OUTER_CORRIDOR_X,
      startY: iterateY + 8,
      targetY: markerPositions[1][0],
      label: 'large issue',
    },
  ].map(({color, corridor, startY, targetY, label}) => {
    const labelX = corridor + 17;
    const labelY = (startY + targetY) / 2;
    return (
      <g key={label}>
        <path
          d={`M ${ARROW_TIP_X + 10} ${startY} H ${corridor - 16} Q ${corridor} ${startY} ${corridor} ${startY - 16} V ${targetY + 16} Q ${corridor} ${targetY} ${corridor - 16} ${targetY} H ${ARROW_TIP_X + 18}`}
          fill="none"
          stroke={color}
          strokeWidth={CONNECTOR_WIDTH}
          strokeLinecap="round"
        />
        <polygon
          points={`${ARROW_TIP_X},${targetY} ${ARROW_TIP_X + 18},${targetY - 7.5} ${ARROW_TIP_X + 18},${targetY + 7.5}`}
          fill={color}
        />
        <text
          x={labelX}
          y={labelY}
          transform={`rotate(-90 ${labelX} ${labelY})`}
          textAnchor="middle"
          fill={color}
          fontFamily="Segoe UI, sans-serif"
          fontSize="11"
          fontWeight="600"
        >
          {label}
        </text>
      </g>
    );
  });

  return (
    <svg
      viewBox={`0 0 ${SVG_WIDTH} ${totalHeight}`}
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="guided-coding-skill-timeline-title"
      style={{maxWidth: `${SVG_WIDTH}px`, width: '100%', margin: '1.5rem auto', display: 'block'}}
    >
      <title id="guided-coding-skill-timeline-title">{description}</title>
      <rect x="0" y="0" width={SVG_WIDTH} height={totalHeight} rx="8" fill="#D6D6D6" />
      {rendered}
      {iterationArrows}
    </svg>
  );
}
