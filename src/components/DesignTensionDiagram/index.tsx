const FONT = 'Segoe UI, sans-serif';
const BOX_COLOR = '#1F3864';
const ARROW_COLOR = '#5A5A5A';
const TEXT_COLOR = '#2A2A2A';
const BULLET_COLOR = '#1F3864';
const WARNING_SIGN_COLOR = '#b18903';

const LINE_HEIGHT = 20;
const BULLET_GAP = 14;
const LIST_TOP = 214;

const tooLittleAbstractionBullets: string[][] = [
  ['Thousands of lines of code in a single file'],
  [
    'Little or no abstraction: SQL statements, HTTP calls,',
    'business logic, UI manipulation all reside',
    'in the same scope',
  ],
  [
    'Tight coupling makes individual parts impossible to',
    'test automatically without third-party systems',
  ],
];

const excessiveAbstractionBullets: string[][] = [
  [
    'Loose coupling everywhere:',
    'new functionality -> new class, new interface,',
    'an army of interfaces and tiny objects',
  ],
  [
    'Many test doubles scatter the test suite',
  ],
  ['Static methods are considered tight-coupling and are forbidden'],
  [
    'You have to jump to the definition ten times to find',
    'the code that actually does the work',
  ],
];

const description =
  'Diagram showing the tension between two design extremes. On the left, Too Little Abstraction: ' +
  'thousands of lines of code in a single file; little or no abstraction, with SQL statements, ' +
  'HTTP calls, business logic, and UI manipulation all in the same scope; and tight coupling that ' +
  'makes individual parts impossible to test automatically without third-party systems. On the ' +
  'right, Excessive Abstraction: loose coupling everywhere, with each piece of new functionality ' +
  'introducing a new class and interface; an army of interfaces and tiny objects; many test doubles ' +
  'scattered throughout the test suite; static methods considered tightly coupled and therefore ' +
  'forbidden; and ten jumps to the definition to find the code that actually does the work. A ' +
  'double-headed arrow labelled Tension runs between them, with a warning sign in the middle.';

function BulletList({ x, bullets }: { x: number; bullets: string[][] }) {
  let y = LIST_TOP;

  return (
    <>
      {bullets.map((lines, bulletIndex) => {
        const markerY = y - 9;
        const rendered = (
          <g key={bulletIndex}>
            <rect x={x} y={markerY} width="7" height="7" fill={BULLET_COLOR} />
            {lines.map((line, lineIndex) => (
              <text
                key={lineIndex}
                x={x + 18}
                y={y + lineIndex * LINE_HEIGHT}
                fill={TEXT_COLOR}
                fontFamily={FONT}
                fontSize="14"
              >
                {line}
              </text>
            ))}
          </g>
        );
        y += lines.length * LINE_HEIGHT + BULLET_GAP;
        return rendered;
      })}
    </>
  );
}

export default function DesignTensionDiagram() {
  return (
    <svg
      viewBox="0 0 1120 420"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby="design-tension-diagram-title"
      style={{ maxWidth: '1120px', width: '100%', margin: '1.5rem auto', display: 'block' }}
    >
      <title id="design-tension-diagram-title">{description}</title>

      <rect x="0" y="0" width="1120" height="420" rx="8" fill="#D6D6D6" />

      <defs>
        <marker id="tensionArrow" markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={ARROW_COLOR} />
        </marker>
        <marker id="tensionArrowStart" markerWidth="8" markerHeight="6" refX="0.5" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill={ARROW_COLOR} />
        </marker>
      </defs>

      {/* The two design extremes */}
      <rect x="60" y="62" width="300" height="54" rx="4" fill={BOX_COLOR} />
      <text x="210" y="96" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="17" fontWeight="600">
        Too Little Abstraction
      </text>

      <rect x="760" y="62" width="300" height="54" rx="4" fill={BOX_COLOR} />
      <text x="910" y="96" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="17" fontWeight="600">
        Excessive Abstraction
      </text>

      {/* Tension between them */}
      <text x="560" y="72" textAnchor="middle" fill={TEXT_COLOR} fontFamily={FONT} fontSize="16">
        Tension
      </text>
      <line
        x1="374"
        y1="89"
        x2="746"
        y2="89"
        stroke={ARROW_COLOR}
        strokeWidth="3"
        markerEnd="url(#tensionArrow)"
        markerStart="url(#tensionArrowStart)"
      />

      {/* Warning sign */}
      <path d="M 560 122 L 594 178 H 526 Z" fill={WARNING_SIGN_COLOR} strokeLinejoin="round" stroke={WARNING_SIGN_COLOR} strokeWidth="6" />
      <polygon points="566 135, 548 161, 558 161, 552 176, 573 150, 562 150" fill="#FFFFFF" />

      <BulletList x={60} bullets={tooLittleAbstractionBullets} />
      <BulletList x={620} bullets={excessiveAbstractionBullets} />
    </svg>
  );
}
