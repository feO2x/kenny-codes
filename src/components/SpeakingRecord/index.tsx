import React, {
  memo,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import type {RecordEvent} from '@site/src/types/event';
import {formatDate, useToday} from '@site/src/utils/dateFormatting';
import {formatPlace} from '../EventRow';
import styles from './styles.module.css';

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

interface SpeakingRecordProps {
  events: ReadonlyArray<RecordEvent>;
  /** Where a year label with past sessions links to, for example an anchor on the events page. */
  yearLink?: (year: number) => string;
  /** Where a year label with only upcoming sessions links to. */
  upcomingLink?: string;
  className?: string;
}

interface RecordSession extends RecordEvent {
  isUpcoming: boolean;
  formattedDate: string;
  venue: string;
  format: string;
}

interface YearColumn {
  year: number;
  delivered: RecordSession[];
  upcoming: RecordSession[];
  /** Delivered sessions bottom-to-top, followed by upcoming sessions on top. */
  sessions: RecordSession[];
}

interface FloatingPopoverPosition {
  kind: 'floating';
  left: number;
  top: number;
  arrowX: number;
  placement: 'top' | 'bottom';
  maxWidth: number;
}

interface InlinePopoverPosition {
  kind: 'inline';
}

interface HiddenPopoverPosition {
  kind: 'hidden';
}

type PopoverLayout = FloatingPopoverPosition | InlinePopoverPosition | HiddenPopoverPosition;

type DetailsOpener = {kind: 'browse'} | {kind: 'square'; permalink: string};
type DetailsOwner = 'browse' | 'touch' | 'keyboard' | 'hover-fallback';

interface DetailsPanelState {
  permalink: string;
  owner: DetailsOwner;
  opener: DetailsOpener;
  autoReveal: boolean;
  focusOnOpen: boolean;
}

interface PendingPointer {
  permalink: string;
  pointerType: string;
  timestamp: number;
}

const POINTER_GESTURE_TTL_MS = 1000;
const HOVER_LEAVE_DELAY_MS = 180;
const MIN_FLOATING_POPOVER_WIDTH = 160;

function getFreshPendingPointer(
  ref: RefObject<PendingPointer | null>,
  permalink: string,
): PendingPointer | null {
  const pending = ref.current;
  if (!pending) return null;
  if (performance.now() - pending.timestamp >= POINTER_GESTURE_TTL_MS) {
    ref.current = null;
    return null;
  }
  return pending.permalink === permalink ? pending : null;
}

function getVisibleViewport(): {
  left: number;
  top: number;
  right: number;
  bottom: number;
} {
  const vv = window.visualViewport;
  if (vv) {
    return {
      left: vv.offsetLeft,
      top: vv.offsetTop,
      right: vv.offsetLeft + vv.width,
      bottom: vv.offsetTop + vv.height,
    };
  }
  return {
    left: 0,
    top: 0,
    right: window.innerWidth,
    bottom: window.innerHeight,
  };
}

function formatVenue(event: RecordEvent): string {
  const place = formatPlace(event.location, event.country);
  return [event.event, place].filter(Boolean).join(' · ');
}

function formatSessionMeta(event: RecordEvent): string {
  return [event.type, event.duration, event.language].filter(Boolean).join(' · ');
}

function compareSessionsAsc(a: RecordEvent, b: RecordEvent): number {
  const dayDiff = a.date.slice(0, 10).localeCompare(b.date.slice(0, 10));
  if (dayDiff !== 0) return dayDiff;
  const titleDiff = a.title.localeCompare(b.title);
  if (titleDiff !== 0) return titleDiff;
  return a.permalink.localeCompare(b.permalink);
}

function buildColumns(events: ReadonlyArray<RecordEvent>, today: string): YearColumn[] {
  const byYear = new Map<number, {delivered: RecordEvent[]; upcoming: RecordEvent[]}>();
  for (const event of events) {
    if (event.cancelled) continue;
    const day = event.date.slice(0, 10);
    const year = Number(day.slice(0, 4));
    const bucket = byYear.get(year) ?? {delivered: [], upcoming: []};
    if (day >= today) bucket.upcoming.push(event);
    else bucket.delivered.push(event);
    byYear.set(year, bucket);
  }
  if (byYear.size === 0) return [];

  const years = [...byYear.keys()];
  const first = Math.min(...years);
  const last = Math.max(...years, Number(today.slice(0, 4)));
  const columns: YearColumn[] = [];

  for (let year = first; year <= last; year++) {
    const bucket = byYear.get(year) ?? {delivered: [], upcoming: []};
    const toSession = (event: RecordEvent, isUpcoming: boolean): RecordSession => ({
      ...event,
      isUpcoming,
      formattedDate: formatDate(event.date),
      venue: formatVenue(event),
      format: formatSessionMeta(event),
    });

    const delivered = [...bucket.delivered]
      .sort(compareSessionsAsc)
      .map((event) => toSession(event, false));
    const upcoming = [...bucket.upcoming]
      .sort(compareSessionsAsc)
      .map((event) => toSession(event, true));

    columns.push({
      year,
      delivered,
      upcoming,
      sessions: [...delivered, ...upcoming],
    });
  }
  return columns;
}

function sessionsLabel(count: number): string {
  return count === 1 ? '1 session' : `${count} sessions`;
}

function isCoarsePointerDevice(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false;
  return window.matchMedia('(hover: none), (pointer: coarse)').matches;
}

function getNavbarBottom(): number {
  return Math.max(0, document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? 0);
}

function revealElementIfObscured(element: HTMLElement): void {
  const rect = element.getBoundingClientRect();
  const vp = getVisibleViewport();
  const visibleTop = Math.max(vp.top, getNavbarBottom());
  const obscuredVertically = rect.bottom > vp.bottom - 12 || rect.top < visibleTop + 8;
  const obscuredHorizontally = rect.right > vp.right - 8 || rect.left < vp.left + 8;
  if (obscuredVertically || obscuredHorizontally) {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const block: ScrollLogicalPosition =
      rect.height > vp.bottom - visibleTop - 16 ? 'start' : 'nearest';
    const inline: ScrollLogicalPosition =
      rect.width > vp.right - vp.left - 16 ? 'start' : 'nearest';
    element.scrollIntoView({
      block,
      inline,
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }
}

function rectsEqual(
  a: {left: number; top: number; width: number; height: number},
  b: DOMRectReadOnly,
): boolean {
  return (
    Math.round(b.left) === a.left &&
    Math.round(b.top) === a.top &&
    Math.round(b.width) === a.width &&
    Math.round(b.height) === a.height
  );
}

function bracketRatioThresholds(ratio: number): number[] {
  const eps = 1e-4;
  const low = Math.max(0, ratio - eps);
  const high = Math.min(1, ratio + eps);
  return [...new Set([0, low, high, 1])].sort((a, b) => a - b);
}

/**
 * Observes position-only shifts of an element (e.g. content expanding above the chart)
 * without polling, using IntersectionObserver rootMargins:
 * - A tight-box observer around the element's current rect detects any movement when unclipped.
 * - When partially clipped (0 < ratio < 1), two orthogonal half-plane observers cut through the
 *   visible midpoint along each axis so slides parallel or perpendicular to a single clipping
 *   edge still cross a ratio threshold.
 * - Elements clipped on both opposing edges of an axis simultaneously, or completely occluded
 *   (ratio === 0), cannot change ratio until an edge re-enters or scroll/resize fires.
 */
function observeElementMove(element: Element, onMove: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  const observers = new Set<IntersectionObserver>();
  let stopped = false;

  const disconnectAll = () => {
    observers.forEach((observer) => observer.disconnect());
    observers.clear();
  };

  const refresh = () => {
    disconnectAll();
    if (stopped) return;
    const rect = element.getBoundingClientRect();
    const rootWidth = document.documentElement.clientWidth;
    const rootHeight = document.documentElement.clientHeight;
    if (rootWidth === 0 || rootHeight === 0 || rect.width === 0 || rect.height === 0) return;

    const observed = {
      left: Math.round(rect.left),
      top: Math.round(rect.top),
      width: Math.round(rect.width),
      height: Math.round(rect.height),
    };

    const addMarginObserver = (
      rootMargin: string,
      armedRatio: number | null,
      onFirstStableEntry?: (entry: IntersectionObserverEntry) => void,
    ) => {
      if (stopped) return;
      const threshold =
        armedRatio !== null && armedRatio > 0 && armedRatio < 1
          ? bracketRatioThresholds(armedRatio)
          : [0, 1];

      let isFirstObservation = true;
      const io = new IntersectionObserver(
        (entries) => {
          if (stopped) return;
          const entry = entries[entries.length - 1];
          const nextRect = element.getBoundingClientRect();
          if (!rectsEqual(observed, nextRect)) {
            onMove();
            refresh();
            return;
          }

          if (isFirstObservation) {
            isFirstObservation = false;
            const ratio = entry?.intersectionRatio ?? 1;
            if (
              ratio > 0 &&
              ratio < 1 &&
              (armedRatio === null || Math.abs(ratio - armedRatio) > 1e-4)
            ) {
              io.disconnect();
              observers.delete(io);
              addMarginObserver(rootMargin, ratio);
            }
            if (entry) {
              onFirstStableEntry?.(entry);
            }
          }
        },
        {
          root: document.documentElement,
          rootMargin,
          threshold,
        },
      );
      observers.add(io);
      io.observe(element);
    };

    const insetTop = Math.floor(rect.top);
    const insetLeft = Math.floor(rect.left);
    const insetRight = Math.floor(rootWidth - (rect.left + rect.width));
    const insetBottom = Math.floor(rootHeight - (rect.top + rect.height));
    const tightMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`;

    addMarginObserver(tightMargin, null, (entry) => {
      const ratio = entry.intersectionRatio;
      if (ratio <= 0 || ratio >= 1) return;

      const vis = entry.intersectionRect;
      if (vis.width <= 1 || vis.height <= 1) return;

      const openMargin = 10000;
      const cutY = Math.round(vis.top + vis.height / 2);
      const topClipped = vis.top > rect.top + 0.5;
      const verticalMargin = topClipped
        ? `${-cutY}px ${openMargin}px ${openMargin}px ${openMargin}px`
        : `${openMargin}px ${openMargin}px ${cutY - rootHeight}px ${openMargin}px`;
      addMarginObserver(verticalMargin, null);

      const cutX = Math.round(vis.left + vis.width / 2);
      const leftClipped = vis.left > rect.left + 0.5;
      const horizontalMargin = leftClipped
        ? `${openMargin}px ${openMargin}px ${openMargin}px ${-cutX}px`
        : `${openMargin}px ${cutX - rootWidth}px ${openMargin}px ${openMargin}px`;
      addMarginObserver(horizontalMargin, null);
    });
  };

  refresh();
  return () => {
    stopped = true;
    disconnectAll();
  };
}

function SessionPreviewContent({
  session,
  titleSlot,
}: {
  session: RecordSession;
  titleSlot: ReactNode;
}): ReactNode {
  return (
    <>
      <div className={styles.cardHeader}>
        <time className={styles.cardDate} dateTime={session.date.slice(0, 10)}>
          {session.formattedDate}
        </time>
        {session.isUpcoming && <span className={styles.badgeUpcoming}>Upcoming</span>}
      </div>
      {titleSlot}
      {session.venue && <p className={styles.cardVenue}>{session.venue}</p>}
      {session.format && <p className={styles.cardFormat}>{session.format}</p>}
    </>
  );
}

interface SessionPopoverProps {
  session: RecordSession;
  source: 'hover' | 'focus';
  containerRef: RefObject<HTMLDivElement | null>;
  popoverRef: RefObject<HTMLDivElement | null>;
  squareRefs: RefObject<Map<string, HTMLAnchorElement>>;
  onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLDivElement>) => void;
  onHoverInlineFallback: (permalink: string) => void;
  onInlineChange: (isInline: boolean) => void;
}

function isSamePopoverLayout(a: PopoverLayout | null, b: PopoverLayout | null): boolean {
  if (a === b) return true;
  if (!a || !b || a.kind !== b.kind) return false;
  if (a.kind === 'floating' && b.kind === 'floating') {
    return (
      a.left === b.left &&
      a.top === b.top &&
      a.arrowX === b.arrowX &&
      a.placement === b.placement &&
      a.maxWidth === b.maxWidth
    );
  }
  return true;
}

function SessionPopover({
  session,
  source,
  containerRef,
  popoverRef,
  squareRefs,
  onPointerEnter,
  onPointerLeave,
  onHoverInlineFallback,
  onInlineChange,
}: SessionPopoverProps): ReactNode {
  const [layout, setLayout] = useState<PopoverLayout | null>(null);

  const computeLayout = useCallback((): PopoverLayout | null => {
    const containerEl = containerRef.current;
    const squareEl = squareRefs.current.get(session.permalink);
    const popoverEl = popoverRef.current;
    if (!containerEl || !squareEl || !popoverEl) return null;

    // Measure the unscaled, non-animated slot wrapper so entrance animations or hover scale
    // never skew anchor coordinates.
    const anchorEl = squareEl.parentElement ?? squareEl;
    const containerRect = containerEl.getBoundingClientRect();
    const anchorRect = anchorEl.getBoundingClientRect();

    const vp = getVisibleViewport();
    const navbarBottom = getNavbarBottom();
    const visibleTop = Math.max(vp.top, navbarBottom);

    // Hide the preview when its anchor square is scrolled under the navbar or outside the viewport.
    if (
      anchorRect.bottom <= visibleTop + 2 ||
      anchorRect.top >= vp.bottom - 2 ||
      anchorRect.right <= vp.left ||
      anchorRect.left >= vp.right
    ) {
      return {kind: 'hidden'};
    }

    const gap = 10;
    const viewportMargin = 12;
    const availableWidth = Math.floor(vp.right - vp.left - viewportMargin * 2);

    // Under extreme pinch zoom where a floating card would be unreadably narrow,
    // use the inline / details fallback instead.
    if (availableWidth < MIN_FLOATING_POPOVER_WIDTH) {
      popoverEl.style.maxWidth = '';
      return {kind: 'inline'};
    }

    // Cap width against the visual viewport before measuring height so wrapped dimensions
    // reflect pinch zoom accurately and floating cards never clip horizontally.
    popoverEl.style.maxWidth = `min(19.5rem, ${availableWidth}px)`;
    const popoverWidth = popoverEl.offsetWidth;
    const popoverHeight = popoverEl.offsetHeight;
    if (popoverWidth === 0 || popoverHeight === 0) return null;

    const topBound = visibleTop + 8;
    const bottomBound = vp.bottom - viewportMargin;

    const spaceAbove = anchorRect.top - gap - topBound;
    const spaceBelow = bottomBound - (anchorRect.bottom + gap);
    const fitsAbove = spaceAbove >= popoverHeight;
    const fitsBelow = spaceBelow >= popoverHeight;

    // If neither side has enough room without clipping or covering the trigger,
    // fall back to an in-flow presentation so all content stays readable.
    if (!fitsAbove && !fitsBelow) {
      popoverEl.style.maxWidth = '';
      return {kind: 'inline'};
    }

    const placement: 'top' | 'bottom' = fitsAbove ? 'top' : 'bottom';
    const viewportTop =
      placement === 'top' ? anchorRect.top - gap - popoverHeight : anchorRect.bottom + gap;

    const centerX = anchorRect.left + anchorRect.width / 2 - containerRect.left;
    const minLeft = vp.left + viewportMargin - containerRect.left;
    const maxLeft = vp.right - viewportMargin - popoverWidth - containerRect.left;
    const desiredLeft = centerX - popoverWidth / 2;
    const left = Math.round(
      maxLeft < minLeft ? minLeft : Math.max(minLeft, Math.min(desiredLeft, maxLeft)),
    );
    const top = Math.round(viewportTop - containerRect.top);
    const arrowX = Math.round(Math.max(14, Math.min(centerX - left, popoverWidth - 14)));
    return {kind: 'floating', left, top, arrowX, placement, maxWidth: availableWidth};
  }, [containerRef, popoverRef, session.permalink, squareRefs]);

  useIsomorphicLayoutEffect(() => {
    let active = true;
    const applyLayout = () => {
      if (!active) return;
      const next = computeLayout();
      // Route hover-triggered inline fallbacks to the persistent, dismissible details panel so
      // moving the pointer across other squares to reach the preview never switches or dismisses it.
      if (next?.kind === 'inline' && source === 'hover') {
        onInlineChange(false);
        setLayout({kind: 'hidden'});
        onHoverInlineFallback(session.permalink);
        return;
      }
      onInlineChange(next?.kind === 'inline');
      setLayout((prev) => (isSamePopoverLayout(prev, next) ? prev : next));
    };

    applyLayout();

    let rafId = 0;
    const scheduleUpdate = () => {
      if (!active || rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        applyLayout();
      });
    };

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, {passive: true, capture: true});

    const vv = window.visualViewport;
    vv?.addEventListener('resize', scheduleUpdate);
    vv?.addEventListener('scroll', scheduleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (popoverRef.current) resizeObserver.observe(popoverRef.current);
      if (document.body) resizeObserver.observe(document.body);
    }

    const squareEl = squareRefs.current.get(session.permalink);
    const anchorEl = squareEl?.parentElement ?? squareEl ?? null;
    const stopMoveObserver = anchorEl ? observeElementMove(anchorEl, scheduleUpdate) : () => {};

    document.fonts?.ready
      .then(() => {
        if (active) scheduleUpdate();
      })
      .catch(() => {});

    return () => {
      active = false;
      onInlineChange(false);
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, {capture: true});
      vv?.removeEventListener('resize', scheduleUpdate);
      vv?.removeEventListener('scroll', scheduleUpdate);
      resizeObserver?.disconnect();
      stopMoveObserver();
    };
  }, [
    computeLayout,
    containerRef,
    onHoverInlineFallback,
    onInlineChange,
    popoverRef,
    session.permalink,
    source,
    squareRefs,
  ]);

  const isInline = layout?.kind === 'inline';
  const isFloating = layout?.kind === 'floating';

  return (
    <div
      ref={popoverRef}
      aria-hidden="true"
      className={clsx(styles.popover, isInline && styles.popoverInline)}
      data-placement={isFloating ? layout.placement : 'top'}
      data-arrow={isFloating ? 'true' : 'false'}
      style={
        isFloating
          ? ({
              left: `${layout.left}px`,
              top: `${layout.top}px`,
              maxWidth: `min(19.5rem, ${layout.maxWidth}px)`,
              '--arrow-x': `${layout.arrowX}px`,
            } as CSSProperties)
          : isInline
            ? undefined
            : {visibility: 'hidden', pointerEvents: 'none'}
      }
      onPointerEnter={isFloating ? onPointerEnter : undefined}
      onPointerLeave={isFloating ? onPointerLeave : undefined}>
      <SessionPreviewContent
        session={session}
        titleSlot={<p className={styles.cardTitle}>{session.title}</p>}
      />
    </div>
  );
}

type CueDirection = 'up' | 'down' | 'left' | 'right';

const CUE_ARROWS: Record<CueDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
};

interface OffscreenDetailsCueLayout {
  left: number;
  top: number;
  maxWidth: number;
  direction: CueDirection;
}

interface OffscreenDetailsCueProps {
  containerRef: RefObject<HTMLDivElement | null>;
  targetRef: RefObject<HTMLDivElement | null>;
  cueRef?: RefObject<HTMLButtonElement | null>;
  label: string;
  onReveal?: () => void;
}

/**
 * Floating viewport-anchored cue shown only when an open inline preview or details panel
 * lies outside the current visual viewport (vertically or horizontally, e.g. under extreme
 * pinch zoom or on short screens), giving users a visible way to reach the details without
 * forced scrolling. Renders an interactive button when `onReveal` is provided (for persistent
 * details panels) and a non-interactive visual shortcut hint otherwise (for focus-driven
 * inline previews where Space on the focused square opens the details panel).
 */
function OffscreenDetailsCue({
  containerRef,
  targetRef,
  cueRef,
  label,
  onReveal,
}: OffscreenDetailsCueProps): ReactNode {
  const localElRef = useRef<HTMLElement | null>(null);
  const [cueLayout, setCueLayout] = useState<OffscreenDetailsCueLayout | null>(null);

  const setCueNode = useCallback(
    (node: HTMLElement | null) => {
      localElRef.current = node;
      if (cueRef) {
        cueRef.current = node instanceof HTMLButtonElement ? node : null;
      }
    },
    [cueRef],
  );

  useIsomorphicLayoutEffect(() => {
    let active = true;

    const update = () => {
      if (!active) return;
      const containerEl = containerRef.current;
      const targetEl = targetRef.current;
      const cueEl = localElRef.current;
      if (!containerEl || !targetEl || !cueEl) {
        setCueLayout(null);
        return;
      }

      const vp = getVisibleViewport();
      const visibleTop = Math.max(vp.top, getNavbarBottom());
      const containerRect = containerEl.getBoundingClientRect();

      // Hide the cue when the chart itself is no longer in the visible viewport.
      if (
        containerRect.bottom <= visibleTop + 4 ||
        containerRect.top >= vp.bottom - 4 ||
        containerRect.right <= vp.left + 4 ||
        containerRect.left >= vp.right - 4
      ) {
        setCueLayout(null);
        return;
      }

      const targetRect = targetEl.getBoundingClientRect();
      const targetVisibleVertically =
        targetRect.top < vp.bottom - 24 && targetRect.bottom > visibleTop + 24;
      const targetVisibleHorizontally =
        targetRect.left < vp.right - 24 && targetRect.right > vp.left + 24;
      if (targetVisibleVertically && targetVisibleHorizontally) {
        setCueLayout(null);
        return;
      }

      let direction: CueDirection;
      if (!targetVisibleVertically) {
        direction = targetRect.top >= vp.bottom - 24 ? 'down' : 'up';
      } else {
        direction = targetRect.left >= vp.right - 24 ? 'right' : 'left';
      }

      const viewportMargin = 8;
      const maxWidth = Math.max(110, Math.floor(vp.right - vp.left - viewportMargin * 2));
      cueEl.style.maxWidth = `${maxWidth}px`;
      const cueWidth = cueEl.offsetWidth;
      const cueHeight = cueEl.offsetHeight;
      if (cueWidth === 0 || cueHeight === 0) return;

      const left = Math.round(
        Math.max(
          vp.left + viewportMargin - containerRect.left,
          vp.left + (vp.right - vp.left - cueWidth) / 2 - containerRect.left,
        ),
      );
      const top = Math.round(
        Math.max(visibleTop + 8, vp.bottom - cueHeight - 10) - containerRect.top,
      );

      setCueLayout((prev) =>
        prev &&
        prev.left === left &&
        prev.top === top &&
        prev.maxWidth === maxWidth &&
        prev.direction === direction
          ? prev
          : {left, top, maxWidth, direction},
      );
    };

    update();

    let rafId = 0;
    const scheduleUpdate = () => {
      if (!active || rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        update();
      });
    };

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, {passive: true, capture: true});
    const vv = window.visualViewport;
    vv?.addEventListener('resize', scheduleUpdate);
    vv?.addEventListener('scroll', scheduleUpdate);

    let resizeObserver: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(scheduleUpdate);
      if (containerRef.current) resizeObserver.observe(containerRef.current);
      if (targetRef.current) resizeObserver.observe(targetRef.current);
      if (document.body) resizeObserver.observe(document.body);
    }

    const stopTargetMoveObserver = targetRef.current
      ? observeElementMove(targetRef.current, scheduleUpdate)
      : () => {};

    return () => {
      active = false;
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, {capture: true});
      vv?.removeEventListener('resize', scheduleUpdate);
      vv?.removeEventListener('scroll', scheduleUpdate);
      resizeObserver?.disconnect();
      stopTargetMoveObserver();
    };
  }, [containerRef, targetRef]);

  const cueStyle: CSSProperties = cueLayout
    ? {
        left: `${cueLayout.left}px`,
        top: `${cueLayout.top}px`,
        maxWidth: `${cueLayout.maxWidth}px`,
      }
    : {visibility: 'hidden', pointerEvents: 'none'};

  const arrow = CUE_ARROWS[cueLayout?.direction ?? 'down'];

  if (!onReveal) {
    return (
      <div
        ref={setCueNode}
        className={clsx(styles.detailsCue, styles.detailsCueHint)}
        aria-hidden="true"
        style={cueStyle}>
        <span>{label}</span>
        <span>{arrow}</span>
      </div>
    );
  }

  return (
    <button
      ref={setCueNode}
      type="button"
      className={styles.detailsCue}
      tabIndex={cueLayout ? 0 : -1}
      aria-hidden={cueLayout ? undefined : true}
      style={cueStyle}
      onClick={onReveal}>
      <span>{label}</span>
      <span aria-hidden="true">{arrow}</span>
    </button>
  );
}

interface RecordSquareProps {
  session: RecordSession;
  colIndex: number;
  rowIndex: number;
  isTabStop: boolean;
  isPreviewed: boolean;
  isSelected: boolean;
  keyboardHintId: string;
  registerSquare: (permalink: string, node: HTMLAnchorElement | null) => void;
  onPointerDown: (event: PointerEvent<HTMLAnchorElement>, permalink: string) => void;
  onPointerCancel: () => void;
  onPointerEnter: (event: PointerEvent<HTMLAnchorElement>, permalink: string) => void;
  onPointerLeave: (event: PointerEvent<HTMLAnchorElement>, permalink: string) => void;
  onFocus: (permalink: string) => void;
  onBlur: (permalink: string) => void;
  onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>, colIndex: number, rowIndex: number) => void;
  onClick: (event: React.MouseEvent<HTMLAnchorElement>, permalink: string) => void;
}

const RecordSquare = memo(function RecordSquare({
  session,
  colIndex,
  rowIndex,
  isTabStop,
  isPreviewed,
  isSelected,
  keyboardHintId,
  registerSquare,
  onPointerDown,
  onPointerCancel,
  onPointerEnter,
  onPointerLeave,
  onFocus,
  onBlur,
  onKeyDown,
  onClick,
}: RecordSquareProps): ReactNode {
  const descId = useId();
  const descriptionText = [session.venue, session.format].filter(Boolean).join('. ');
  const describedBy =
    [descriptionText ? descId : null, isTabStop ? keyboardHintId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const setRef = useCallback(
    (node: HTMLAnchorElement | null) => {
      registerSquare(session.permalink, node);
    },
    [registerSquare, session.permalink],
  );

  const ariaLabel = `${session.title}, ${session.formattedDate}${session.isUpcoming ? ', upcoming' : ''}`;

  return (
    <span className={styles.squareSlot}>
      <Link
        ref={setRef}
        to={session.permalink}
        tabIndex={isTabStop ? 0 : -1}
        className={clsx(
          styles.square,
          styles.squareLink,
          session.isUpcoming && styles.squareUpcoming,
          isPreviewed && styles.squarePreviewed,
          isSelected && styles.squareSelected,
        )}
        style={{'--i': rowIndex} as CSSProperties}
        aria-label={ariaLabel}
        aria-describedby={describedBy}
        aria-current={isSelected ? 'true' : undefined}
        onPointerDown={(e) => onPointerDown(e, session.permalink)}
        onPointerCancel={onPointerCancel}
        onPointerEnter={(e) => onPointerEnter(e, session.permalink)}
        onPointerLeave={(e) => onPointerLeave(e, session.permalink)}
        onFocus={() => onFocus(session.permalink)}
        onBlur={() => onBlur(session.permalink)}
        onKeyDown={(e) => onKeyDown(e, colIndex, rowIndex)}
        onClick={(e) => onClick(e, session.permalink)}
      />
      {descriptionText && (
        <span id={descId} className="kc-sr-only">
          {descriptionText}
        </span>
      )}
    </span>
  );
});

/**
 * Every talk, workshop, and webinar as one square, stacked chronologically per year.
 * Delivered sessions are filled, upcoming ones are outlined.
 * Hovering or focusing a square previews its details; clicking opens the event page.
 * On touch devices, tapping a square opens a details bar beneath the chart.
 */
export default function SpeakingRecord({
  events,
  yearLink,
  upcomingLink,
  className,
}: SpeakingRecordProps): ReactNode {
  const today = useToday();
  const columns = useMemo(() => buildColumns(events, today), [events, today]);
  const tallest = Math.max(1, ...columns.map((c) => c.sessions.length));
  const hasUpcoming = columns.some((c) => c.upcoming.length > 0);

  const allSessions = useMemo(() => columns.flatMap((c) => c.sessions), [columns]);

  const sessionByPermalink = useMemo(() => {
    const map = new Map<string, RecordSession>();
    for (const session of allSessions) {
      map.set(session.permalink, session);
    }
    return map;
  }, [allSessions]);

  const firstPermalink = allSessions[0]?.permalink ?? null;
  const lastPermalink = allSessions[allSessions.length - 1]?.permalink ?? null;

  const [hoveredPermalink, setHoveredPermalink] = useState<string | null>(null);
  const [focusedPermalink, setFocusedPermalink] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<'hover' | 'focus'>('hover');
  const [dismissedFocusPermalink, setDismissedFocusPermalink] = useState<string | null>(null);
  const [detailsPanel, setDetailsPanel] = useState<DetailsPanelState | null>(null);
  const [isFocusPopoverInline, setIsFocusPopoverInline] = useState(false);
  const [activeTabPermalink, setActiveTabPermalink] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const popoverElRef = useRef<HTMLDivElement | null>(null);
  const detailsBarRef = useRef<HTMLDivElement | null>(null);
  const detailsCueRef = useRef<HTMLButtonElement | null>(null);
  const detailsTitleLinkRef = useRef<HTMLAnchorElement | null>(null);
  const browseButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const squareRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const suppressNextFocusPreviewRef = useRef<string | null>(null);
  const hoverLeaveTimerRef = useRef<number | null>(null);
  const keyboardHintId = useId();
  const detailsBarId = useId();

  const clearHoverLeaveTimer = useCallback(() => {
    if (hoverLeaveTimerRef.current !== null) {
      window.clearTimeout(hoverLeaveTimerRef.current);
      hoverLeaveTimerRef.current = null;
    }
  }, []);

  useEffect(() => clearHoverLeaveTimer, [clearHoverLeaveTimer]);

  const effectiveTabPermalink =
    activeTabPermalink && sessionByPermalink.has(activeTabPermalink)
      ? activeTabPermalink
      : firstPermalink;

  const selectedIndex = useMemo(
    () =>
      detailsPanel
        ? allSessions.findIndex((session) => session.permalink === detailsPanel.permalink)
        : -1,
    [allSessions, detailsPanel],
  );
  const selectedSession = selectedIndex >= 0 ? allSessions[selectedIndex] : null;
  const activeDetails = selectedSession && detailsPanel ? detailsPanel : null;
  const selectedSessionPermalink = selectedSession?.permalink ?? null;
  const isHoverLocked = activeDetails?.owner === 'hover-fallback';

  const activeFocusedPermalink =
    focusedPermalink &&
    focusedPermalink !== dismissedFocusPermalink &&
    focusedPermalink !== selectedSessionPermalink
      ? focusedPermalink
      : null;

  let popoverPermalink: string | null = null;
  let effectivePopoverSource: 'hover' | 'focus' = 'hover';
  if (previewSource === 'focus') {
    if (activeFocusedPermalink) {
      popoverPermalink = activeFocusedPermalink;
      effectivePopoverSource = 'focus';
    } else if (hoveredPermalink) {
      popoverPermalink = hoveredPermalink;
      effectivePopoverSource = 'hover';
    }
  } else if (hoveredPermalink) {
    popoverPermalink = hoveredPermalink;
    effectivePopoverSource = 'hover';
  } else if (activeFocusedPermalink) {
    popoverPermalink = activeFocusedPermalink;
    effectivePopoverSource = 'focus';
  }

  const popoverSession = popoverPermalink
    ? sessionByPermalink.get(popoverPermalink) ?? null
    : null;

  const liveAnnouncement = selectedSession
    ? `Selected session ${selectedIndex + 1} of ${allSessions.length}: ${selectedSession.title}, ${selectedSession.formattedDate}${selectedSession.venue ? `, ${selectedSession.venue}` : ''}.`
    : '';

  const registerSquare = useCallback((permalink: string, node: HTMLAnchorElement | null) => {
    if (node) squareRefs.current.set(permalink, node);
    else squareRefs.current.delete(permalink);
  }, []);

  const closeDetailsBar = useCallback(
    (restoreFocus: boolean) => {
      const opener = activeDetails?.opener ?? {kind: 'browse'};
      setDetailsPanel(null);
      if (!restoreFocus) return;

      if (opener.kind === 'browse') {
        const browseBtn = browseButtonRef.current;
        if (browseBtn) {
          browseBtn.focus();
          revealElementIfObscured(browseBtn);
        }
        return;
      }

      const targetPermalink = sessionByPermalink.has(opener.permalink)
        ? opener.permalink
        : effectiveTabPermalink;
      if (targetPermalink) {
        const target = squareRefs.current.get(targetPermalink);
        if (target) {
          setActiveTabPermalink(targetPermalink);
          suppressNextFocusPreviewRef.current = targetPermalink;
          setDismissedFocusPermalink(targetPermalink);
          target.focus();
          revealElementIfObscured(target);
          // Clear synchronously after focus() so stale suppression never lingers if already focused.
          suppressNextFocusPreviewRef.current = null;
        }
      }
    },
    [activeDetails, effectiveTabPermalink, sessionByPermalink],
  );

  // Dismiss any open preview (hovered, focused, or details bar) on Escape from anywhere.
  useEffect(() => {
    if (!popoverSession && !activeDetails) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clearHoverLeaveTimer();
      if (activeDetails) {
        const activeEl = document.activeElement;
        const focusInsideDetails = Boolean(
          detailsBarRef.current?.contains(activeEl) || detailsCueRef.current?.contains(activeEl),
        );
        closeDetailsBar(focusInsideDetails);
      }
      setHoveredPermalink(null);
      if (focusedPermalink) {
        setDismissedFocusPermalink(focusedPermalink);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activeDetails, clearHoverLeaveTimer, closeDetailsBar, focusedPermalink, popoverSession]);

  // Dismiss the details bar when tapping outside the chart.
  useEffect(() => {
    if (!activeDetails) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setDetailsPanel(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [activeDetails]);

  // Reveal (and optionally focus) the details bar when explicitly opened.
  useEffect(() => {
    if (!activeDetails || !detailsBarRef.current) return;
    if (activeDetails.autoReveal) {
      revealElementIfObscured(detailsBarRef.current);
    }
    if (activeDetails.focusOnOpen) {
      detailsTitleLinkRef.current?.focus({preventScroll: true});
    }
  }, [activeDetails]);

  const stepSelectedSession = useCallback(
    (delta: -1 | 1) => {
      if (selectedIndex < 0) return;
      const nextIndex = selectedIndex + delta;
      const nextSession = allSessions[nextIndex];
      if (!nextSession) return;
      setDetailsPanel((prev) =>
        prev
          ? {
              ...prev,
              permalink: nextSession.permalink,
              autoReveal: false,
              focusOnOpen: false,
            }
          : prev,
      );
      // If stepping reaches a boundary and disables the clicked button, keep focus inside the bar.
      if (delta === -1 && nextIndex === 0) {
        (nextButtonRef.current ?? closeButtonRef.current)?.focus({preventScroll: true});
      } else if (delta === 1 && nextIndex === allSessions.length - 1) {
        (prevButtonRef.current ?? closeButtonRef.current)?.focus({preventScroll: true});
      }
    },
    [allSessions, selectedIndex],
  );

  const toggleBrowsePanel = useCallback(() => {
    if (activeDetails) {
      closeDetailsBar(false);
      return;
    }
    const target =
      (activeTabPermalink && sessionByPermalink.has(activeTabPermalink)
        ? activeTabPermalink
        : null) ?? lastPermalink;
    if (!target) return;
    clearHoverLeaveTimer();
    setHoveredPermalink(null);
    setDetailsPanel({
      permalink: target,
      owner: 'browse',
      opener: {kind: 'browse'},
      autoReveal: true,
      focusOnOpen: false,
    });
  }, [
    activeDetails,
    activeTabPermalink,
    clearHoverLeaveTimer,
    closeDetailsBar,
    lastPermalink,
    sessionByPermalink,
  ]);

  const handleHoverInlineFallback = useCallback(
    (permalink: string) => {
      clearHoverLeaveTimer();
      setHoveredPermalink(null);
      // Never let passive hover fallback overwrite an explicitly opened panel (browse, touch,
      // or keyboard) or disturb the chart's roving tab stop.
      setDetailsPanel((prev) => {
        if (prev && sessionByPermalink.has(prev.permalink)) {
          return prev;
        }
        return {
          permalink,
          owner: 'hover-fallback',
          opener: {kind: 'square', permalink},
          autoReveal: false,
          focusOnOpen: false,
        };
      });
    },
    [clearHoverLeaveTimer, sessionByPermalink],
  );

  const openKeyboardDetails = useCallback(
    (permalink: string) => {
      clearHoverLeaveTimer();
      setHoveredPermalink(null);
      setActiveTabPermalink(permalink);
      setDismissedFocusPermalink(permalink);
      setDetailsPanel({
        permalink,
        owner: 'keyboard',
        opener: {kind: 'square', permalink},
        autoReveal: true,
        focusOnOpen: true,
      });
    },
    [clearHoverLeaveTimer],
  );

  const revealOpenDetails = useCallback(() => {
    if (!detailsBarRef.current) return;
    revealElementIfObscured(detailsBarRef.current);
    detailsTitleLinkRef.current?.focus({preventScroll: true});
  }, []);

  const focusSquare = useCallback(
    (permalink: string) => {
      clearHoverLeaveTimer();
      pendingPointerRef.current = null;
      setHoveredPermalink(null);
      setActiveTabPermalink(permalink);
      setDismissedFocusPermalink(null);
      setPreviewSource('focus');
      squareRefs.current.get(permalink)?.focus();
    },
    [clearHoverLeaveTimer],
  );

  const handleSquareKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, colIndex: number, rowIndex: number) => {
      pendingPointerRef.current = null;
      const {key} = event;
      const currentColumn = columns[colIndex];
      if (!currentColumn) return;

      if (key === ' ' || key === 'Spacebar') {
        const currentSession = currentColumn.sessions[rowIndex];
        if (!currentSession) return;
        event.preventDefault();
        openKeyboardDetails(currentSession.permalink);
        return;
      }

      let targetPermalink: string | null = null;

      if (key === 'ArrowUp') {
        targetPermalink = currentColumn.sessions[rowIndex + 1]?.permalink ?? null;
      } else if (key === 'ArrowDown') {
        targetPermalink = currentColumn.sessions[rowIndex - 1]?.permalink ?? null;
      } else if (key === 'ArrowRight') {
        for (let c = colIndex + 1; c < columns.length; c++) {
          const nextCol = columns[c];
          if (nextCol.sessions.length > 0) {
            targetPermalink =
              nextCol.sessions[Math.min(rowIndex, nextCol.sessions.length - 1)].permalink;
            break;
          }
        }
      } else if (key === 'ArrowLeft') {
        for (let c = colIndex - 1; c >= 0; c--) {
          const prevCol = columns[c];
          if (prevCol.sessions.length > 0) {
            targetPermalink =
              prevCol.sessions[Math.min(rowIndex, prevCol.sessions.length - 1)].permalink;
            break;
          }
        }
      } else if (key === 'Home') {
        targetPermalink = firstPermalink;
      } else if (key === 'End') {
        targetPermalink = lastPermalink;
      } else {
        return;
      }

      event.preventDefault();
      if (targetPermalink) {
        focusSquare(targetPermalink);
      }
    },
    [columns, firstPermalink, focusSquare, lastPermalink, openKeyboardDetails],
  );

  const handleSquarePointerDown = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, permalink: string) => {
      pendingPointerRef.current = {
        permalink,
        pointerType: event.pointerType,
        timestamp: performance.now(),
      };
    },
    [],
  );

  const handleSquarePointerCancel = useCallback(() => {
    pendingPointerRef.current = null;
  }, []);

  const handleSquarePointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, permalink: string) => {
      if (event.pointerType === 'touch' || isHoverLocked) return;
      clearHoverLeaveTimer();
      setHoveredPermalink(permalink);
      setPreviewSource('hover');
    },
    [clearHoverLeaveTimer, isHoverLocked],
  );

  const handleSquarePointerLeave = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, permalink: string) => {
      if (event.pointerType === 'touch') return;
      clearHoverLeaveTimer();
      hoverLeaveTimerRef.current = window.setTimeout(() => {
        hoverLeaveTimerRef.current = null;
        setHoveredPermalink((prev) => (prev === permalink ? null : prev));
      }, HOVER_LEAVE_DELAY_MS);
    },
    [clearHoverLeaveTimer],
  );

  const handlePopoverPointerEnter = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch') return;
      clearHoverLeaveTimer();
    },
    [clearHoverLeaveTimer],
  );

  const handlePopoverPointerLeave = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (event.pointerType === 'touch') return;
      clearHoverLeaveTimer();
      hoverLeaveTimerRef.current = window.setTimeout(() => {
        hoverLeaveTimerRef.current = null;
        setHoveredPermalink(null);
      }, HOVER_LEAVE_DELAY_MS);
    },
    [clearHoverLeaveTimer],
  );

  const handleSquareFocus = useCallback((permalink: string) => {
    setActiveTabPermalink(permalink);
    if (suppressNextFocusPreviewRef.current === permalink) {
      suppressNextFocusPreviewRef.current = null;
      setFocusedPermalink(permalink);
      setDismissedFocusPermalink(permalink);
      return;
    }
    suppressNextFocusPreviewRef.current = null;

    const pending = getFreshPendingPointer(pendingPointerRef, permalink);
    const isRecentTouchFocus = pending !== null && pending.pointerType === 'touch';

    if (!isRecentTouchFocus) {
      setFocusedPermalink(permalink);
      setDismissedFocusPermalink(null);
      setPreviewSource('focus');
    }
  }, []);

  const handleSquareBlur = useCallback((permalink: string) => {
    setFocusedPermalink((prev) => (prev === permalink ? null : prev));
  }, []);

  const handleSquareClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, permalink: string) => {
      const pending = getFreshPendingPointer(pendingPointerRef, permalink);
      pendingPointerRef.current = null;

      // Keyboard activations (Enter/Space) have detail === 0 and must always follow the link.
      if (event.detail === 0) return;

      const nativePointerType =
        'pointerType' in event.nativeEvent
          ? (event.nativeEvent as globalThis.PointerEvent).pointerType
          : '';
      const effectivePointerType = nativePointerType || (pending ? pending.pointerType : '');
      const isTouchInteraction =
        effectivePointerType === 'touch' ||
        (effectivePointerType === '' && isCoarsePointerDevice());

      if (isTouchInteraction) {
        event.preventDefault();
        clearHoverLeaveTimer();
        setHoveredPermalink(null);
        setActiveTabPermalink(permalink);
        setDetailsPanel((prev) =>
          prev && prev.permalink === permalink && sessionByPermalink.has(prev.permalink)
            ? null
            : {
                permalink,
                owner: 'touch',
                opener: {kind: 'square', permalink},
                autoReveal: true,
                focusOnOpen: false,
              },
        );
      }
    },
    [clearHoverLeaveTimer, sessionByPermalink],
  );

  return (
    <div
      ref={containerRef}
      className={clsx(styles.record, className)}
      style={{'--columns': columns.length} as CSSProperties}
      data-bleed={columns.length > 10 || undefined}>
      <figure className={styles.figure} aria-label="Talks, workshops, and webinars per year">
        <p id={keyboardHintId} className="kc-sr-only">
          Use arrow keys, Home, or End to move between sessions. Press Enter to open a session page,
          Space to reveal session details, or Escape to dismiss the preview.
        </p>
        <ol className={styles.chart} style={{'--rows': tallest} as CSSProperties}>
          {columns.map((column, col) => {
            const total = column.sessions.length;
            const deliveredCount = column.delivered.length;
            const upcomingCount = column.upcoming.length;
            const yearSummary =
              upcomingCount > 0
                ? `${column.year}: ${sessionsLabel(deliveredCount)} delivered, ${upcomingCount} upcoming`
                : `${column.year}: ${sessionsLabel(deliveredCount)}`;
            const yearHref =
              total > 0
                ? deliveredCount > 0
                  ? yearLink?.(column.year)
                  : upcomingLink
                : undefined;

            return (
              <li
                key={column.year}
                className={styles.column}
                style={{'--col': col, '--t': col / Math.max(1, columns.length - 1)} as CSSProperties}>
                <div className={styles.columnBody}>
                  <span className="kc-sr-only">{yearSummary}</span>
                  <div className={styles.stack}>
                    {column.sessions.map((session, i) => (
                      <RecordSquare
                        key={session.permalink}
                        session={session}
                        colIndex={col}
                        rowIndex={i}
                        isTabStop={session.permalink === effectiveTabPermalink}
                        isPreviewed={popoverPermalink === session.permalink}
                        isSelected={selectedSessionPermalink === session.permalink}
                        keyboardHintId={keyboardHintId}
                        registerSquare={registerSquare}
                        onPointerDown={handleSquarePointerDown}
                        onPointerCancel={handleSquarePointerCancel}
                        onPointerEnter={handleSquarePointerEnter}
                        onPointerLeave={handleSquarePointerLeave}
                        onFocus={handleSquareFocus}
                        onBlur={handleSquareBlur}
                        onKeyDown={handleSquareKeyDown}
                        onClick={handleSquareClick}
                      />
                    ))}
                    {total > 0 && (
                      <span className={styles.count} aria-hidden="true">
                        {total}
                      </span>
                    )}
                  </div>
                  {yearHref ? (
                    <Link
                      to={yearHref}
                      className={clsx(styles.year, styles.yearLink)}
                      aria-label={
                        deliveredCount > 0
                          ? `Jump to ${column.year} sessions (${sessionsLabel(deliveredCount)} delivered${upcomingCount > 0 ? `, ${upcomingCount} upcoming` : ''})`
                          : `Jump to upcoming sessions (${column.year})`
                      }>
                      <span className={styles.yearLong} aria-hidden="true">
                        {column.year}
                      </span>
                      <span className={styles.yearShort} aria-hidden="true">
                        ’{String(column.year).slice(2)}
                      </span>
                    </Link>
                  ) : (
                    <span className={styles.year} aria-hidden="true">
                      <span className={styles.yearLong}>{column.year}</span>
                      <span className={styles.yearShort}>’{String(column.year).slice(2)}</span>
                    </span>
                  )}
                </div>
              </li>
            );
          })}
        </ol>

        <figcaption className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.square} aria-hidden="true" /> One talk, workshop, or webinar
          </span>
          {hasUpcoming && (
            <span className={styles.legendItem}>
              <span className={clsx(styles.square, styles.squareUpcoming)} aria-hidden="true" /> Upcoming
            </span>
          )}
          <span>
            <span className={styles.hintPointer}>
              {yearLink
                ? 'Hover or focus a square to preview, click to open, or select a year to jump to its sessions.'
                : 'Hover or focus a square to preview; click to open.'}
            </span>
            <span className={styles.hintHybrid}>
              {yearLink
                ? 'Hover, focus, or tap a square for details, click to open, or select a year to jump to its sessions.'
                : 'Hover, focus, or tap a square for details; click to open.'}
            </span>
            <span className={styles.hintTouch}>
              {yearLink
                ? 'Tap or focus a square for details, or select a year to jump to its sessions.'
                : 'Tap or focus a square for session details.'}
            </span>
          </span>
          {allSessions.length > 0 && (
            <button
              ref={browseButtonRef}
              type="button"
              className={styles.browseButton}
              aria-expanded={Boolean(selectedSession)}
              aria-controls={selectedSession ? detailsBarId : undefined}
              onClick={toggleBrowsePanel}>
              {selectedSession ? 'Hide session browser' : 'Browse sessions'}
            </button>
          )}
        </figcaption>
      </figure>

      <div className="kc-sr-only" role="status" aria-live="polite" aria-atomic="true">
        {liveAnnouncement}
      </div>

      {popoverSession && (
        <SessionPopover
          session={popoverSession}
          source={effectivePopoverSource}
          containerRef={containerRef}
          popoverRef={popoverElRef}
          squareRefs={squareRefs}
          onPointerEnter={handlePopoverPointerEnter}
          onPointerLeave={handlePopoverPointerLeave}
          onHoverInlineFallback={handleHoverInlineFallback}
          onInlineChange={setIsFocusPopoverInline}
        />
      )}

      {selectedSession && (
        <div
          id={detailsBarId}
          ref={detailsBarRef}
          className={styles.detailsBar}
          role="region"
          aria-label="Selected session details">
          <div className={styles.detailsBody}>
            <SessionPreviewContent
              session={selectedSession}
              titleSlot={
                <Link
                  ref={detailsTitleLinkRef}
                  to={selectedSession.permalink}
                  className={styles.detailsTitleLink}>
                  {selectedSession.title}
                  <span className={styles.detailsArrow} aria-hidden="true">
                    {' '}
                    →
                  </span>
                </Link>
              }
            />
          </div>
          <div className={styles.detailsActions}>
            {allSessions.length > 1 && (
              <div className={styles.detailsNav} role="group" aria-label="Step through sessions">
                <button
                  ref={prevButtonRef}
                  type="button"
                  className={styles.detailsControl}
                  aria-label="Previous session"
                  disabled={selectedIndex <= 0}
                  onClick={() => stepSelectedSession(-1)}>
                  <span aria-hidden="true">‹</span>
                </button>
                <span className={styles.detailsCounter} aria-hidden="true">
                  {selectedIndex + 1}/{allSessions.length}
                </span>
                <button
                  ref={nextButtonRef}
                  type="button"
                  className={styles.detailsControl}
                  aria-label="Next session"
                  disabled={selectedIndex >= allSessions.length - 1}
                  onClick={() => stepSelectedSession(1)}>
                  <span aria-hidden="true">›</span>
                </button>
              </div>
            )}
            <button
              ref={closeButtonRef}
              type="button"
              className={styles.detailsControl}
              aria-label="Close session details"
              onClick={() => closeDetailsBar(true)}>
              <span aria-hidden="true">×</span>
            </button>
          </div>
        </div>
      )}

      {activeDetails ? (
        <OffscreenDetailsCue
          key="details"
          containerRef={containerRef}
          targetRef={detailsBarRef}
          cueRef={detailsCueRef}
          label="View session details"
          onReveal={revealOpenDetails}
        />
      ) : (
        popoverSession &&
        effectivePopoverSource === 'focus' &&
        isFocusPopoverInline && (
          <OffscreenDetailsCue
            key="inline"
            containerRef={containerRef}
            targetRef={popoverElRef}
            label="Press Space for details"
          />
        )
      )}
    </div>
  );
}
