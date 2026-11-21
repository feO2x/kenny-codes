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
 * Layout in viewBox units. Boxes are placed on a few anchors, and every connector derives its
 * ends from the boxes it joins, so resizing or moving a box keeps its arrows attached.
 */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}
const right = (b: Box) => b.x + b.width;
const bottom = (b: Box) => b.y + b.height;
const centerX = (b: Box) => b.x + b.width / 2;
const centerY = (b: Box) => b.y + b.height / 2;
/** A box of the given size centred vertically on `cy`. */
const onRow = (x: number, cy: number, width: number, height: number): Box => ({x, y: cy - height / 2, width, height});

/** Centre line of the Humble Objects, the I/O Abstractions, the Core, and the runtime I/O call. */
const mainY = 420;
/** The broad tests' route to the Humble Objects, below Frameworks & Libraries. */
const routeY = 250;
/** The broad tests' route to the third-party systems, above the process boundary. */
const topRouteY = 30;
/** Centre line of the Composition Root and the broad tests' route to it. */
const rootY = 662;

const humble = onRow(200, mainY, 140, 80);
const ioAbstractions = onRow(404, mainY, 150, 64);
const core = onRow(610, mainY, 210, 140);
/** The Composition Root shares the Core's column, so its arrow meets the Core's centre. */
const rootWidth = 210;
const root = onRow(centerX(core) - rootWidth / 2, rootY, rootWidth, 64);

/** Unit tests and test doubles stack between the tops and bottoms of the broad tests. */
const testTop = 356;
const testBottom = 574;
const testCardHeight = 82;
const unitTests: Box = {x: 900, y: testTop, width: 96, height: testCardHeight};
const testDoubles: Box = {x: 900, y: testBottom - testCardHeight, width: 96, height: testCardHeight};
const integrationTests: Box = {x: 1020, y: testTop, width: 52, height: testBottom - testTop};
const e2eTests: Box = {x: 1100, y: testTop, width: 68, height: testBottom - testTop};
const testGroup: Box = {x: unitTests.x - 20, y: testTop - 16, width: right(e2eTests) + 18 - (unitTests.x - 20), height: testBottom - testTop + 32};

/** Third-party systems: the middle card is centred on the runtime I/O call. */
const thirdPartyCardHeight = 66;
const thirdPartyCardStep = 76;
const thirdPartyCardTop = mainY - thirdPartyCardStep - thirdPartyCardHeight / 2;
const thirdParty: Box = {x: 4, y: thirdPartyCardTop - 73, width: 144, height: 73 + 2 * thirdPartyCardStep + thirdPartyCardHeight + 12};

/**
 * The process boundary runs through the middle of the Humble Objects and the integration tests,
 * which sit on it, and leaves room below the Composition Root.
 */
const boundary: Box = {x: centerX(humble), y: 70, width: centerX(integrationTests) - centerX(humble), height: bottom(root) + 26 - 70};
/** Frameworks & Libraries span the top of the process boundary. */
const frameworks: Box = {x: boundary.x + 20, y: boundary.y + 42, width: boundary.width - 40, height: 98};
/** The legend sits below the third-party systems. */
const legendY = bottom(thirdParty) + 67;

/** Vertical lanes of the broad tests' connectors, and the lane into the Humble Objects. */
const lane = {
  integrationShared: centerX(integrationTests) - 12,
  integrationThirdParty: centerX(integrationTests) + 12,
  e2eHumble: centerX(e2eTests) - 18,
  e2eRoot: centerX(e2eTests),
  e2eThirdParty: centerX(e2eTests) + 18,
  /** Right of the process boundary, which crosses the Humble Objects' centre. */
  intoHumble: right(humble) - 40,
};

/**
 * Connectors stop this far short of a box: their heads, like the lines' round caps, reach half a
 * stroke width past the end point, so the painted tip meets the edge.
 */
const inset = 1;
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
      <marker id={id('ref')} markerWidth="9" markerHeight="7" refX="8.35" refY="3.5" orient="auto" style={style}>
        <path d="M 0.6 0.6 L 8.4 3.5 L 0.6 6.4" className={d.line} style={{strokeWidth: 0.9}} />
      </marker>
      {/* Hollow triangle: "implements / derives from" */}
      <marker id={id('impl')} markerWidth="9" markerHeight="8" refX="8.45" refY="4" orient="auto" style={style}>
        <polygon points="0.5 0.6, 8.5 4, 0.5 7.4" className={d.headHollow} style={{strokeWidth: 0.9}} />
      </marker>
      {/* Solid heads: runtime I/O. Short, so that the shaft between two heads stays visible. */}
      <marker id={id('io')} markerWidth="7" markerHeight="6" refX="6.5" refY="3" orient="auto" style={style}>
        <polygon points="0 0, 7 3, 0 6" className={d.head} />
      </marker>
      <marker id={id('io-start')} markerWidth="7" markerHeight="6" refX="0.5" refY="3" orient="auto" style={style}>
        <polygon points="7 0, 0 3, 7 6" className={d.head} />
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
        viewBox={`0 0 1192 ${bottom(boundary) + 14}`}
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
        <rect {...boundary} rx="14" className={d.boundary} />
        <rect x={centerX(boundary) - 90} y={boundary.y - 14} width="180" height="28" rx="14" className={d.chip} />
        <text x={centerX(boundary)} y={boundary.y + 6.5} textAnchor="middle" fontSize="20" className={clsx(d.muted, d.semibold)}>
          Process boundary
        </text>

        {/* Frameworks and libraries */}
        <rect {...frameworks} rx="10" className={d.quiet} />
        <text x={centerX(frameworks)} y={frameworks.y + 28} textAnchor="middle" fontSize="21" className={d.strong}>
          Frameworks &amp; Libraries
        </text>
        <text x={centerX(frameworks)} y={frameworks.y + 56} textAnchor="middle" fontSize="20" className={d.muted}>
          Base Class Library, HTTP Server Frameworks, Data Access,
        </text>
        <text x={centerX(frameworks)} y={frameworks.y + 81} textAnchor="middle" fontSize="20" className={d.muted}>
          Validation Frameworks, Test Frameworks, …
        </text>

        {/* Third-party systems */}
        <rect {...thirdParty} rx="10" className={d.box} />
        <Label x={centerX(thirdParty)} y={thirdParty.y + 34} lines={['Third-Party', 'Systems']} />
        {['Databases', 'Web Services', 'Message Brokers'].map((name, index) => {
          const card: Box = {x: thirdParty.x + 10, y: thirdPartyCardTop + index * thirdPartyCardStep, width: thirdParty.width - 20, height: thirdPartyCardHeight};
          return (
            <g key={name}>
              <rect {...card} rx="8" className={d.inner} />
              <Label x={centerX(card)} y={centerY(card)} lines={name === 'Databases' ? [name] : name.split(' ')} className={d.regular} />
            </g>
          );
        })}

        {/* Runtime I/O between third-party systems and humble objects */}
        <line x1={right(thirdParty) + inset} y1={mainY} x2={humble.x - inset} y2={mainY} className={d.line} style={hoIo.style} markerEnd={hoIo.io} markerStart={hoIo.ioStart} />

        {/* Implements / derives from */}
        <line x1={right(humble)} y1={mainY} x2={ioAbstractions.x - inset} y2={mainY} className={clsx(d.line, d.dashed)} style={hoImpl.style} markerEnd={hoImpl.impl} />
        <path
          d={`M ${testDoubles.x} ${centerY(testDoubles)} H ${centerX(ioAbstractions)} V ${bottom(ioAbstractions) + inset}`}
          className={clsx(d.line, d.dashed)}
          style={tdImpl.style}
          markerEnd={tdImpl.impl}
        />

        {/* References */}
        <line x1={core.x} y1={mainY} x2={right(ioAbstractions) + inset} y2={mainY} className={d.line} style={coreRef.style} markerEnd={coreRef.ref} />
        <line x1={unitTests.x} y1={centerY(unitTests)} x2={right(core) + inset} y2={centerY(unitTests)} className={d.line} style={unitRef.style} markerEnd={unitRef.ref} />
        <line
          x1={centerX(unitTests)}
          y1={bottom(unitTests)}
          x2={centerX(testDoubles)}
          y2={testDoubles.y - inset}
          className={d.line}
          style={doubleRef.style}
          markerEnd={doubleRef.ref}
        />
        {/* Integration and E2E tests share references to the same collaborators. */}
        {/* Dots mark where two connectors join; a gap marks where one only crosses another. */}
        <g style={broadToHumble.style}>
          <path d={`M ${lane.integrationShared} ${testTop} V ${routeY}`} className={d.line} />
          <path d={`M ${lane.e2eHumble} ${testTop} V ${routeY} H ${lane.intoHumble} V ${humble.y - inset}`} className={d.line} markerEnd={broadToHumble.ref} />
          <circle cx={lane.integrationShared} cy={routeY} r="4.5" className={d.head} />
        </g>
        <g style={broadToThirdParty.style}>
          <path
            d={`M ${lane.integrationThirdParty} ${testTop} V ${routeY + crossingGap} M ${lane.integrationThirdParty} ${routeY - crossingGap} V ${topRouteY}`}
            className={d.line}
          />
          <path
            d={`M ${lane.e2eThirdParty} ${testTop} V ${topRouteY} H ${centerX(thirdParty)} V ${thirdParty.y - inset}`}
            className={d.line}
            markerEnd={broadToThirdParty.ref}
          />
          <circle cx={lane.integrationThirdParty} cy={topRouteY} r="4.5" className={d.head} />
        </g>
        <g style={broadToRoot.style}>
          <path d={`M ${lane.integrationShared} ${testBottom} V ${rootY}`} className={d.line} />
          <path d={`M ${lane.e2eRoot} ${testBottom} V ${rootY} H ${right(root) + inset}`} className={d.line} markerEnd={broadToRoot.ref} />
          <circle cx={lane.integrationShared} cy={rootY} r="4.5" className={d.head} />
        </g>
        {/* Gap where the test doubles' implements arrow crosses. */}
        <path
          d={`M ${centerX(root)} ${root.y} V ${centerY(testDoubles) + crossingGap} M ${centerX(root)} ${centerY(testDoubles) - crossingGap} V ${bottom(core) + inset}`}
          className={d.line}
          style={rootToCore.style}
          markerEnd={rootToCore.ref}
        />
        <path d={`M ${root.x} ${rootY} H ${lane.intoHumble} V ${bottom(humble) + inset}`} className={d.line} style={rootToHumble.style} markerEnd={rootToHumble.ref} />

        {/* Humble objects, on the process boundary */}
        <rect {...humble} rx="10" {...box('humble-objects')} />
        <Label x={centerX(humble)} y={mainY} lines={['Humble', 'Objects']} className={onBox('humble-objects')} />

        {/* I/O abstractions belong to the Core: a tint with the Core's gradient outline. */}
        <rect
          {...ioAbstractions}
          rx="10"
          {...(active('core') ? {className: d.soft, stroke: tileUrl(prefix, 'brandLine')} : {className: d.box})}
        />
        <Label x={centerX(ioAbstractions)} y={mainY} lines={['I/O', 'Abstractions']} />

        {/* Core */}
        <rect {...core} rx="12" {...box('core')} />
        <Label x={centerX(core)} y={mainY} lines={['Core']} size={28} className={onBox('core')} />

        {/* Automated tests - the group straddles the process boundary */}
        <g style={active('automated-tests') ? markStyle('magenta') : undefined}>
          <rect {...testGroup} rx="14" className={d.group} />
          {/* Above the group, left of the integration test connectors. */}
          <text
            x={testGroup.x + 2}
            y={testGroup.y - 44}
            fontSize="20"
            className={clsx(active('automated-tests') && d.markText, highlight === 'automated-tests' && d.markActive, d.strong)}>
            <tspan x={testGroup.x + 2}>Automated</tspan>
            <tspan x={testGroup.x + 2} dy="23">
              Tests
            </tspan>
          </text>
          <rect {...unitTests} rx="10" {...box('automated-tests')} />
          <Label x={centerX(unitTests)} y={centerY(unitTests)} lines={['Unit', 'Tests']} className={onBox('automated-tests')} />
          {/* Test doubles implement the Core's abstractions: a lighter tint of the tests' colour. */}
          <rect {...testDoubles} rx="10" className={active('automated-tests') ? d.tint : d.box} />
          <Label x={centerX(testDoubles)} y={centerY(testDoubles)} lines={['Test', 'Doubles']} />
          <rect {...integrationTests} rx="10" {...box('automated-tests')} />
          <text
            transform={`translate(${centerX(integrationTests)} ${centerY(integrationTests)}) rotate(-90)`}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            className={clsx(d.strong, onBox('automated-tests'))}>
            Integration Tests
          </text>
          <rect {...e2eTests} rx="10" {...box('automated-tests')} />
          <text
            transform={`translate(${centerX(e2eTests)} ${centerY(e2eTests)}) rotate(-90)`}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="20"
            className={clsx(d.strong, onBox('automated-tests'))}>
            E2E Tests
          </text>
        </g>

        {/* Composition root */}
        <rect {...root} rx="10" {...box('composition-root')} />
        <Label x={centerX(root)} y={rootY} lines={['Composition Root']} className={onBox('composition-root')} />

        {/* Legend */}
        <line x1="8" y1={legendY} x2="56" y2={legendY} className={d.line} markerEnd={legend.ref} />
        <text x="66" y={legendY + 6} fontSize="20" className={d.muted}>
          references
        </text>
        <line x1="8" y1={legendY + 34} x2="56" y2={legendY + 34} className={clsx(d.line, d.dashed)} markerEnd={legend.impl} />
        <text x="66" y={legendY + 40} fontSize="20" className={d.muted}>
          <tspan x="66">implements /</tspan>
          <tspan x="66" dy="23">
            derives from
          </tspan>
        </text>
        <line x1="8" y1={legendY + 92} x2="56" y2={legendY + 92} className={d.line} markerEnd={legend.io} markerStart={legend.ioStart} />
        <text x="66" y={legendY + 98} fontSize="20" className={d.muted}>
          I/O call at runtime
        </text>
      </svg>
    </DiagramFrame>
  );
}
