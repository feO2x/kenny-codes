import React, {memo, type ReactNode} from 'react';
import {useThemeConfig} from '@docusaurus/theme-common';
import {groupBlogSidebarItemsByYear} from '@docusaurus/plugin-content-blog/client';
import type {Props} from '@theme/BlogSidebar/Content';

/**
 * Same as the stock component, except that year labels are not headings: the sidebar comes
 * before the page's h1, so year h3s would break the heading order.
 */
function BlogSidebarContent({items, yearGroupHeadingClassName, ListComponent}: Props): ReactNode {
  const themeConfig = useThemeConfig();
  if (!themeConfig.blog.sidebar.groupByYear) {
    return <ListComponent items={items} />;
  }
  return (
    <>
      {groupBlogSidebarItemsByYear(items).map(([year, yearItems]) => (
        <div key={year} role="group" aria-label={year}>
          <p className={yearGroupHeadingClassName} aria-hidden="true">
            {year}
          </p>
          <ListComponent items={yearItems} />
        </div>
      ))}
    </>
  );
}

export default memo(BlogSidebarContent);
