import React, {type CSSProperties, type ReactNode, useId} from 'react';
import clsx from 'clsx';
import styles from './styles.module.css';

export {styles as diagram};

/**
 * The card a docs diagram sits on. Wide SVG diagrams pass `minWidth`, so their text stays
 * legible on phones; the card then scrolls sideways and can be scrolled with the keyboard.
 */
export function DiagramFrame({
  children,
  minWidth,
  label,
  className,
}: {
  children: ReactNode;
  minWidth?: number;
  /** Names the scrollable region for keyboard and screen reader users. */
  label?: string;
  className?: string;
}): ReactNode {
  return (
    <div className={clsx(styles.frame, className)}>
      {minWidth ? (
        <div
          className={styles.scroll}
          style={{'--diagram-min-width': `${minWidth}px`} as CSSProperties}
          role="region"
          aria-label={label}
          tabIndex={0}>
          {children}
        </div>
      ) : (
        children
      )}
    </div>
  );
}

/** A unique id for the brand gradient of one diagram, so several diagrams can share a page. */
export function useGradientId(): string {
  return `kc-gradient-${useId().replace(/:/g, '')}`;
}

/** The logo's mint-to-blue gradient as an SVG paint server. */
export function BrandGradient({id}: {id: string}): ReactNode {
  return (
    <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stopColor="#33ffdc" />
      <stop offset="1" stopColor="#3393ff" />
    </linearGradient>
  );
}
