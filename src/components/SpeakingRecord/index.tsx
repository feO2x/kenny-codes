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

interface PopoverPosition {
  left: number;
  top: number;
  arrowX: number;
  placement: 'top' | 'bottom';
  showArrow: boolean;
}

interface PendingPointer {
  permalink: string;
  pointerType: string;
  timestamp: number;
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
  figureRef: RefObject<HTMLElement | null>;
  squareRefs: RefObject<Map<string, HTMLAnchorElement>>;
}

function SessionPopover({session, figureRef, squareRefs}: SessionPopoverProps): ReactNode {
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);

  const computePosition = useCallback((): PopoverPosition | null => {
    const figureEl = figureRef.current;
    const squareEl = squareRefs.current.get(session.permalink);
    const popoverEl = popoverRef.current;
    if (!figureEl || !squareEl || !popoverEl) return null;

    const figureRect = figureEl.getBoundingClientRect();
    const squareRect = squareEl.getBoundingClientRect();
    const popoverWidth = popoverEl.offsetWidth;
    const popoverHeight = popoverEl.offsetHeight;
    if (popoverWidth === 0 || popoverHeight === 0) return null;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const navbarBottom = getNavbarBottom();

    // Hide the floating preview when its anchor square is scrolled under the navbar or offscreen.
    if (
      squareRect.bottom <= navbarBottom + 2 ||
      squareRect.top >= viewportHeight - 2 ||
      squareRect.right <= 0 ||
      squareRect.left >= viewportWidth
    ) {
      return null;
    }

    const gap = 10;
    const viewportMargin = 12;
    const topBound = navbarBottom + 8;
    const bottomBound = viewportHeight - viewportMargin;

    const centerX = squareRect.left + squareRect.width / 2 - figureRect.left;
    const minLeft = viewportMargin - figureRect.left;
    const maxLeft = viewportWidth - viewportMargin - popoverWidth - figureRect.left;
    const desiredLeft = centerX - popoverWidth / 2;
    const left = Math.round(
      maxLeft < minLeft ? minLeft : Math.max(minLeft, Math.min(desiredLeft, maxLeft)),
    );

    const spaceAbove = squareRect.top - gap - topBound;
    const spaceBelow = bottomBound - (squareRect.bottom + gap);
    const fitsAbove = spaceAbove >= popoverHeight;
    const fitsBelow = spaceBelow >= popoverHeight;

    let placement: 'top' | 'bottom';
    let viewportTop: number;
    let showArrow = true;

    if (fitsAbove) {
      placement = 'top';
      viewportTop = squareRect.top - gap - popoverHeight;
    } else if (fitsBelow) {
      placement = 'bottom';
      viewportTop = squareRect.bottom + gap;
    } else {
      // Neither side fits completely: choose the roomier side and clamp within viewport bounds.
      placement = spaceAbove >= spaceBelow ? 'top' : 'bottom';
      const rawTop =
        placement === 'top' ? squareRect.top - gap - popoverHeight : squareRect.bottom + gap;
      const maxTop = Math.max(topBound, bottomBound - popoverHeight);
      viewportTop = Math.max(topBound, Math.min(rawTop, maxTop));
      showArrow = false;
    }

    const top = Math.round(viewportTop - figureRect.top);
    const arrowX = Math.round(Math.max(14, Math.min(centerX - left, popoverWidth - 14)));
    return {left, top, arrowX, placement, showArrow};
  }, [figureRef, session.permalink, squareRefs]);

  useIsomorphicLayoutEffect(() => {
    const applyPosition = () => {
      const next = computePosition();
      setPopoverPos((prev) => {
        if (!prev && !next) return prev;
        if (
          prev &&
          next &&
          prev.left === next.left &&
          prev.top === next.top &&
          prev.arrowX === next.arrowX &&
          prev.placement === next.placement &&
          prev.showArrow === next.showArrow
        ) {
          return prev;
        }
        return next;
      });
    };

    applyPosition();

    let rafId = 0;
    const scheduleUpdate = () => {
      if (rafId !== 0) return;
      rafId = window.requestAnimationFrame(() => {
        rafId = 0;
        applyPosition();
      });
    };

    window.addEventListener('resize', scheduleUpdate);
    window.addEventListener('scroll', scheduleUpdate, {passive: true});
    return () => {
      if (rafId !== 0) window.cancelAnimationFrame(rafId);
      window.removeEventListener('resize', scheduleUpdate);
      window.removeEventListener('scroll', scheduleUpdate);
    };
  }, [computePosition]);

  return (
    <div
      ref={popoverRef}
      aria-hidden="true"
      className={styles.popover}
      data-placement={popoverPos?.placement ?? 'top'}
      data-arrow={popoverPos?.showArrow === false ? 'false' : 'true'}
      style={
        popoverPos
          ? ({
              left: `${popoverPos.left}px`,
              top: `${popoverPos.top}px`,
              '--arrow-x': `${popoverPos.arrowX}px`,
            } as CSSProperties)
          : {visibility: 'hidden'}
      }>
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
    <>
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
    </>
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

  const sessionByPermalink = useMemo(() => {
    const map = new Map<string, RecordSession>();
    for (const column of columns) {
      for (const session of column.sessions) {
        map.set(session.permalink, session);
      }
    }
    return map;
  }, [columns]);

  const firstPermalink = useMemo(
    () => columns.find((c) => c.sessions.length > 0)?.sessions[0]?.permalink ?? null,
    [columns],
  );

  const [hoveredPermalink, setHoveredPermalink] = useState<string | null>(null);
  const [focusedPermalink, setFocusedPermalink] = useState<string | null>(null);
  const [previewSource, setPreviewSource] = useState<'hover' | 'focus'>('hover');
  const [dismissedFocusPermalink, setDismissedFocusPermalink] = useState<string | null>(null);
  const [selectedPermalink, setSelectedPermalink] = useState<string | null>(null);
  const [activeTabPermalink, setActiveTabPermalink] = useState<string | null>(null);

  const figureRef = useRef<HTMLElement | null>(null);
  const detailsBarRef = useRef<HTMLDivElement | null>(null);
  const squareRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const pendingPointerRef = useRef<PendingPointer | null>(null);
  const suppressNextFocusPreviewRef = useRef<string | null>(null);
  const keyboardHintId = useId();

  const effectiveTabPermalink =
    activeTabPermalink && sessionByPermalink.has(activeTabPermalink)
      ? activeTabPermalink
      : firstPermalink;

  const selectedSession = selectedPermalink
    ? sessionByPermalink.get(selectedPermalink) ?? null
    : null;

  const activeFocusedPermalink =
    focusedPermalink &&
    focusedPermalink !== dismissedFocusPermalink &&
    focusedPermalink !== selectedPermalink
      ? focusedPermalink
      : null;

  const popoverPermalink =
    previewSource === 'focus'
      ? activeFocusedPermalink ?? hoveredPermalink
      : hoveredPermalink ?? activeFocusedPermalink;

  const popoverSession = popoverPermalink
    ? sessionByPermalink.get(popoverPermalink) ?? null
    : null;

  const registerSquare = useCallback((permalink: string, node: HTMLAnchorElement | null) => {
    if (node) squareRefs.current.set(permalink, node);
    else squareRefs.current.delete(permalink);
  }, []);

  const closeDetailsBar = useCallback(
    (restoreFocus: boolean) => {
      const current = selectedPermalink;
      setSelectedPermalink(null);
      if (restoreFocus && current) {
        suppressNextFocusPreviewRef.current = current;
        setDismissedFocusPermalink(current);
        squareRefs.current.get(current)?.focus({preventScroll: true});
      }
    },
    [selectedPermalink],
  );

  // Dismiss any open preview (hovered, focused, or touch details bar) on Escape from anywhere.
  useEffect(() => {
    if (!popoverPermalink && !selectedPermalink) return;

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      if (selectedPermalink) {
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
  }, [closeDetailsBar, focusedPermalink, popoverPermalink, selectedPermalink]);

  // Dismiss the touch details bar when tapping outside the chart.
  useEffect(() => {
    if (!selectedPermalink) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (figureRef.current && !figureRef.current.contains(event.target as Node)) {
        setSelectedPermalink(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
    };
  }, [selectedPermalink]);

  // Reveal the details bar with the minimum necessary scroll if it opens offscreen.
  useEffect(() => {
    if (!selectedPermalink || !detailsBarRef.current) return;
    const rect = detailsBarRef.current.getBoundingClientRect();
    const navbarBottom = getNavbarBottom();
    if (rect.bottom > window.innerHeight - 12 || rect.top < navbarBottom + 8) {
      const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      detailsBarRef.current.scrollIntoView({
        block: 'nearest',
        behavior: reducedMotion ? 'auto' : 'smooth',
      });
    }
  }, [selectedPermalink]);

  const focusSquare = useCallback((permalink: string) => {
    pendingPointerRef.current = null;
    setHoveredPermalink(null);
    setActiveTabPermalink(permalink);
    setDismissedFocusPermalink(null);
    setPreviewSource('focus');
    squareRefs.current.get(permalink)?.focus();
  }, []);

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
        for (let c = columns.length - 1; c >= 0; c--) {
          const lastCol = columns[c];
          if (lastCol.sessions.length > 0) {
            targetPermalink = lastCol.sessions[lastCol.sessions.length - 1].permalink;
            break;
          }
        }
      } else {
        return;
      }

      event.preventDefault();
      if (targetPermalink) {
        focusSquare(targetPermalink);
      }
    },
    [columns, firstPermalink, focusSquare],
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
      if (event.pointerType === 'touch') return;
      setHoveredPermalink(permalink);
      setPreviewSource('hover');
    },
    [],
  );

  const handleSquarePointerLeave = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, permalink: string) => {
      if (event.pointerType === 'touch') return;
      setHoveredPermalink((prev) => (prev === permalink ? null : prev));
    },
    [],
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

    const pending = pendingPointerRef.current;
    const isRecentTouchFocus =
      pending !== null &&
      pending.permalink === permalink &&
      pending.pointerType === 'touch' &&
      performance.now() - pending.timestamp < 1000;

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
      const pending = pendingPointerRef.current;
      pendingPointerRef.current = null;

      // Keyboard activations (Enter/Space) have detail === 0 and must always follow the link.
      if (event.detail === 0) return;

      const nativePointerType =
        'pointerType' in event.nativeEvent
          ? (event.nativeEvent as globalThis.PointerEvent).pointerType
          : '';
      const effectivePointerType =
        nativePointerType ||
        (pending && pending.permalink === permalink ? pending.pointerType : '');
      const isTouchInteraction =
        effectivePointerType === 'touch' ||
        (effectivePointerType === '' && isCoarsePointerDevice());

      if (isTouchInteraction) {
        event.preventDefault();
        setHoveredPermalink(null);
        setActiveTabPermalink(permalink);
        setSelectedPermalink((prev) => (prev === permalink ? null : permalink));
      }
    },
    [],
  );

  return (
    <figure
      ref={figureRef}
      className={clsx(styles.record, className)}
      style={{'--columns': columns.length} as CSSProperties}
      data-bleed={columns.length > 10 || undefined}
      aria-label="Talks, workshops, and webinars per year">
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
                      isSelected={selectedPermalink === session.permalink}
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

      {popoverSession && (
        <SessionPopover
          session={popoverSession}
          figureRef={figureRef}
          squareRefs={squareRefs}
        />
      )}

      {selectedSession && (
        <div
          ref={detailsBarRef}
          className={styles.detailsBar}
          role="region"
          aria-label="Selected session details"
          aria-live="polite">
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
          <button
            type="button"
            className={styles.detailsClose}
            aria-label="Close session details"
            onClick={() => closeDetailsBar(true)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

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
              ? 'Hover or focus a square to preview, click to open, or choose a year below.'
              : 'Hover or focus a square to preview; click to open.'}
          </span>
          <span className={styles.hintTouch}>
            {yearLink
              ? 'Tap a square for details, or choose a year to jump below.'
              : 'Tap a square for session details.'}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
