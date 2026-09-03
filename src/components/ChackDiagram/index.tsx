type ChackPart = 'core' | 'humble-objects' | 'automated-tests' | 'composition-root';

interface ChackDiagramProps {
  highlight?: ChackPart;
}

const baseDescription =
  'CHACK diagram. Inside a process boundary sit the Core with its I/O abstractions, the Humble ' +
  'Objects at the boundary, the Composition Root, and the unit tests with their test doubles. ' +
  'Integration tests straddle the process boundary, because they may exercise the system ' +
  'under test inside or outside the test runner process. End-to-end tests sit to the right, ' +
  'outside the boundary, because they usually start the system under test in another process, for example with Docker ' +
  'Compose or Aspire. The Humble Objects exchange data at runtime with ' +
  'third-party systems such as databases, web services, and message brokers. Two kinds of ' +
  'compile-time arrows are used: an open arrowhead means one category references another, and a ' +
  'dashed arrow with a hollow triangle means one type implements or derives from another. The ' +
  'Humble Objects and the test doubles both implement the I/O abstractions. The Core references ' +
  'the I/O abstractions. Unit tests reference the Core and their test doubles. Integration and ' +
  'end-to-end tests reference the Humble Objects, the Composition Root, and the third-party ' +
  'systems. The Composition Root references the Core and the Humble Objects. Every category may ' +
  'depend on the frameworks and libraries they reference, so ' +
  'those arrows are left out.';

const descriptions: Record<string, string> = {
  core: `${baseDescription} The Core and its I/O abstractions are highlighted.`,
  'humble-objects': `${baseDescription} The Humble Objects are highlighted.`,
  'automated-tests': `${baseDescription} The Automated Tests are highlighted.`,
  'composition-root': `${baseDescription} The Composition Root is highlighted.`,
  default: baseDescription,
};

const FONT = 'Segoe UI, sans-serif';
const CORE_COLOR = '#0078D4';
const ABSTRACTIONS_COLOR = '#3FA0E8';
const HUMBLE_COLOR = '#107C10';
const UNIT_TEST_COLOR = '#6B2FA0';
const TEST_DOUBLE_COLOR = '#9B51C9';
const BROAD_TEST_COLOR = '#4A2378';
const COMPOSITION_ROOT_COLOR = '#604e05';
const BOUNDARY_COLOR = '#C2185B';
const ARROW_COLOR = '#2F2F2F';
const BACKGROUND_COLOR = '#D6D6D6';

const STROKE = 2.5;
const DASH = '7 5';

export default function ChackDiagram({ highlight }: ChackDiagramProps) {
  const dim = 0.25;
  const o = (part: ChackPart) => (highlight && highlight !== part ? dim : 1);
  const oContext = highlight ? dim : 1;
  const titleId = `chack-diagram-title${highlight ? `-${highlight}` : ''}`;

  return (
    <svg
      viewBox="0 0 1120 660"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-labelledby={titleId}
      style={{ maxWidth: '1120px', width: '100%', margin: '1.5rem auto', display: 'block' }}
    >
      <title id={titleId}>{descriptions[highlight ?? 'default']}</title>

      <rect x="0" y="0" width="1120" height="660" rx="8" fill={BACKGROUND_COLOR} />

      <defs>
        {/* Open arrowhead: "references" */}
        <marker id="chackRef" markerWidth="9" markerHeight="7" refX="8.5" refY="3.5" orient="auto">
          <path d="M 0.6 0.6 L 8.4 3.5 L 0.6 6.4" fill="none" stroke={ARROW_COLOR} strokeWidth="0.9" />
        </marker>
        {/* Hollow triangle: "implements / derives from" */}
        <marker id="chackImpl" markerWidth="9" markerHeight="8" refX="8.6" refY="4" orient="auto">
          <polygon points="0.5 0.6, 8.5 4, 0.5 7.4" fill={BACKGROUND_COLOR} stroke={ARROW_COLOR} strokeWidth="0.9" />
        </marker>
        {/* Solid heads: runtime I/O */}
        <marker id="chackIo" markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
          <polygon points="0 0, 8 3, 0 6" fill={ARROW_COLOR} />
        </marker>
        <marker id="chackIoStart" markerWidth="8" markerHeight="6" refX="0.5" refY="3" orient="auto">
          <polygon points="8 0, 0 3, 8 6" fill={ARROW_COLOR} />
        </marker>
      </defs>

      {/* Process boundary - integration tests sit over its right edge; unit tests stay
          inside, while E2E tests drive the system under test from another process. */}
      <g opacity={oContext}>
        <rect x="250" y="58" width="686" height="512" fill="none" stroke={BOUNDARY_COLOR} strokeWidth="3" />
        <rect x="250" y="58" width="686" height="26" fill={BOUNDARY_COLOR} />
        <text x="593" y="76" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="14" fontWeight="600">
          Process Boundary
        </text>
      </g>

      {/* Frameworks and libraries */}
      <g opacity={oContext}>
        <rect x="333" y="108" width="520" height="76" rx="4" fill="#6E6E6E" />
        <text x="593" y="132" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="14.5" fontWeight="600">
          Frameworks &amp; Libraries
        </text>
        <text x="593" y="151" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="11.5">
          Base Class Library, HTTP Server Frameworks, Data Access,
        </text>
        <text x="593" y="167" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="11.5">
          Validation Frameworks, Test Frameworks, …
        </text>
      </g>

      {/* Third-party systems */}
      <g opacity={oContext}>
        <rect x="6" y="205" width="124" height="230" rx="4" fill="#FAFAFA" stroke="#3A3A3A" strokeWidth="1.5" />
        <text x="68" y="233" textAnchor="middle" fill="#2A2A2A" fontFamily={FONT} fontSize="12" fontWeight="600">
          Third-Party Systems
        </text>
        <rect x="16" y="253" width="104" height="46" rx="4" fill="#FFFFFF" stroke="#8A8A8A" strokeWidth="1.5" />
        <text x="68" y="281" textAnchor="middle" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          Databases
        </text>
        <rect x="16" y="309" width="104" height="46" rx="4" fill="#FFFFFF" stroke="#8A8A8A" strokeWidth="1.5" />
        <text x="68" y="337" textAnchor="middle" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          Web Services
        </text>
        <rect x="16" y="365" width="104" height="46" rx="4" fill="#FFFFFF" stroke="#8A8A8A" strokeWidth="1.5" />
        <text x="68" y="393" textAnchor="middle" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          Message Brokers
        </text>
      </g>

      {/* Runtime I/O between third-party systems and humble objects */}
      <g opacity={Math.max(o('humble-objects'), oContext)}>
        <line
          x1="134"
          y1="328"
          x2="181"
          y2="328"
          stroke={ARROW_COLOR}
          strokeWidth={STROKE}
          markerEnd="url(#chackIo)"
          markerStart="url(#chackIoStart)"
        />
      </g>

      {/* Implements / derives from */}
      <g opacity={Math.max(o('humble-objects'), o('core'))}>
        <line
          x1="315"
          y1="328"
          x2="363"
          y2="328"
          stroke={ARROW_COLOR}
          strokeWidth={STROKE}
          strokeDasharray={DASH}
          markerEnd="url(#chackImpl)"
        />
      </g>
      <g opacity={Math.max(o('automated-tests'), o('core'))}>
        <path
          d="M 808 420 H 428 V 358"
          fill="none"
          stroke={ARROW_COLOR}
          strokeWidth={STROKE}
          strokeDasharray={DASH}
          markerEnd="url(#chackImpl)"
        />
      </g>

      {/* References */}
      <g opacity={o('core')}>
        <line x1="540" y1="328" x2="492" y2="328" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={Math.max(o('automated-tests'), o('core'))}>
        <line x1="808" y1="311" x2="732" y2="311" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={o('automated-tests')}>
        <line x1="852" y1="350" x2="852" y2="380" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      {/* Integration and E2E tests share references to the same collaborators. */}
      <g opacity={Math.max(o('automated-tests'), o('humble-objects'))}>
        <path d="M 924 272 V 200" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} />
        <path d="M 1000 272 V 200 H 280 V 288" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={Math.max(o('automated-tests'), oContext)}>
        <path d="M 948 272 V 38" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} />
        <path d="M 1032 272 V 38 H 68 V 203" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={Math.max(o('automated-tests'), o('composition-root'))}>
        <path d="M 924 458 V 519" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} />
        <path d="M 1016 458 V 519 H 732" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={Math.max(o('composition-root'), o('core'))}>
        <line x1="645" y1="488" x2="645" y2="390" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>
      <g opacity={Math.max(o('composition-root'), o('humble-objects'))}>
        <path d="M 540 519 H 280 V 368" fill="none" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
      </g>

      {/* Humble objects */}
      <g opacity={o('humble-objects')}>
        <rect x="185" y="290" width="130" height="76" rx="6" fill={HUMBLE_COLOR} />
        <text x="250" y="322" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="15" fontWeight="600">
          Humble
        </text>
        <text x="250" y="343" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="15" fontWeight="600">
          Objects
        </text>
      </g>

      {/* I/O abstractions */}
      <g opacity={o('core')}>
        <rect x="365" y="300" width="125" height="56" rx="4" fill={ABSTRACTIONS_COLOR} />
        <text x="427" y="323" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          I/O
        </text>
        <text x="427" y="341" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Abstractions
        </text>
      </g>

      {/* Core */}
      <g opacity={o('core')}>
        <rect x="540" y="268" width="190" height="120" rx="4" fill={CORE_COLOR} />
        <text x="635" y="335" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="18" fontWeight="600">
          Core
        </text>
      </g>

      {/* Automated tests - the group straddles the process boundary */}
      <g opacity={o('automated-tests')}>
        <text x="790" y="242" fill={BROAD_TEST_COLOR} fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Automated Tests
        </text>
        <rect x="790" y="250" width="290" height="230" rx="4" fill="none" stroke={UNIT_TEST_COLOR} strokeWidth="2" />

        <rect x="808" y="272" width="88" height="78" rx="4" fill={UNIT_TEST_COLOR} />
        <text x="852" y="305" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Unit
        </text>
        <text x="852" y="323" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Tests
        </text>

        <rect x="808" y="382" width="88" height="76" rx="4" fill={TEST_DOUBLE_COLOR} />
        <text x="852" y="414" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Test
        </text>
        <text x="852" y="432" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Doubles
        </text>

        <rect x="912" y="272" width="48" height="186" rx="4" fill={BROAD_TEST_COLOR} />
        <text transform="translate(936 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          Integration Tests
        </text>

        <rect x="984" y="272" width="64" height="186" rx="4" fill={BROAD_TEST_COLOR} />
        <text transform="translate(1016 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fill="white" fontFamily={FONT} fontSize="13.5" fontWeight="600">
          E2E Tests
        </text>
      </g>

      {/* Composition root */}
      <g opacity={o('composition-root')}>
        <rect x="540" y="488" width="190" height="62" rx="4" fill={COMPOSITION_ROOT_COLOR} />
        <text x="635" y="525" textAnchor="middle" fill="white" fontFamily={FONT} fontSize="15" fontWeight="600">
          Composition Root
        </text>
      </g>

      {/* Legend */}
      <g>
        <line x1="20" y1="492" x2="64" y2="492" stroke={ARROW_COLOR} strokeWidth={STROKE} markerEnd="url(#chackRef)" />
        <text x="76" y="496" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          references
        </text>

        <line
          x1="20"
          y1="521"
          x2="64"
          y2="521"
          stroke={ARROW_COLOR}
          strokeWidth={STROKE}
          strokeDasharray={DASH}
          markerEnd="url(#chackImpl)"
        />
        <text x="76" y="525" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          implements / derives from
        </text>

        <line
          x1="20"
          y1="550"
          x2="64"
          y2="550"
          stroke={ARROW_COLOR}
          strokeWidth={STROKE}
          markerEnd="url(#chackIo)"
          markerStart="url(#chackIoStart)"
        />
        <text x="76" y="554" fill="#2A2A2A" fontFamily={FONT} fontSize="11.5">
          I/O call at runtime
        </text>
      </g>

      {/* Caption */}
      <text x="560" y="614" textAnchor="middle" fill="#4A4A4A" fontFamily={FONT} fontSize="12">
        All four categories may depend on the frameworks and libraries. Those arrows are left out
      </text>
      <text x="560" y="632" textAnchor="middle" fill="#4A4A4A" fontFamily={FONT} fontSize="12">
        to keep the number of arrows manageable.
      </text>
    </svg>
  );
}
