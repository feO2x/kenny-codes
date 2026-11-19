import React, {type CSSProperties, type ReactNode, useEffect, useId, useRef, useState} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export {styles as diagram};

interface ScrollState {
  overflows: boolean;
  atStart: boolean;
  atEnd: boolean;
}

/** Whether the element's content is wider than the element, and where it is scrolled to. */
function useScrollState(ref: React.RefObject<HTMLElement | null>): ScrollState {
  const [state, setState] = useState<ScrollState>({overflows: false, atStart: true, atEnd: true});
  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const update = () => {
      const max = element.scrollWidth - element.clientWidth;
      const next = {overflows: max > 1, atStart: element.scrollLeft <= 1, atEnd: element.scrollLeft >= max - 1};
      setState((prev) =>
        prev.overflows === next.overflows && prev.atStart === next.atStart && prev.atEnd === next.atEnd ? prev : next,
      );
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(element);
    element.addEventListener('scroll', update, {passive: true});
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [ref]);
  return state;
}

/**
 * The card a docs diagram sits on. Wide SVG diagrams pass `minWidth`, so their text stays
 * legible in the narrow docs column; the card then scrolls sideways, shows a fade and a
 * scrollbar at the cut edge, and only while it scrolls is it a named, focusable region.
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
  const {overflows, atStart, atEnd} = useScrollState(scrollRef);
  return (
    <div className={styles.frame}>
      {minWidth ? (
        <div
          ref={scrollRef}
          className={clsx(
            styles.scroll,
            overflows && styles.overflowing,
            atStart && styles.atStart,
            atEnd && styles.atEnd,
          )}
          style={{'--diagram-min-width': `${minWidth}px`} as CSSProperties}
          {...(overflows ? {role: 'region', 'aria-label': `${label}, scrolls sideways`, tabIndex: 0} : {})}>
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
const tiles = {
  brand: ['var(--kc-mint)', 'var(--kc-blue)'],
  /** The brand gradient for outlines, darker in light mode. */
  brandLine: ['var(--kc-brand-line-from)', 'var(--kc-brand-line-to)'],
  blue: ['var(--kc-blue-from)', 'var(--kc-blue)'],
  violet: ['var(--kc-violet-from)', 'var(--kc-violet)'],
  magenta: ['var(--kc-magenta-from)', 'var(--kc-magenta)'],
  amber: ['var(--kc-amber-from)', 'var(--kc-amber)'],
} as const;

export type Tile = keyof typeof tiles;

/** The matching mark colour for lines, arrowheads and labels; set as `--mark` on a group. */
const marks: Record<Tile, string> = {
  brand: 'var(--kc-mark-mint)',
  brandLine: 'var(--kc-mark-mint)',
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
