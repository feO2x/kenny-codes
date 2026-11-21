import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame, TileGradients, brandEdge, diagram as d, markStyle, tileUrl, useDiagramId, type Tile} from '../Diagram';

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

/** Each category's colour; the Core shares the brand gradient with the logo. */
const partTile: Record<ChackPart, Tile> = {
  core: 'brand',
  'humble-objects': 'violet',
  'automated-tests': 'magenta',
  'composition-root': 'amber',
};

/*
 * Layout anchors in viewBox units. Boxes and the connectors that meet them derive their
 * coordinates from these, so moving a row keeps the arrows attached.
 */
/** Centre line of the Humble Objects, the I/O Abstractions, the Core, and the runtime I/O call. */
const mainY = 420;
/** The broad tests' route to the Humble Objects, below Frameworks & Libraries. */
const routeY = 250;
/** Centre line of the Composition Root and the broad tests' route to it. */
const rootY = 662;
/** Test cards: unit tests and test doubles stack between the tops and bottoms of the broad tests. */
const testTop = 356;
const testBottom = 574;
const testCardHeight = 82;
const unitY = testTop + testCardHeight / 2;
const doublesTop = testBottom - testCardHeight;
const doublesY = doublesTop + testCardHeight / 2;
/** Third-party systems: the middle card is centred on the runtime I/O call. */
const thirdPartyX = 4;
const thirdPartyWidth = 144;
const thirdPartyCenterX = thirdPartyX + thirdPartyWidth / 2;
const thirdPartyCardHeight = 66;
const thirdPartyCardStep = 76;
const thirdPartyCardTop = mainY - thirdPartyCardStep - thirdPartyCardHeight / 2;
const thirdPartyTop = thirdPartyCardTop - 73;
const thirdPartyBottom = thirdPartyCardTop + 2 * thirdPartyCardStep + thirdPartyCardHeight + 12;
/** Half the gap that marks where one connector only crosses another. */
const crossingGap = 9;

/** A label centred on (x, y), one tspan per line. */
function Label({x, y, lines, size = 20, className}: {x: number; y: number; lines: string[]; size?: number; className?: string}): ReactNode {
  const lineHeight = size * 1.2;
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

/** Arrowheads for one colour; markers do not inherit the colour of the line that uses them. */
function Markers({prefix, tone}: {prefix: string; tone: Tile | 'muted'}): ReactNode {
  const style = tone === 'muted' ? undefined : markStyle(tone);
  const id = (name: string) => `${prefix}-${tone}-${name}`;
  return (
    <>
      {/* Open arrowhead: "references" */}
      <marker id={id('ref')} markerWidth="9" markerHeight="7" refX="8.5" refY="3.5" orient="auto" style={style}>
        <path d="M 0.6 0.6 L 8.4 3.5 L 0.6 6.4" className={d.line} style={{strokeWidth: 0.9}} />
      </marker>
      {/* Hollow triangle: "implements / derives from" */}
      <marker id={id('impl')} markerWidth="9" markerHeight="8" refX="8.6" refY="4" orient="auto" style={style}>
        <polygon points="0.5 0.6, 8.5 4, 0.5 7.4" className={d.headHollow} style={{strokeWidth: 0.9}} />
      </marker>
      {/* Solid heads: runtime I/O */}
      <marker id={id('io')} markerWidth="8" markerHeight="6" refX="7.5" refY="3" orient="auto" style={style}>
        <polygon points="0 0, 8 3, 0 6" className={d.head} />
      </marker>
      <marker id={id('io-start')} markerWidth="8" markerHeight="6" refX="0.5" refY="3" orient="auto" style={style}>
        <polygon points="8 0, 0 3, 8 6" className={d.head} />
      </marker>
    </>
  );
}

/**
 * On a page about one category, that category and its connectors keep their colour; the rest
 * turns into neutral outlined boxes, still fully readable, instead of fading out.
 */
export default function ChackDiagram({highlight}: ChackDiagramProps): ReactNode {
  // Ids must be unique per diagram, because a page may show several.
  const prefix = useDiagramId();
  const titleId = `${prefix}-title`;
  const active = (part: ChackPart) => !highlight || highlight === part;
  /** Tile fill for an active category, a neutral box otherwise. */
  const box = (part: ChackPart) =>
    active(part)
      ? {
          className: d.gradient,
          fill: tileUrl(prefix, partTile[part]),
          style: part === 'core' ? brandEdge(prefix) : markStyle(partTile[part]),
        }
      : {className: d.box};
  const onBox = (part: ChackPart) => (active(part) ? d.onGradient : undefined);
  /** Connectors between `parts` take the highlighted category's colour. */
  const tone = (...parts: ChackPart[]): Tile | 'muted' =>
    highlight && parts.includes(highlight) ? partTile[highlight] : 'muted';
  const connector = (...parts: ChackPart[]) => {
    const t = tone(...parts);
    const marker = (name: string) => `url(#${prefix}-${t}-${name})`;
    return {
      style: t === 'muted' ? undefined : {...markStyle(t), '--line-width': 3},
      ref: marker('ref'),
      impl: marker('impl'),
      io: marker('io'),
      ioStart: marker('io-start'),
    };
  };
  const tones: (Tile | 'muted')[] = ['muted', ...(highlight ? [partTile[highlight]] : [])];
  const legend = connector();

  const hoIo = connector('humble-objects');
  const hoImpl = connector('humble-objects', 'core');
  const tdImpl = connector('automated-tests', 'core');
  const coreRef = connector('core');
  const unitRef = connector('automated-tests', 'core');
  const doubleRef = connector('automated-tests');
  const broadToHumble = connector('automated-tests', 'humble-objects');
  const broadToThirdParty = connector('automated-tests');
  const broadToRoot = connector('automated-tests', 'composition-root');
  const rootToCore = connector('composition-root', 'core');
  const rootToHumble = connector('composition-root', 'humble-objects');

  return (
    <DiagramFrame
      minWidth={700}
      label="CHACK diagram"
      caption="All four categories may depend on the frameworks and libraries. Those arrows are left out to keep the number of arrows manageable.">
      <svg
        viewBox="0 0 1192 734"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={titleId}
        className={d.svg}
        style={{maxWidth: 1192, '--line-width': 2.25} as CSSProperties}>
        <title id={titleId}>{descriptions[highlight ?? 'default']}</title>

        <defs>
          <TileGradients prefix={prefix} />
          {tones.map((t) => (
            <Markers key={t} prefix={prefix} tone={t} />
          ))}
        </defs>

        {/* Process boundary - integration tests sit over its right edge; unit tests stay
            inside, while E2E tests drive the system under test from another process. */}
        <rect x="270" y="70" width="776" height="650" rx="14" className={d.boundary} />
        <rect x="568" y="56" width="180" height="28" rx="14" className={d.chip} />
        <text x="658" y="76.5" textAnchor="middle" fontSize="20" className={clsx(d.muted, d.semibold)}>
          Process boundary
        </text>

        {/* Frameworks and libraries */}
        <rect x="290" y="112" width="736" height="98" rx="10" className={d.quiet} />
        <text x="658" y="140" textAnchor="middle" fontSize="21" className={d.strong}>
          Frameworks &amp; Libraries
        </text>
        <text x="658" y="168" textAnchor="middle" fontSize="20" className={d.muted}>
          Base Class Library, HTTP Server Frameworks, Data Access,
        </text>
        <text x="658" y="193" textAnchor="middle" fontSize="20" className={d.muted}>
          Validation Frameworks, Test Frameworks, …
        </text>

        {/* Third-party systems */}
        <rect x={thirdPartyX} y={thirdPartyTop} width={thirdPartyWidth} height={thirdPartyBottom - thirdPartyTop} rx="10" className={d.box} />
        <Label x={thirdPartyCenterX} y={thirdPartyTop + 34} lines={['Third-Party', 'Systems']} />
        {['Databases', 'Web Services', 'Message Brokers'].map((name, index) => {
          const top = thirdPartyCardTop + index * thirdPartyCardStep;
          return (
            <g key={name}>
              <rect x={thirdPartyX + 10} y={top} width={thirdPartyWidth - 20} height={thirdPartyCardHeight} rx="8" className={d.inner} />
              <Label x={thirdPartyCenterX} y={top + thirdPartyCardHeight / 2} lines={name === 'Databases' ? [name] : name.split(' ')} className={d.regular} />
            </g>
          );
        })}

        {/* Runtime I/O between third-party systems and humble objects; the solid heads touch both boxes. */}
        <line x1={thirdPartyX + thirdPartyWidth + 1} y1={mainY} x2="199" y2={mainY} className={d.line} style={hoIo.style} markerEnd={hoIo.io} markerStart={hoIo.ioStart} />

        {/* Implements / derives from */}
        <line x1="340" y1={mainY} x2="402" y2={mainY} className={clsx(d.line, d.dashed)} style={hoImpl.style} markerEnd={hoImpl.impl} />
        <path d={`M 900 ${doublesY} H 479 V ${mainY + 34}`} className={clsx(d.line, d.dashed)} style={tdImpl.style} markerEnd={tdImpl.impl} />

        {/* References */}
        <line x1="610" y1={mainY} x2="556" y2={mainY} className={d.line} style={coreRef.style} markerEnd={coreRef.ref} />
        <line x1="900" y1={unitY} x2="822" y2={unitY} className={d.line} style={unitRef.style} markerEnd={unitRef.ref} />
        <line x1="948" y1={testTop + testCardHeight} x2="948" y2={doublesTop - 2} className={d.line} style={doubleRef.style} markerEnd={doubleRef.ref} />
        {/* Integration and E2E tests share references to the same collaborators. */}
        {/* Dots mark where two connectors join; a gap marks where one only crosses another. */}
        <g style={broadToHumble.style}>
          <path d={`M 1034 ${testTop} V ${routeY}`} className={d.line} />
          <path d={`M 1116 ${testTop} V ${routeY} H 300 V ${mainY - 42}`} className={d.line} markerEnd={broadToHumble.ref} />
          <circle cx="1034" cy={routeY} r="4.5" className={d.head} />
        </g>
        <g style={broadToThirdParty.style}>
          <path d={`M 1058 ${testTop} V ${routeY + crossingGap} M 1058 ${routeY - crossingGap} V 30`} className={d.line} />
          <path d={`M 1152 ${testTop} V 30 H ${thirdPartyCenterX} V ${thirdPartyTop - 2}`} className={d.line} markerEnd={broadToThirdParty.ref} />
          <circle cx="1058" cy="30" r="4.5" className={d.head} />
        </g>
        <g style={broadToRoot.style}>
          <path d={`M 1034 ${testBottom} V ${rootY}`} className={d.line} />
          <path d={`M 1134 ${testBottom} V ${rootY} H 822`} className={d.line} markerEnd={broadToRoot.ref} />
          <circle cx="1034" cy={rootY} r="4.5" className={d.head} />
        </g>
        {/* Gap where the test doubles' implements arrow crosses. */}
        <path
          d={`M 715 ${rootY - 32} V ${doublesY + crossingGap} M 715 ${doublesY - crossingGap} V ${mainY + 72}`}
          className={d.line}
          style={rootToCore.style}
          markerEnd={rootToCore.ref}
        />
        <path d={`M 610 ${rootY} H 300 V ${mainY + 42}`} className={d.line} style={rootToHumble.style} markerEnd={rootToHumble.ref} />

        {/* Humble objects, on the process boundary */}
        <rect x="200" y={mainY - 40} width="140" height="80" rx="10" {...box('humble-objects')} />
        <Label x={270} y={mainY} lines={['Humble', 'Objects']} className={onBox('humble-objects')} />

        {/* I/O abstractions belong to the Core: a tint with the Core's gradient outline. */}
        <rect
          x="404"
          y={mainY - 32}
          width="150"
          height="64"
          rx="10"
          {...(active('core') ? {className: d.soft, stroke: tileUrl(prefix, 'brandLine')} : {className: d.box})}
        />
        <Label x={479} y={mainY} lines={['I/O', 'Abstractions']} />

        {/* Core */}
        <rect x="610" y={mainY - 70} width="210" height="140" rx="12" {...box('core')} />
        <Label x={715} y={mainY} lines={['Core']} size={28} className={onBox('core')} />

        {/* Automated tests - the group straddles the process boundary */}
        <g style={active('automated-tests') ? markStyle('magenta') : undefined}>
          <rect x="880" y={testTop - 16} width="306" height={testBottom - testTop + 32} rx="14" className={d.group} />
          {/* Above the group, left of the integration test connectors at x=1034. */}
          <text x="882" y="296" fontSize="20" className={clsx(active('automated-tests') && d.markText, highlight === 'automated-tests' && d.markActive, d.strong)}>
            <tspan x="882">Automated</tspan>
            <tspan x="882" dy="23">
              Tests
            </tspan>
          </text>
          <rect x="900" y={testTop} width="96" height={testCardHeight} rx="10" {...box('automated-tests')} />
          <Label x={948} y={unitY} lines={['Unit', 'Tests']} className={onBox('automated-tests')} />
          {/* Test doubles implement the Core's abstractions: a lighter tint of the tests' colour. */}
          <rect x="900" y={doublesTop} width="96" height={testCardHeight} rx="10" className={active('automated-tests') ? d.tint : d.box} />
          <Label x={948} y={doublesY} lines={['Test', 'Doubles']} />
          <rect x="1020" y={testTop} width="52" height={testBottom - testTop} rx="10" {...box('automated-tests')} />
          <text transform={`translate(1046 ${(testTop + testBottom) / 2}) rotate(-90)`} textAnchor="middle" dominantBaseline="middle" fontSize="20" className={clsx(d.strong, onBox('automated-tests'))}>
            Integration Tests
          </text>
          <rect x="1100" y={testTop} width="68" height={testBottom - testTop} rx="10" {...box('automated-tests')} />
          <text transform={`translate(1134 ${(testTop + testBottom) / 2}) rotate(-90)`} textAnchor="middle" dominantBaseline="middle" fontSize="20" className={clsx(d.strong, onBox('automated-tests'))}>
            E2E Tests
          </text>
        </g>

        {/* Composition root */}
        <rect x="610" y={rootY - 32} width="210" height="64" rx="10" {...box('composition-root')} />
        <Label x={715} y={rootY} lines={['Composition Root']} className={onBox('composition-root')} />

        {/* Legend */}
        <line x1="8" y1="608" x2="56" y2="608" className={d.line} markerEnd={legend.ref} />
        <text x="66" y="614" fontSize="20" className={d.muted}>
          references
        </text>
        <line x1="8" y1="642" x2="56" y2="642" className={clsx(d.line, d.dashed)} markerEnd={legend.impl} />
        <text x="66" y="648" fontSize="20" className={d.muted}>
          <tspan x="66">implements /</tspan>
          <tspan x="66" dy="23">
            derives from
          </tspan>
        </text>
        <line x1="8" y1="700" x2="56" y2="700" className={d.line} markerEnd={legend.io} markerStart={legend.ioStart} />
        <text x="66" y="706" fontSize="20" className={d.muted}>
          I/O call at runtime
        </text>
      </svg>
    </DiagramFrame>
  );
}
