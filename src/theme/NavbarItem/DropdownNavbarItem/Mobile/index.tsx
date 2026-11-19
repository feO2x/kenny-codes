import React, {type ReactNode, useEffect, useId} from 'react';
import clsx from 'clsx';
import {Collapsible, useCollapsible, isRegexpStringMatch} from '@docusaurus/theme-common';
import {useLocalPathname} from '@docusaurus/theme-common/internal';
import NavbarItem from '@theme/NavbarItem';
import type {Props} from '@theme/NavbarItem/DropdownNavbarItem/Mobile';

/**
 * The drawer version of a dropdown as one native disclosure button (the stock component splits it
 * into a link and a separate caret button). It starts expanded on pages that belong to it.
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
  const {collapsed, toggleCollapsed, setCollapsed} = useCollapsible({
    initialState: () => !containsActive,
  });
  const listId = useId();

  useEffect(() => {
    if (containsActive) setCollapsed(false);
  }, [containsActive, setCollapsed]);

  return (
    <li className={clsx('menu__list-item', {'menu__list-item--collapsed': collapsed})}>
      <button
        type="button"
        className={clsx('clean-btn', 'menu__link', 'menu__link--sublist', 'menu__link--sublist-caret', 'kc-menu-disclosure', className, {
          'menu__link--active': containsActive,
        })}
        aria-expanded={!collapsed}
        aria-controls={listId}
        onClick={toggleCollapsed}>
        {children ?? label}
      </button>
      <div id={listId}>
        <Collapsible lazy as="ul" className="menu__list" collapsed={collapsed}>
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
        </Collapsible>
      </div>
    </li>
  );
}
