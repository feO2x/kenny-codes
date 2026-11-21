import React, {
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
  /** Where a year label with only upcoming sessions (and the upcoming legend item) links to. */
  upcomingLink?: string;
  className?: string;
}

interface RecordSession extends RecordEvent {
  id: string;
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
    const toSession = (event: RecordEvent, isUpcoming: boolean, index: number): RecordSession => ({
      ...event,
      id: `${year}-${isUpcoming ? 'u' : 'd'}-${index}-${event.permalink}`,
      isUpcoming,
      formattedDate: formatDate(event.date),
      venue: formatVenue(event),
      format: formatSessionMeta(event),
    });

    const delivered = [...bucket.delivered]
      .sort(compareSessionsAsc)
      .map((event, index) => toSession(event, false, index));
    const upcoming = [...bucket.upcoming]
      .sort(compareSessionsAsc)
      .map((event, index) => toSession(event, true, index));

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

  const sessionById = useMemo(() => {
    const map = new Map<string, RecordSession>();
    for (const column of columns) {
      for (const session of column.sessions) {
        map.set(session.id, session);
      }
    }
    return map;
  }, [columns]);

  const firstSessionId = useMemo(
    () => columns.find((c) => c.sessions.length > 0)?.sessions[0]?.id ?? null,
    [columns],
  );

  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [dismissedFocusId, setDismissedFocusId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTabId, setActiveTabId] = useState<string | null>(null);
  const [popoverPos, setPopoverPos] = useState<PopoverPosition | null>(null);

  const figureRef = useRef<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const squareRefs = useRef<Map<string, HTMLAnchorElement>>(new Map());
  const lastPointerTypeRef = useRef<string>('');
  const popoverId = useId();

  const effectiveTabId = activeTabId && sessionById.has(activeTabId) ? activeTabId : firstSessionId;
  const selectedSession = selectedId ? sessionById.get(selectedId) ?? null : null;

  const popoverSessionId =
    hoveredId ??
    (focusedId && focusedId !== dismissedFocusId && focusedId !== selectedId ? focusedId : null);
  const popoverSession = popoverSessionId ? sessionById.get(popoverSessionId) ?? null : null;

  const updatePopoverPosition = useCallback(() => {
    if (!popoverSessionId) {
      setPopoverPos(null);
      return;
    }
    const figureEl = figureRef.current;
    const squareEl = squareRefs.current.get(popoverSessionId);
    const popoverEl = popoverRef.current;
    if (!figureEl || !squareEl || !popoverEl) return;

    const figureRect = figureEl.getBoundingClientRect();
    const squareRect = squareEl.getBoundingClientRect();
    const popoverWidth = popoverEl.offsetWidth;
    const popoverHeight = popoverEl.offsetHeight;
    if (popoverWidth === 0 || popoverHeight === 0) return;

    const gap = 10;
    const viewportMargin = 12;
    const navbarBottom = Math.max(0, document.querySelector('.navbar')?.getBoundingClientRect().bottom ?? 0);

    const centerX = squareRect.left + squareRect.width / 2 - figureRect.left;
    const minLeft = viewportMargin - figureRect.left;
    const maxLeft = window.innerWidth - viewportMargin - popoverWidth - figureRect.left;
    const desiredLeft = centerX - popoverWidth / 2;
    const left =
      maxLeft < minLeft ? minLeft : Math.max(minLeft, Math.min(desiredLeft, maxLeft));

    const fitsAbove = squareRect.top - gap - popoverHeight >= navbarBottom + 8;
    const placement: 'top' | 'bottom' = fitsAbove ? 'top' : 'bottom';
    const top = fitsAbove
      ? squareRect.top - figureRect.top - popoverHeight - gap
      : squareRect.bottom - figureRect.top + gap;

    const arrowX = Math.max(14, Math.min(centerX - left, popoverWidth - 14));
    setPopoverPos({left, top, arrowX, placement});
  }, [popoverSessionId]);

  useIsomorphicLayoutEffect(() => {
    updatePopoverPosition();
    if (!popoverSessionId) return;

    const handleReposition = () => updatePopoverPosition();
    window.addEventListener('resize', handleReposition);
    window.addEventListener('scroll', handleReposition, {passive: true});
    return () => {
      window.removeEventListener('resize', handleReposition);
      window.removeEventListener('scroll', handleReposition);
    };
  }, [popoverSessionId, updatePopoverPosition]);

  useEffect(() => {
    if (!selectedId) return;

    const handleOutsidePointerDown = (event: globalThis.PointerEvent) => {
      if (figureRef.current && !figureRef.current.contains(event.target as Node)) {
        setSelectedId(null);
      }
    };
    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setSelectedId(null);
      }
    };
    document.addEventListener('pointerdown', handleOutsidePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handleOutsidePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [selectedId]);

  const focusSquare = useCallback((id: string) => {
    setActiveTabId(id);
    setDismissedFocusId(null);
    squareRefs.current.get(id)?.focus();
  }, []);

  const handleSquareKeyDown = useCallback(
    (event: KeyboardEvent<HTMLAnchorElement>, colIndex: number, rowIndex: number) => {
      const {key} = event;
      if (key === 'Escape') {
        if (selectedId) setSelectedId(null);
        if (focusedId) setDismissedFocusId(focusedId);
        if (hoveredId) setHoveredId(null);
        return;
      }

      const currentColumn = columns[colIndex];
      if (!currentColumn) return;

      let targetId: string | null = null;

      if (key === 'ArrowUp') {
        targetId = currentColumn.sessions[rowIndex + 1]?.id ?? null;
      } else if (key === 'ArrowDown') {
        targetId = currentColumn.sessions[rowIndex - 1]?.id ?? null;
      } else if (key === 'ArrowRight') {
        for (let c = colIndex + 1; c < columns.length; c++) {
          const nextCol = columns[c];
          if (nextCol.sessions.length > 0) {
            targetId = nextCol.sessions[Math.min(rowIndex, nextCol.sessions.length - 1)].id;
            break;
          }
        }
      } else if (key === 'ArrowLeft') {
        for (let c = colIndex - 1; c >= 0; c--) {
          const prevCol = columns[c];
          if (prevCol.sessions.length > 0) {
            targetId = prevCol.sessions[Math.min(rowIndex, prevCol.sessions.length - 1)].id;
            break;
          }
        }
      } else if (key === 'Home') {
        targetId = firstSessionId;
      } else if (key === 'End') {
        for (let c = columns.length - 1; c >= 0; c--) {
          const lastCol = columns[c];
          if (lastCol.sessions.length > 0) {
            targetId = lastCol.sessions[lastCol.sessions.length - 1].id;
            break;
          }
        }
      } else {
        return;
      }

      event.preventDefault();
      if (targetId) {
        focusSquare(targetId);
      }
    },
    [columns, firstSessionId, focusSquare, focusedId, hoveredId, selectedId],
  );

  const handleSquarePointerDown = useCallback((event: PointerEvent<HTMLAnchorElement>) => {
    lastPointerTypeRef.current = event.pointerType;
  }, []);

  const handleSquarePointerEnter = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, id: string) => {
      if (event.pointerType === 'touch') return;
      setHoveredId(id);
      setDismissedFocusId(null);
    },
    [],
  );

  const handleSquarePointerLeave = useCallback(
    (event: PointerEvent<HTMLAnchorElement>, id: string) => {
      if (event.pointerType === 'touch') return;
      setHoveredId((prev) => (prev === id ? null : prev));
    },
    [],
  );

  const handleSquareClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, id: string) => {
      const isTouchInteraction =
        lastPointerTypeRef.current === 'touch' ||
        (lastPointerTypeRef.current === '' && event.detail > 0 && isCoarsePointerDevice());

      if (isTouchInteraction) {
        event.preventDefault();
        setHoveredId(null);
        setActiveTabId(id);
        setSelectedId((prev) => (prev === id ? null : id));
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
                  {column.sessions.map((session, i) => {
                    const isHoveredOrFocused = popoverSessionId === session.id;
                    const isSelected = selectedId === session.id;
                    const ariaLabel = [
                      session.title,
                      session.formattedDate,
                      session.isUpcoming ? 'Upcoming' : '',
                      session.venue,
                    ]
                      .filter(Boolean)
                      .join(' — ');

                    return (
                      <Link
                        key={session.id}
                        ref={(node) => {
                          if (node) squareRefs.current.set(session.id, node);
                          else squareRefs.current.delete(session.id);
                        }}
                        to={session.permalink}
                        tabIndex={session.id === effectiveTabId ? 0 : -1}
                        className={clsx(
                          styles.square,
                          styles.squareLink,
                          session.isUpcoming && styles.squareUpcoming,
                          (isHoveredOrFocused || isSelected) && styles.squareActive,
                        )}
                        style={{'--i': i} as CSSProperties}
                        aria-label={ariaLabel}
                        aria-describedby={isHoveredOrFocused ? popoverId : undefined}
                        aria-current={isSelected ? 'true' : undefined}
                        onPointerDown={handleSquarePointerDown}
                        onPointerEnter={(e) => handleSquarePointerEnter(e, session.id)}
                        onPointerLeave={(e) => handleSquarePointerLeave(e, session.id)}
                        onFocus={() => {
                          setActiveTabId(session.id);
                          if (lastPointerTypeRef.current !== 'touch') {
                            setFocusedId(session.id);
                            setDismissedFocusId(null);
                          }
                        }}
                        onBlur={() => {
                          setFocusedId((prev) => (prev === session.id ? null : prev));
                        }}
                        onKeyDown={(e) => handleSquareKeyDown(e, col, i)}
                        onClick={(e) => handleSquareClick(e, session.id)}
                      />
                    );
                  })}
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
        <div
          ref={popoverRef}
          id={popoverId}
          role="tooltip"
          className={styles.popover}
          data-placement={popoverPos?.placement ?? 'top'}
          style={
            popoverPos
              ? ({
                  left: `${popoverPos.left}px`,
                  top: `${popoverPos.top}px`,
                  '--arrow-x': `${popoverPos.arrowX}px`,
                } as CSSProperties)
              : {visibility: 'hidden'}
          }>
          <div className={styles.cardHeader}>
            <time className={styles.cardDate} dateTime={popoverSession.date.slice(0, 10)}>
              {popoverSession.formattedDate}
            </time>
            {popoverSession.isUpcoming && <span className={styles.badgeUpcoming}>Upcoming</span>}
          </div>
          <p className={styles.cardTitle}>{popoverSession.title}</p>
          {popoverSession.venue && <p className={styles.cardVenue}>{popoverSession.venue}</p>}
          {popoverSession.format && <p className={styles.cardFormat}>{popoverSession.format}</p>}
        </div>
      )}

      {selectedSession && (
        <div
          className={styles.detailsBar}
          role="region"
          aria-label="Selected session details"
          aria-live="polite">
          <div className={styles.detailsBody}>
            <div className={styles.cardHeader}>
              <time className={styles.cardDate} dateTime={selectedSession.date.slice(0, 10)}>
                {selectedSession.formattedDate}
              </time>
              {selectedSession.isUpcoming && <span className={styles.badgeUpcoming}>Upcoming</span>}
            </div>
            <Link to={selectedSession.permalink} className={styles.detailsTitleLink}>
              <span>{selectedSession.title}</span>
              <span className={styles.detailsArrow} aria-hidden="true">
                →
              </span>
            </Link>
            {selectedSession.venue && <p className={styles.cardVenue}>{selectedSession.venue}</p>}
            {selectedSession.format && <p className={styles.cardFormat}>{selectedSession.format}</p>}
          </div>
          <button
            type="button"
            className={styles.detailsClose}
            aria-label="Close session details"
            onClick={() => setSelectedId(null)}>
            <span aria-hidden="true">×</span>
          </button>
        </div>
      )}

      <figcaption className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={styles.square} aria-hidden="true" /> One talk, workshop, or webinar
        </span>
        {hasUpcoming &&
          (upcomingLink ? (
            <Link to={upcomingLink} className={clsx(styles.legendItem, styles.legendLink)}>
              <span className={clsx(styles.square, styles.squareUpcoming)} aria-hidden="true" /> Upcoming
              sessions
            </Link>
          ) : (
            <span className={styles.legendItem}>
              <span className={clsx(styles.square, styles.squareUpcoming)} aria-hidden="true" /> Upcoming
            </span>
          ))}
        <span>
          {yearLink
            ? 'Select a square for session details, or a year to jump below.'
            : 'Select a square for session details.'}
        </span>
      </figcaption>
    </figure>
  );
}
