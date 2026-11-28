import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {DiagramFrame, diagram as d, useDiagramId} from '../Diagram';
import styles from './styles.module.css';

const layers = [
  {
    name: 'E2E',
    className: styles.e2e,
    pyramid: 'M 270 62 L 347.46 196 H 192.54 Z',
    diamond: 'M 750 62 L 839.04 176.49 H 660.96 Z',
    labels: [160, 147],
  },
  {
    name: 'Integration',
    className: styles.integration,
    pyramid: 'M 192.54 196 H 347.46 L 406.42 298 H 133.58 Z',
    diamond: 'M 660.96 176.49 H 839.04 L 884.55 235 L 838.38 294.36 H 661.62 L 615.45 235 Z',
    labels: [260, 244],
  },
  {
    name: 'Unit',
    className: styles.unit,
    pyramid: 'M 133.58 298 H 406.42 L 470 408 H 70 Z',
    diamond: 'M 661.62 294.36 H 838.38 L 750 408 Z',
    labels: [360, 342],
  },
];

function Shape({kind, viewBox, title, x}: {kind: 'pyramid' | 'diamond'; viewBox: string; title: string; x: number}): ReactNode {
  return (
    <svg viewBox={viewBox} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false" className={d.svg}>
      {layers.map((layer) => (
        <path key={layer.name} d={layer[kind]} className={clsx(d.gradient, layer.className)} />
      ))}
      {/* Gaps between the layers, in the card colour */}
      <path
        className={clsx(d.separator, styles.layerLines)}
        d={kind === 'pyramid' ? 'M 192.54 196 H 347.46 M 133.58 298 H 406.42' : 'M 660.96 176.49 H 839.04 M 661.62 294.36 H 838.38'}
      />
      {layers.map(({name, labels: [pyramidY, diamondY]}) => (
        <text key={name} x={x} y={kind === 'pyramid' ? pyramidY : diamondY} fontSize="30" textAnchor="middle" className={clsx(d.strong, d.onGradient)}>
          {name}
        </text>
      ))}
      <text x={x} y="466" fontSize="30" textAnchor="middle" className={d.strong}>
        {title}
      </text>
    </svg>
  );
}

/** The test pyramid next to the test diamond, both the same height; they stack in narrow columns. */
export default function TestShapesDiagram(): ReactNode {
  const descriptionId = `${useDiagramId()}-description`;
  return (
    <DiagramFrame>
      <div className={styles.shapes} role="img" aria-labelledby={descriptionId}>
        <span id={descriptionId} className="kc-sr-only">
          Test pyramid with a broad Unit base, a narrower Integration layer, and an E2E tip,
          compared with a test diamond whose widest layer is Integration, narrowing toward E2E
          above and Unit below.
        </span>
        <Shape kind="pyramid" viewBox="50 36 440 448" title="Test Pyramid" x={270} />
        <Shape kind="diamond" viewBox="590 36 320 448" title="Test Diamond" x={750} />
      </div>
    </DiagramFrame>
  );
}
