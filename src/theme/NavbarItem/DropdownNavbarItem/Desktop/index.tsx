import React, {type ReactNode, useEffect, useId, useRef, useState} from 'react';
import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {isRegexpStringMatch} from '@docusaurus/theme-common';
import NavbarItem from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem/Desktop';

/** Whether the current page belongs to one of the dropdown's items (`activeBaseRegex`, no baseUrl). */
function useContainsActivePage(items: Props['items']): boolean {
  const {pathname} = useLocation();
  const baseUrl = useBaseUrl('/');
  const localPathname = pathname.startsWith(baseUrl) ? `/${pathname.slice(baseUrl.length)}` : pathname;
  return items.some((item) =>
    isRegexpStringMatch((item as {activeBaseRegex?: string}).activeBaseRegex, localPathname),
  );
}

/**
 * A disclosure menu replacing the stock hover dropdown. One state drives both visibility and
 * `aria-expanded`: a click or tap toggles it, mouse hover opens it, and Escape, an outside click,
 * moving focus away, or navigating closes it. The trigger is marked active on matching pages.
 */
export default function DropdownNavbarItemDesktop({
  items,
  position,
  className,
  label,
  children,
}: Props): ReactNode {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();
  const isActive = useContainsActivePage(items);
  const {pathname} = useLocation();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return undefined;
    const closeIfOutside = (event: Event) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        // Only pull focus back when it was in the menu; a hover-opened menu leaves focus alone.
        const focusInside = containerRef.current?.contains(document.activeElement);
        setOpen(false);
        if (focusInside) buttonRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', closeIfOutside);
    document.addEventListener('touchstart', closeIfOutside);
    document.addEventListener('focusin', closeIfOutside);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', closeIfOutside);
      document.removeEventListener('touchstart', closeIfOutside);
      document.removeEventListener('focusin', closeIfOutside);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  // Mouse hover opens the menu; a click after hovering keeps it open instead of toggling it shut.
  const openedByHover = useRef(false);
  const onPointer = (shouldOpen: boolean) => (event: React.PointerEvent) => {
    if (event.pointerType !== 'mouse') return;
    // Keyboard users may be inside the menu while the pointer wanders off; keep it open for them.
    const focusInMenu = containerRef.current?.querySelector('.dropdown__menu')?.contains(document.activeElement);
    if (!shouldOpen && focusInMenu) return;
    openedByHover.current = shouldOpen;
    setOpen(shouldOpen);
  };
  const onClick = () => {
    if (openedByHover.current) {
      openedByHover.current = false;
      setOpen(true);
    } else {
      setOpen((value) => !value);
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx('navbar__item', 'dropdown', 'kc-disclosure', {
        'dropdown--right': position === 'right',
        'dropdown--show': open,
      })}
      onPointerEnter={onPointer(true)}
      onPointerLeave={onPointer(false)}>
      <button
        ref={buttonRef}
        type="button"
        className={clsx('clean-btn', 'navbar__link', className, isActive && 'navbar__link--active')}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={onClick}>
        {children ?? label}
      </button>
      <ul id={menuId} className="dropdown__menu">
        {items.map((childItemProps, i) => (
          <NavbarItem
            isDropdownItem
            activeClassName="dropdown__link--active"
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </div>
  );
}
