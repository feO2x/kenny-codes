import React, {type ReactNode, useEffect, useId, useState} from 'react';
import clsx from 'clsx';
import {isRegexpStringMatch} from '@docusaurus/theme-common';
import {useLocalPathname} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem/Mobile';

/**
 * The drawer version of a dropdown as one native disclosure button (the stock component splits it
 * into a link and a separate caret button). It starts expanded on pages that belong to it.
 *
 * The list is always mounted and hidden with the `hidden` attribute, so what Tab can reach always
 * matches `aria-expanded`; an animated collapse would leave links focusable while it runs.
 */
export default function DropdownNavbarItemMobile({
  items,
  className,
  onClick,
  label,
  children,
}: Props): ReactNode {
  const localPathname = useLocalPathname();
  const containsActive = items.some((item) =>
    isRegexpStringMatch((item as {activeBaseRegex?: string}).activeBaseRegex, localPathname),
  );
  const [expanded, setExpanded] = useState(containsActive);
  const listId = useId();

  useEffect(() => {
    if (containsActive) setExpanded(true);
  }, [containsActive]);

  return (
    <li className={clsx('menu__list-item', {'menu__list-item--collapsed': !expanded})}>
      <button
        type="button"
        className={clsx('clean-btn', 'menu__link', 'menu__link--sublist', 'menu__link--sublist-caret', 'kc-menu-disclosure', className, {
          'menu__link--active': containsActive,
        })}
        aria-expanded={expanded}
        aria-controls={listId}
        onClick={() => setExpanded((value) => !value)}>
        {children ?? label}
      </button>
      <ul id={listId} className="menu__list" hidden={!expanded}>
        {items.map((childItemProps, i) => (
          <NavbarItem
            mobile
            isDropdownItem
            onClick={onClick}
            activeClassName="menu__link--active"
            {...childItemProps}
            key={i}
          />
        ))}
      </ul>
    </li>
  );
}
