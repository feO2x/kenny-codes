import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame, TileGradients, diagram as d, markStyle, tileUrl, useDiagramId} from '../Diagram';

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

/** Two-line label centred in a box. */
function Label({x, y, lines, size = 18, className}: {x: number; y: number; lines: string[]; size?: number; className?: string}): ReactNode {
  const lineHeight = size * 1.25;
  const top = y - ((lines.length - 1) * lineHeight) / 2 + size * 0.36;
  return (
    <text x={x} y={top} textAnchor="middle" fontSize={size} className={clsx(d.strong, className)}>
      {lines.map((line, index) => (
        <tspan key={line} x={x} dy={index === 0 ? 0 : lineHeight}>
          {line}
        </tspan>
      ))}
    </text>
  );
}

export default function ChackDiagram({highlight}: ChackDiagramProps): ReactNode {
  const dim = 0.35;
  const o = (part: ChackPart) => (highlight && highlight !== part ? dim : 1);
  const oContext = highlight ? dim : 1;
  // Ids must be unique per diagram, because a page may show several.
  const prefix = useDiagramId();
  const titleId = `${prefix}-title`;
  const tile = (name: Parameters<typeof tileUrl>[1]) => tileUrl(prefix, name);
  const ref = `url(#${prefix}-ref)`;
  const impl = `url(#${prefix}-impl)`;
  const io = `url(#${prefix}-io)`;
  const ioStart = `url(#${prefix}-io-start)`;

  return (
    <DiagramFrame minWidth={640} label="CHACK diagram">
      <svg
        viewBox="0 0 1086 580"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={titleId}
        className={d.svg}
        style={{maxWidth: 1086, '--line-width': 2.25} as CSSProperties}>
        <title id={titleId}>{descriptions[highlight ?? 'default']}</title>

        <defs>
          <TileGradients prefix={prefix} />
          {/* Open arrowhead: "references" */}
          <marker id={`${prefix}-ref`} markerWidth="9" markerHeight="7" refX="8.5" refY="3.5" orient="auto">
            <path d="M 0.6 0.6 L 8.4 3.5 L 0.6 6.4" className={d.line} style={{strokeWidth: 0.9}} />
          </marker>
          {/* Hollow triangle: "implements / derives from" */}
          <marker id={`${prefix}-impl`} markerWidth="9" markerHeight="8" refX="8.6" refY="4" orient="auto">
            <polygon points="0.5 0.6, 8.5 4, 0.5 7.4" className={d.headHollow} style={{strokeWidth: 0.9}} />
          </marker>
          {/* Solid heads: runtime I/O */}
          <marker id={`${prefix}-io`} markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto">
            <polygon points="0 0, 8 3, 0 6" className={d.head} />
          </marker>
          <marker id={`${prefix}-io-start`} markerWidth="8" markerHeight="6" refX="0.5" refY="3" orient="auto">
            <polygon points="8 0, 0 3, 8 6" className={d.head} />
          </marker>
        </defs>

        {/* Process boundary - integration tests sit over its right edge; unit tests stay
            inside, while E2E tests drive the system under test from another process. */}
        <g opacity={oContext}>
          <rect x="250" y="58" width="686" height="512" rx="14" className={d.boundary} />
          <rect x="513" y="45" width="160" height="26" rx="13" className={d.chip} />
          <text x="593" y="63.5" textAnchor="middle" fontSize="16" className={clsx(d.muted, d.semibold)}>
            Process boundary
          </text>
        </g>

        {/* Frameworks and libraries */}
        <g opacity={oContext}>
          <rect x="333" y="100" width="520" height="84" rx="10" className={d.quiet} />
          <text x="593" y="129" textAnchor="middle" fontSize="17" className={d.strong}>
            Frameworks &amp; Libraries
          </text>
          <text x="593" y="153" textAnchor="middle" fontSize="16" className={d.muted}>
            Base Class Library, HTTP Server Frameworks, Data Access,
          </text>
          <text x="593" y="173" textAnchor="middle" fontSize="16" className={d.muted}>
            Validation Frameworks, Test Frameworks, …
          </text>
        </g>

        {/* Third-party systems */}
        <g opacity={oContext}>
          <rect x="4" y="198" width="128" height="244" rx="10" className={d.box} />
          <Label x={68} y={228} lines={['Third-Party', 'Systems']} size={16} />
          {['Databases', 'Web Services', 'Message Brokers'].map((name, index) => (
            <g key={name}>
              <rect x="12" y={260 + index * 58} width="112" height="50" rx="8" className={d.inner} />
              <Label x={68} y={285 + index * 58} lines={name === 'Databases' ? [name] : name.split(' ')} size={16} className={d.regular} />
            </g>
          ))}
        </g>

        {/* Runtime I/O between third-party systems and humble objects */}
        <g opacity={Math.max(o('humble-objects'), oContext)}>
          <line x1="134" y1="328" x2="181" y2="328" className={d.line} markerEnd={io} markerStart={ioStart} />
        </g>

        {/* Implements / derives from */}
        <g opacity={Math.max(o('humble-objects'), o('core'))}>
          <line x1="315" y1="328" x2="363" y2="328" className={clsx(d.line, d.dashed)} markerEnd={impl} />
        </g>
        <g opacity={Math.max(o('automated-tests'), o('core'))}>
          <path d="M 808 420 H 428 V 358" className={clsx(d.line, d.dashed)} markerEnd={impl} />
        </g>

        {/* References */}
        <g opacity={o('core')}>
          <line x1="540" y1="328" x2="492" y2="328" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={Math.max(o('automated-tests'), o('core'))}>
          <line x1="808" y1="311" x2="732" y2="311" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={o('automated-tests')}>
          <line x1="852" y1="350" x2="852" y2="380" className={d.line} markerEnd={ref} />
        </g>
        {/* Integration and E2E tests share references to the same collaborators. */}
        <g opacity={Math.max(o('automated-tests'), o('humble-objects'))}>
          <path d="M 924 272 V 200" className={d.line} />
          <path d="M 1000 272 V 200 H 280 V 288" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={Math.max(o('automated-tests'), oContext)}>
          <path d="M 948 272 V 30" className={d.line} />
          <path d="M 1032 272 V 30 H 68 V 196" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={Math.max(o('automated-tests'), o('composition-root'))}>
          <path d="M 924 458 V 519" className={d.line} />
          <path d="M 1016 458 V 519 H 732" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={Math.max(o('composition-root'), o('core'))}>
          <line x1="645" y1="488" x2="645" y2="390" className={d.line} markerEnd={ref} />
        </g>
        <g opacity={Math.max(o('composition-root'), o('humble-objects'))}>
          <path d="M 540 519 H 280 V 368" className={d.line} markerEnd={ref} />
        </g>

        {/* Humble objects, on the process boundary */}
        <g opacity={o('humble-objects')}>
          <rect x="185" y="290" width="130" height="76" rx="10" className={d.gradient} fill={tile('violet')} />
          <Label x={250} y={328} lines={['Humble', 'Objects']} className={d.onGradient} />
        </g>

        {/* I/O abstractions belong to the Core. */}
        <g opacity={o('core')}>
          {/* Its gradient outline shows that it belongs to the Core. */}
          <rect x="365" y="300" width="125" height="56" rx="10" className={d.soft} stroke={tile('brand')} />
          <Label x={427} y={328} lines={['I/O', 'Abstractions']} size={16} />
        </g>

        {/* Core */}
        <g opacity={o('core')}>
          <rect x="540" y="268" width="190" height="120" rx="12" className={d.gradient} fill={tile('brand')} />
          <Label x={635} y={328} lines={['Core']} size={24} className={d.onGradient} />
        </g>

        {/* Automated tests - the group straddles the process boundary */}
        <g opacity={o('automated-tests')} style={markStyle('magenta')}>
          <rect x="790" y="250" width="290" height="230" rx="14" className={d.group} />
          {/* Above the group's top edge, clear of the integration test connectors at x=924. */}
          <text x="792" y="241" fontSize="15" className={clsx(d.markText, d.semibold)}>
            Automated Tests
          </text>
          <rect x="808" y="272" width="88" height="78" rx="10" className={d.gradient} fill={tile('magenta')} />
          <Label x={852} y={311} lines={['Unit', 'Tests']} size={17} className={d.onGradient} />
          {/* Test doubles implement the Core's abstractions: a lighter tint of the tests' colour. */}
          <rect x="808" y="382" width="88" height="76" rx="10" className={d.tint} />
          <Label x={852} y={420} lines={['Test', 'Doubles']} size={17} />
          <rect x="912" y="272" width="48" height="186" rx="10" className={d.gradient} fill={tile('magenta')} />
          <text transform="translate(936 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fontSize="17" className={clsx(d.strong, d.onGradient)}>
            Integration Tests
          </text>
          <rect x="984" y="272" width="64" height="186" rx="10" className={d.gradient} fill={tile('magenta')} />
          <text transform="translate(1016 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fontSize="17" className={clsx(d.strong, d.onGradient)}>
            E2E Tests
          </text>
        </g>

        {/* Composition root */}
        <g opacity={o('composition-root')}>
          <rect x="540" y="488" width="190" height="62" rx="10" className={d.gradient} fill={tile('amber')} />
          <Label x={635} y={519} lines={['Composition Root']} className={d.onGradient} />
        </g>

        {/* Legend */}
        <g>
          <line x1="8" y1="482" x2="42" y2="482" className={d.line} markerEnd={ref} />
          <text x="52" y="487" fontSize="16" className={d.muted}>
            references
          </text>
          <line x1="8" y1="512" x2="42" y2="512" className={clsx(d.line, d.dashed)} markerEnd={impl} />
          <text x="52" y="517" fontSize="16" className={d.muted}>
            implements /
          </text>
          <text x="52" y="535" fontSize="16" className={d.muted}>
            derives from
          </text>
          <line x1="8" y1="560" x2="42" y2="560" className={d.line} markerEnd={io} markerStart={ioStart} />
          <text x="52" y="565" fontSize="16" className={d.muted}>
            I/O call at runtime
          </text>
        </g>
      </svg>
      <p className={d.caption}>
        All four categories may depend on the frameworks and libraries. Those arrows are left out to
        keep the number of arrows manageable.
      </p>
    </DiagramFrame>
  );
}
