import React, {type ReactNode, useEffect, useRef} from 'react';
import NavbarMobileSidebar from '@theme-original/Navbar/MobileSidebar';
import type NavbarMobileSidebarType from '@theme/Navbar/MobileSidebar';
import type {WrapperProps} from '@docusaurus/types';
import {useNavbarMobileSidebar} from '@docusaurus/theme-common/internal';

type Props = WrapperProps<typeof NavbarMobileSidebarType>;

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
      if (event.key === 'Escape') sidebar.toggle();
    };
    document.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      background.forEach((el) => el.removeAttribute('inert'));
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [sidebar.shown, sidebar.toggle]);

  return <NavbarMobileSidebar {...props} />;
}
