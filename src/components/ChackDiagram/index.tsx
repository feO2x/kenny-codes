import React, {type CSSProperties, type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame, TileGradients, diagram as d, markStyle, tileUrl, useDiagramId, type Tile} from '../Diagram';

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

/** A label centred on (x, y), one tspan per line. */
function Label({x, y, lines, size = 18, className}: {x: number; y: number; lines: string[]; size?: number; className?: string}): ReactNode {
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
    active(part) ? {className: d.gradient, fill: tileUrl(prefix, partTile[part])} : {className: d.box};
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
    <DiagramFrame minWidth={700} label="CHACK diagram">
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
          {tones.map((t) => (
            <Markers key={t} prefix={prefix} tone={t} />
          ))}
        </defs>

        {/* Process boundary - integration tests sit over its right edge; unit tests stay
            inside, while E2E tests drive the system under test from another process. */}
        <rect x="250" y="58" width="686" height="512" rx="14" className={d.boundary} />
        <rect x="503" y="44" width="180" height="28" rx="14" className={d.chip} />
        <text x="593" y="64.5" textAnchor="middle" fontSize="18" className={clsx(d.muted, d.semibold)}>
          Process boundary
        </text>

        {/* Frameworks and libraries */}
        <rect x="268" y="94" width="650" height="94" rx="10" className={d.quiet} />
        <text x="593" y="123" textAnchor="middle" fontSize="19" className={d.strong}>
          Frameworks &amp; Libraries
        </text>
        <text x="593" y="150" textAnchor="middle" fontSize="18" className={d.muted}>
          Base Class Library, HTTP Server Frameworks, Data Access,
        </text>
        <text x="593" y="173" textAnchor="middle" fontSize="18" className={d.muted}>
          Validation Frameworks, Test Frameworks, …
        </text>

        {/* Third-party systems */}
        <rect x="4" y="198" width="128" height="244" rx="10" className={d.box} />
        <Label x={68} y={228} lines={['Third-Party', 'Systems']} />
        {['Databases', 'Web Services', 'Message Brokers'].map((name, index) => (
          <g key={name}>
            <rect x="12" y={260 + index * 58} width="112" height="50" rx="8" className={d.inner} />
            <Label x={68} y={285 + index * 58} lines={name === 'Databases' ? [name] : name.split(' ')} className={d.regular} />
          </g>
        ))}

        {/* Runtime I/O between third-party systems and humble objects */}
        <line x1="134" y1="328" x2="181" y2="328" className={d.line} style={hoIo.style} markerEnd={hoIo.io} markerStart={hoIo.ioStart} />

        {/* Implements / derives from */}
        <line x1="315" y1="328" x2="356" y2="328" className={clsx(d.line, d.dashed)} style={hoImpl.style} markerEnd={hoImpl.impl} />
        <path d="M 808 420 H 429 V 358" className={clsx(d.line, d.dashed)} style={tdImpl.style} markerEnd={tdImpl.impl} />

        {/* References */}
        <line x1="540" y1="328" x2="502" y2="328" className={d.line} style={coreRef.style} markerEnd={coreRef.ref} />
        <line x1="808" y1="311" x2="732" y2="311" className={d.line} style={unitRef.style} markerEnd={unitRef.ref} />
        <line x1="852" y1="350" x2="852" y2="380" className={d.line} style={doubleRef.style} markerEnd={doubleRef.ref} />
        {/* Integration and E2E tests share references to the same collaborators. */}
        <g style={broadToHumble.style}>
          <path d="M 924 272 V 200" className={d.line} />
          <path d="M 1000 272 V 200 H 280 V 288" className={d.line} markerEnd={broadToHumble.ref} />
        </g>
        <g style={broadToThirdParty.style}>
          <path d="M 948 272 V 30" className={d.line} />
          <path d="M 1032 272 V 30 H 68 V 196" className={d.line} markerEnd={broadToThirdParty.ref} />
        </g>
        <g style={broadToRoot.style}>
          <path d="M 924 458 V 519" className={d.line} />
          <path d="M 1016 458 V 519 H 732" className={d.line} markerEnd={broadToRoot.ref} />
        </g>
        <line x1="645" y1="488" x2="645" y2="390" className={d.line} style={rootToCore.style} markerEnd={rootToCore.ref} />
        <path d="M 540 519 H 280 V 368" className={d.line} style={rootToHumble.style} markerEnd={rootToHumble.ref} />

        {/* Humble objects, on the process boundary */}
        <rect x="185" y="290" width="130" height="76" rx="10" {...box('humble-objects')} />
        <Label x={250} y={328} lines={['Humble', 'Objects']} className={onBox('humble-objects')} />

        {/* I/O abstractions belong to the Core: a tint with the Core's gradient outline. */}
        <rect
          x="358"
          y="300"
          width="142"
          height="56"
          rx="10"
          {...(active('core') ? {className: d.soft, stroke: tileUrl(prefix, 'brand')} : {className: d.box})}
        />
        <Label x={429} y={328} lines={['I/O', 'Abstractions']} />

        {/* Core */}
        <rect x="540" y="268" width="190" height="120" rx="12" {...box('core')} />
        <Label x={635} y={328} lines={['Core']} size={26} className={onBox('core')} />

        {/* Automated tests - the group straddles the process boundary */}
        <g style={active('automated-tests') ? markStyle('magenta') : undefined}>
          <rect x="790" y="250" width="290" height="230" rx="14" className={d.group} />
          {/* Above the group, left of the integration test connectors at x=924. */}
          <text x="792" y="222" fontSize="18" className={clsx(active('automated-tests') ? d.markText : undefined, d.strong)}>
            <tspan x="792">Automated</tspan>
            <tspan x="792" dy="21">
              Tests
            </tspan>
          </text>
          <rect x="808" y="272" width="88" height="78" rx="10" {...box('automated-tests')} />
          <Label x={852} y={311} lines={['Unit', 'Tests']} className={onBox('automated-tests')} />
          {/* Test doubles implement the Core's abstractions: a lighter tint of the tests' colour. */}
          <rect x="808" y="382" width="88" height="76" rx="10" className={active('automated-tests') ? d.tint : d.box} />
          <Label x={852} y={420} lines={['Test', 'Doubles']} />
          <rect x="912" y="272" width="48" height="186" rx="10" {...box('automated-tests')} />
          <text transform="translate(936 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fontSize="18" className={clsx(d.strong, onBox('automated-tests'))}>
            Integration Tests
          </text>
          <rect x="984" y="272" width="64" height="186" rx="10" {...box('automated-tests')} />
          <text transform="translate(1016 365) rotate(-90)" textAnchor="middle" dominantBaseline="middle" fontSize="18" className={clsx(d.strong, onBox('automated-tests'))}>
            E2E Tests
          </text>
        </g>

        {/* Composition root */}
        <rect x="540" y="488" width="190" height="62" rx="10" {...box('composition-root')} />
        <Label x={635} y={519} lines={['Composition Root']} className={onBox('composition-root')} />

        {/* Legend */}
        <line x1="8" y1="476" x2="42" y2="476" className={d.line} markerEnd={legend.ref} />
        <text x="52" y="482" fontSize="18" className={d.muted}>
          references
        </text>
        <line x1="8" y1="506" x2="42" y2="506" className={clsx(d.line, d.dashed)} markerEnd={legend.impl} />
        <text x="52" y="512" fontSize="18" className={d.muted}>
          <tspan x="52">implements /</tspan>
          <tspan x="52" dy="21">
            derives from
          </tspan>
        </text>
        <line x1="8" y1="560" x2="42" y2="560" className={d.line} markerEnd={legend.io} markerStart={legend.ioStart} />
        <text x="52" y="566" fontSize="18" className={d.muted}>
          I/O call at runtime
        </text>
      </svg>
      <p className={d.caption}>
        All four categories may depend on the frameworks and libraries. Those arrows are left out to
        keep the number of arrows manageable.
      </p>
    </DiagramFrame>
  );
}
