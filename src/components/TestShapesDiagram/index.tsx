import React, {type ReactNode} from 'react';
import {DiagramFrame, diagram as d, useDiagramId} from '../Diagram';

const layers = [
  {
    name: 'E2E',
    className: d.ramp1,
    pyramid: 'M 270 62 L 347.46 196 H 192.54 Z',
    diamond: 'M 750 62 L 839.04 176.49 H 660.96 Z',
    labels: [160, 147],
  },
  {
    name: 'Integration',
    className: d.ramp2,
    pyramid: 'M 192.54 196 H 347.46 L 406.42 298 H 133.58 Z',
    diamond: 'M 660.96 176.49 H 839.04 L 884.55 235 L 838.38 294.36 H 661.62 L 615.45 235 Z',
    labels: [260, 244],
  },
  {
    name: 'Unit',
    className: d.ramp3,
    pyramid: 'M 133.58 298 H 406.42 L 470 408 H 70 Z',
    diamond: 'M 661.62 294.36 H 838.38 L 750 408 Z',
    labels: [360, 342],
  },
];

/** The test pyramid next to the test diamond, both the same height. */
export default function TestShapesDiagram(): ReactNode {
  const titleId = `${useDiagramId()}-title`;
  return (
    <DiagramFrame>
      <svg
        viewBox="0 36 960 448"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby={titleId}
        className={d.svg}
        style={{maxWidth: 760}}>
        <title id={titleId}>
          Test pyramid with a broad Unit base, a narrower Integration layer, and an E2E tip,
          compared with a test diamond whose widest layer is Integration, narrowing toward E2E
          above and Unit below.
        </title>
        {layers.map(({name, className, pyramid, diamond}) => (
          <g key={name} className={className}>
            <path d={pyramid} />
            <path d={diamond} />
          </g>
        ))}
        {/* Gaps between the layers, in the card colour */}
        <g className={d.separator}>
          <path d="M 192.54 196 H 347.46 M 133.58 298 H 406.42" />
          <path d="M 660.96 176.49 H 839.04 M 661.62 294.36 H 838.38" />
        </g>
        {layers.map(({name, labels: [pyramidY, diamondY]}) => (
          <g key={name} fontSize="30" textAnchor="middle" className={d.strong}>
            <text x="270" y={pyramidY} className={d.onRamp}>
              {name}
            </text>
            <text x="750" y={diamondY} className={d.onRamp}>
              {name}
            </text>
          </g>
        ))}
        <g fontSize="30" textAnchor="middle">
          <text x="270" y="466" className={d.strong}>
            Test Pyramid
          </text>
          <text x="750" y="466" className={d.strong}>
            Test Diamond
          </text>
        </g>
      </svg>
    </DiagramFrame>
  );
}
