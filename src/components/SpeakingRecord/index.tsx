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
  if (rect.bottom > vp.bottom - 12 || rect.top < visibleTop + 8) {
    const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    element.scrollIntoView({
      block: 'nearest',
      behavior: reducedMotion ? 'auto' : 'smooth',
    });
  }
}

/**
 * Observes position-only shifts of an element (e.g. content expanding above the chart)
 * without polling, by wrapping the element's current rect in an IntersectionObserver rootMargin.
 */
function observeElementMove(element: Element, onMove: () => void): () => void {
  if (typeof IntersectionObserver === 'undefined') return () => {};
  let io: IntersectionObserver | null = null;
  let stopped = false;

  const disconnect = () => {
    io?.disconnect();
    io = null;
  };

  const refresh = () => {
    disconnect();
    if (stopped) return;
    const rect = element.getBoundingClientRect();
    const rootWidth = document.documentElement.clientWidth;
    const rootHeight = document.documentElement.clientHeight;
    if (rootWidth === 0 || rootHeight === 0 || rect.width === 0 || rect.height === 0) return;

    const observedLeft = Math.round(rect.left);
    const observedTop = Math.round(rect.top);
    const observedWidth = Math.round(rect.width);
    const observedHeight = Math.round(rect.height);

    const insetTop = Math.floor(rect.top);
    const insetLeft = Math.floor(rect.left);
    const insetRight = Math.floor(rootWidth - (rect.left + rect.width));
    const insetBottom = Math.floor(rootHeight - (rect.top + rect.height));
    const rootMargin = `${-insetTop}px ${-insetRight}px ${-insetBottom}px ${-insetLeft}px`;

    let isFirstObservation = true;
    io = new IntersectionObserver(
      () => {
        if (stopped) return;
        if (isFirstObservation) {
          isFirstObservation = false;
          return;
        }
        const nextRect = element.getBoundingClientRect();
        if (
          Math.round(nextRect.left) !== observedLeft ||
          Math.round(nextRect.top) !== observedTop ||
          Math.round(nextRect.width) !== observedWidth ||
          Math.round(nextRect.height) !== observedHeight
        ) {
          onMove();
          refresh();
        }
      },
      {
        root: document.documentElement,
        rootMargin,
        threshold: [0, 1],
      },
    );
    io.observe(element);
  };

  refresh();
  return () => {
    stopped = true;
    disconnect();
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
  squareRefs: RefObject<Map<string, HTMLAnchorElement>>;
  onPointerEnter: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerLeave: (event: PointerEvent<HTMLDivElement>) => void;
  onHoverInlineFallback: (permalink: string) => void;
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
  squareRefs,
  onPointerEnter,
  onPointerLeave,
  onHoverInlineFallback,
}: SessionPopoverProps): ReactNode {
  const popoverRef = useRef<HTMLDivElement | null>(null);
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
  }, [containerRef, session.permalink, squareRefs]);

  useIsomorphicLayoutEffect(() => {
    let active = true;
    const applyLayout = () => {
      if (!active) return;
      const next = computeLayout();
      // Route hover-triggered inline fallbacks to the persistent, dismissible details panel so
      // moving the pointer across other squares to reach the preview never switches or dismisses it.
      if (next?.kind === 'inline' && source === 'hover') {
        setLayout({kind: 'hidden'});
        onHoverInlineFallback(session.permalink);
        return;
      }
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
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate, {capture: true});
      vv?.removeEventListener('resize', scheduleUpdate);
      vv?.removeEventListener('scroll', scheduleUpdate);
      resizeObserver?.disconnect();
      stopMoveObserver();
    };
  }, [computeLayout, containerRef, onHoverInlineFallback, session.permalink, source, squareRefs]);

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
  const [selectedPermalink, setSelectedPermalink] = useState<string | null>(null);
  const [hoverLockedByDetails, setHoverLockedByDetails] = useState(false);
  const [activeTabPermalink, setActiveTabPermalink] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const detailsBarRef = useRef<HTMLDivElement | null>(null);
  const browseButtonRef = useRef<HTMLButtonElement | null>(null);
  const prevButtonRef = useRef<HTMLButtonElement | null>(null);
  const nextButtonRef = useRef<HTMLButtonElement | null>(null);
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const squareRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const suppressNextFocusPreviewRef = useRef<string | null>(null);
  const detailsOpenerRef = useRef<DetailsOpener>({kind: 'browse'});
  const detailsAutoScrollRef = useRef(true);
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
      selectedPermalink
        ? allSessions.findIndex((session) => session.permalink === selectedPermalink)
        : -1,
    [allSessions, selectedPermalink],
  );
  const selectedSession = selectedIndex >= 0 ? allSessions[selectedIndex] : null;
  const selectedSessionPermalink = selectedSession?.permalink ?? null;
  const isHoverLocked = hoverLockedByDetails && Boolean(selectedSession);

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
      const opener = detailsOpenerRef.current;
      setSelectedPermalink(null);
      setHoverLockedByDetails(false);
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
    [effectiveTabPermalink, sessionByPermalink],
  );

  // Dismiss any open preview (hovered, focused, or details bar) on Escape from anywhere.
  useEffect(() => {
    if (!popoverSession && !selectedSession) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      clearHoverLeaveTimer();
      if (selectedSession) {
        const focusInsideDetails = Boolean(
          detailsBarRef.current?.contains(document.activeElement),
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
  }, [clearHoverLeaveTimer, closeDetailsBar, focusedPermalink, popoverSession, selectedSession]);

  // Dismiss the details bar when tapping outside the chart.
  useEffect(() => {
    if (!selectedSession) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setSelectedPermalink(null);
        setHoverLockedByDetails(false);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [selectedSession]);

  // Reveal the details bar with the minimum necessary scroll if it opens offscreen.
  useEffect(() => {
    if (!selectedSessionPermalink || !detailsBarRef.current || !detailsAutoScrollRef.current) return;
    revealElementIfObscured(detailsBarRef.current);
  }, [selectedSessionPermalink]);

  const stepSelectedSession = useCallback(
    (delta: -1 | 1) => {
      if (selectedIndex < 0) return;
      const nextIndex = selectedIndex + delta;
      const nextSession = allSessions[nextIndex];
      if (!nextSession) return;
      setSelectedPermalink(nextSession.permalink);
      setActiveTabPermalink(nextSession.permalink);
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
    if (selectedSession) {
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
    detailsOpenerRef.current = {kind: 'browse'};
    detailsAutoScrollRef.current = true;
    setHoverLockedByDetails(false);
    setActiveTabPermalink(target);
    setSelectedPermalink(target);
  }, [
    activeTabPermalink,
    clearHoverLeaveTimer,
    closeDetailsBar,
    lastPermalink,
    selectedSession,
    sessionByPermalink,
  ]);

  const handleHoverInlineFallback = useCallback(
    (permalink: string) => {
      clearHoverLeaveTimer();
      setHoveredPermalink(null);
      detailsOpenerRef.current = {kind: 'square', permalink};
      detailsAutoScrollRef.current = false;
      setHoverLockedByDetails(true);
      setActiveTabPermalink(permalink);
      setSelectedPermalink(permalink);
    },
    [clearHoverLeaveTimer],
  );

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
    [columns, firstPermalink, focusSquare, lastPermalink],
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
        detailsOpenerRef.current = {kind: 'square', permalink};
        detailsAutoScrollRef.current = true;
        setHoverLockedByDetails(false);
        setActiveTabPermalink(permalink);
        setSelectedPermalink((prev) =>
          prev === permalink && selectedSessionPermalink === permalink ? null : permalink,
        );
      }
    },
    [clearHoverLeaveTimer, selectedSessionPermalink],
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
          or Escape to dismiss the preview.
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
          squareRefs={squareRefs}
          onPointerEnter={handlePopoverPointerEnter}
          onPointerLeave={handlePopoverPointerLeave}
          onHoverInlineFallback={handleHoverInlineFallback}
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
                <Link to={selectedSession.permalink} className={styles.detailsTitleLink}>
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
    </div>
  );
}
