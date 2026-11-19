import { useId, useState } from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

interface Measurement {
  label: string;
  /** Duration in nanoseconds, from the benchmark chart this component replaced. */
  nanoseconds: number;
  kind: 'in-memory' | 'database';
}

const measurements: Measurement[] = [
  { label: 'Static method', nanoseconds: 0.0082, kind: 'in-memory' },
  { label: 'Instance method', nanoseconds: 0.0855, kind: 'in-memory' },
  { label: 'Call via interface', nanoseconds: 0.4322, kind: 'in-memory' },
  { label: 'Call via overridden method', nanoseconds: 0.3243, kind: 'in-memory' },
  { label: 'Call via delegate', nanoseconds: 0.6514, kind: 'in-memory' },
  { label: 'New struct', nanoseconds: 0.0052, kind: 'in-memory' },
  { label: 'New class', nanoseconds: 2.9059, kind: 'in-memory' },
  { label: 'Throw and catch exception', nanoseconds: 3_540, kind: 'in-memory' },
  { label: 'Lock', nanoseconds: 4.5182, kind: 'in-memory' },
  { label: 'Thread pool', nanoseconds: 1_307.2671, kind: 'in-memory' },
  { label: 'New thread', nanoseconds: 85_300.6974, kind: 'in-memory' },
  { label: 'List: 100 strings Contains', nanoseconds: 265.122, kind: 'in-memory' },
  { label: 'List: 1,000 strings Contains', nanoseconds: 2_712.136, kind: 'in-memory' },
  { label: 'Dictionary: 100 strings ContainsKey', nanoseconds: 8.809, kind: 'in-memory' },
  { label: 'Dictionary: 1,000 strings ContainsKey', nanoseconds: 8.377, kind: 'in-memory' },
  { label: 'Load document from RavenDB (same computer)', nanoseconds: 194_500, kind: 'database' },
  { label: 'Load entity from MS SQL (same computer)', nanoseconds: 245_100, kind: 'database' },
  { label: 'Load entity from Oracle (VPN)', nanoseconds: 20_300_000, kind: 'database' },
];

const MIN_EXPONENT = -3;
const MAX_EXPONENT = 8;
const LINEAR_MAX = 25_000_000;
const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 });

const logTickLabels: Record<number, string> = {
  [-3]: '0.001 ns',
  0: '1 ns',
  3: '1 µs',
  6: '1 ms',
  8: '100 ms',
};
const logTicks = Array.from({ length: MAX_EXPONENT - MIN_EXPONENT + 1 }, (_, index) => {
  const exponent = MIN_EXPONENT + index;
  return { value: 10 ** exponent, label: logTickLabels[exponent] };
});
const linearTicks = Array.from({ length: 6 }, (_, index) => ({
  value: index * 5_000_000,
  label: index === 0 ? '0' : `${index * 5} ms`,
}));

export default function IoCostChart() {
  const [scale, setScale] = useState<'logarithmic' | 'linear'>('logarithmic');
  const id = useId();
  const isLogarithmic = scale === 'logarithmic';
  const ticks = isLogarithmic ? logTicks : linearTicks;
  const positionOf = (nanoseconds: number) => 100 * (isLogarithmic
    ? (Math.log10(nanoseconds) - MIN_EXPONENT) / (MAX_EXPONENT - MIN_EXPONENT)
    : nanoseconds / LINEAR_MAX);
  const scaleDescription = isLogarithmic
    ? 'Logarithmic scale: each grid step is 10× longer. The baseline is 0.001 ns.'
    : 'Linear scale: the axis starts at zero; each grid step is 5 ms. The fastest bars are too short to see at this scale; their exact values remain beside the operation names.';

  return (
    <figure className={styles.figure}>
      <div className={styles.toolbar}>
        <strong id={`${id}-title`} className={styles.title}>Performance of everyday things</strong>
        <button
          type="button"
          className={styles.scaleButton}
          aria-controls={`${id}-chart`}
          onClick={() => setScale(isLogarithmic ? 'linear' : 'logarithmic')}
        >
          Use {isLogarithmic ? 'linear' : 'logarithmic'} scale
        </button>
      </div>
      <div className={styles.legend}>
        <span><span className={clsx(styles.swatch, styles.inMemory)} />In-memory operations</span>
        <span><span className={clsx(styles.swatch, styles.database)} />Database reads</span>
      </div>
      <p id={`${id}-description`} className={styles.explanation} aria-live="polite">{scaleDescription}</p>
      <div id={`${id}-chart`} className={styles.chart} role="group" aria-labelledby={`${id}-title`} aria-describedby={`${id}-description`}>
        <div className={styles.axisRow} aria-hidden="true">
          <span className={styles.axisTitle}>Duration ({scale})</span>
          <div className={styles.axis}>
            {ticks.map(({ value, label }, index) => label && (
              <span
                key={value}
                className={styles.tickLabel}
                style={{
                  left: `${positionOf(value)}%`,
                  transform: index === 0 ? 'none'
                    : index === ticks.length - 1 || (isLogarithmic && positionOf(value) > 75)
                      ? 'translateX(-100%)' : 'translateX(-50%)',
                }}
              >
                {label}
              </span>
            ))}
          </div>
          <span className={styles.valueHeading}>Value (ns)</span>
        </div>
        <ul className={styles.measurements}>
          {measurements.map((measurement) => {
            return (
              <li key={measurement.label} className={styles.measurement}>
                <span className={styles.operation}>{measurement.label}</span>
                <span className={styles.value}>
                  {numberFormat.format(measurement.nanoseconds)}<span className="kc-sr-only"> nanoseconds</span>
                </span>
                <div className={styles.track} aria-hidden="true">
                  {ticks.map(({ value }) => (
                    <span key={value} className={styles.gridLine} style={{ left: `${positionOf(value)}%` }} />
                  ))}
                  <div
                    className={clsx(styles.bar, measurement.kind === 'database' ? styles.database : styles.inMemory)}
                    style={{ width: `${positionOf(measurement.nanoseconds)}%` }}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      </div>
      <figcaption className={styles.caption}>
        Values measured on an AMD Ryzen 9 5950X with .NET Core 5.0.3. Timings depend on the operation, hardware, and environment.
      </figcaption>
    </figure>
  );
}
