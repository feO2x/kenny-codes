import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import {useLocation} from '@docusaurus/router';
import useBaseUrl from '@docusaurus/useBaseUrl';
import {isRegexpStringMatch} from '@docusaurus/theme-common';
import DropdownNavbarItemDesktop from '@theme-original/NavbarItem/DropdownNavbarItem/Desktop';
import type DropdownNavbarItemDesktopType from '@theme/NavbarItem/DropdownNavbarItem/Desktop';
import type {WrapperProps} from '@docusaurus/types';

type Props = WrapperProps<typeof DropdownNavbarItemDesktopType>;

/**
 * The stock desktop dropdown never marks itself active. Mark it when the current page matches
 * one of its items' `activeBaseRegex` (paths without baseUrl), as the mobile dropdown does.
 */
export default function DropdownNavbarItemDesktopWrapper(props: Props): ReactNode {
  const {pathname} = useLocation();
  const baseUrl = useBaseUrl('/');
  const localPathname = pathname.startsWith(baseUrl) ? `/${pathname.slice(baseUrl.length)}` : pathname;
  const isActive = props.items.some((item) =>
    isRegexpStringMatch((item as {activeBaseRegex?: string}).activeBaseRegex, localPathname),
  );
  return (
    <DropdownNavbarItemDesktop
      {...props}
      className={clsx(props.className, isActive && 'navbar__link--active')}
    />
  );
}
