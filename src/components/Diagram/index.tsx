import React, {type CSSProperties, type ReactNode, useEffect, useId, useRef, useState} from 'react';
import styles from './styles.module.css';

export {styles as diagram};

/** True while the element's content is wider than the element itself. */
function useOverflows(ref: React.RefObject<HTMLElement | null>): boolean {
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => setOverflows(element.scrollWidth > element.clientWidth + 1);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref]);
  return overflows;
}

/**
 * The card a docs diagram sits on. Wide SVG diagrams pass `minWidth`, so their text stays
 * legible in the narrow docs column; the card then scrolls sideways, and only while it does is
 * it a named, focusable region that keyboard users can scroll.
 */
export function DiagramFrame({
  children,
  minWidth,
  label,
}: {
  children: ReactNode;
  minWidth?: number;
  /** Names the scrollable region for keyboard and screen reader users. */
  label?: string;
}): ReactNode {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollable = useOverflows(scrollRef);
  return (
    <div className={styles.frame}>
      {minWidth ? (
        <div
          ref={scrollRef}
          className={styles.scroll}
          style={{'--diagram-min-width': `${minWidth}px`} as CSSProperties}
          {...(scrollable ? {role: 'region', 'aria-label': `${label}, scrolls sideways`, tabIndex: 0} : {})}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** A unique id prefix for one diagram's gradient, markers, and title. */
export function useDiagramId(): string {
  return `kc-diagram-${useId().replace(/:/g, '')}`;
}

/** The diagram palette: the brand gradient plus four neon tiles (tokens in custom.css). */
export const tiles = {
  brand: ['var(--kc-mint)', 'var(--kc-blue)'],
  blue: ['var(--kc-blue-from)', 'var(--kc-blue)'],
  violet: ['var(--kc-violet-from)', 'var(--kc-violet)'],
  magenta: ['var(--kc-magenta-from)', 'var(--kc-magenta)'],
  amber: ['var(--kc-amber-from)', 'var(--kc-amber)'],
} as const;

export type Tile = keyof typeof tiles;

/** The matching mark colour for lines, arrowheads and labels; set as `--mark` on a group. */
export const marks: Record<Tile, string> = {
  brand: 'var(--kc-mark-mint)',
  blue: 'var(--kc-mark-blue)',
  violet: 'var(--kc-mark-violet)',
  magenta: 'var(--kc-mark-magenta)',
  amber: 'var(--kc-mark-amber)',
};

export const markStyle = (tile: Tile): CSSProperties => ({'--mark': marks[tile]}) as CSSProperties;

/** SVG paint servers for every tile, with ids `${prefix}-${tile}`. */
export function TileGradients({prefix}: {prefix: string}): ReactNode {
  return (
    <>
      {(Object.keys(tiles) as Tile[]).map((tile) => (
        <linearGradient key={tile} id={`${prefix}-${tile}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{stopColor: tiles[tile][0]}} />
          <stop offset="1" style={{stopColor: tiles[tile][1]}} />
        </linearGradient>
      ))}
    </>
  );
}

/** `fill` or `stroke` value for a tile gradient of one diagram. */
export const tileUrl = (prefix: string, tile: Tile): string => `url(#${prefix}-${tile})`;
