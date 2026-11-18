import React, {type ReactNode, useEffect, useRef} from 'react';
import NavbarMobileSidebar from '@theme-original/Navbar/MobileSidebar';
import type NavbarMobileSidebarType from '@theme/Navbar/MobileSidebar';
import type {WrapperProps} from '@docusaurus/types';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';

type Props = WrapperProps<typeof NavbarMobileSidebarType>;

/** Visible, focusable elements inside the drawer's active panel and header. */
function drawerFocusables(): HTMLElement[] {
  return Array.from(
    document.querySelectorAll<HTMLElement>(
      '.navbar-sidebar a[href], .navbar-sidebar button:not([disabled])',
    ),
  ).filter((el) => el.offsetParent !== null && !el.closest('[inert]'));
}

/** Everything on the page except the open drawer, which must not receive focus meanwhile. */
function backgroundElements(): HTMLElement[] {
  const root = document.getElementById('__docusaurus');
  if (!root) return [];
  const navbar = root.querySelector<HTMLElement>('nav.navbar');
  const outsideNavbar = Array.from(root.children).filter(
    (el): el is HTMLElement => el instanceof HTMLElement && el !== navbar,
  );
  const navbarInner = navbar?.querySelector<HTMLElement>('.navbar__inner');
  return navbarInner ? [...outsideNavbar, navbarInner] : outsideNavbar;
}

/**
 * Makes the mobile navigation a proper modal for keyboard users: focus moves into the drawer,
 * the page behind it is inert, Escape closes it, and focus returns to the menu button.
 */
export default function NavbarMobileSidebarWrapper(props: Props): ReactNode {
  const sidebar = useNavbarMobileSidebar();
  const wasShown = useRef(false);

  useEffect(() => {
    if (!sidebar.shown) {
      if (wasShown.current) {
        wasShown.current = false;
        document.querySelector<HTMLElement>('.navbar__toggle')?.focus();
      }
      return undefined;
    }

    wasShown.current = true;
    const drawer = document.querySelector<HTMLElement>('.navbar-sidebar');
    drawer?.setAttribute('role', 'dialog');
    drawer?.setAttribute('aria-modal', 'true');
    drawer?.setAttribute('aria-label', 'Site navigation');
    const background = backgroundElements();
    background.forEach((el) => el.setAttribute('inert', ''));
    // The drawer is still `visibility: hidden` for the first frames of its slide-in transition,
    // and hidden elements cannot take focus, so retry for a few frames until it succeeds.
    let frame = 0;
    let attempts = 0;
    const focusClose = () => {
      const close = document.querySelector<HTMLElement>('.navbar-sidebar .navbar-sidebar__close');
      close?.focus();
      if (document.activeElement !== close && attempts++ < 30) {
        frame = requestAnimationFrame(focusClose);
      }
    };
    frame = requestAnimationFrame(focusClose);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        sidebar.toggle();
        return;
      }
      if (event.key !== 'Tab') return;
      // Keep Tab cycling inside the drawer instead of escaping to the browser chrome.
      const focusable = drawerFocusables();
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!focusable.includes(document.activeElement as HTMLElement)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener('keydown', onKeyDown);

    // Switching between the main menu and the docs panel hides the focused button. Move focus to
    // the first item of the panel that is now visible.
    const onClick = () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(() => {
          const focusable = drawerFocusables();
          if (!focusable.includes(document.activeElement as HTMLElement)) {
            const panelItem = focusable.find((el) => el.closest('.navbar-sidebar__items'));
            (panelItem ?? focusable[0])?.focus();
          }
        }),
      );
    };
    drawer?.addEventListener('click', onClick);

    return () => {
      drawer?.removeEventListener('click', onClick);
      cancelAnimationFrame(frame);
      drawer?.removeAttribute('role');
      drawer?.removeAttribute('aria-modal');
      drawer?.removeAttribute('aria-label');
      background.forEach((el) => el.removeAttribute('inert'));
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebar.shown, sidebar.toggle]);

  return <NavbarMobileSidebar {...props} />;
}
