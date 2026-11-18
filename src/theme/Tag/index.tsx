import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/Tag';

/** A tag pill. Styled globally by `.kc-tag` in src/css/custom.css. */
export default function Tag({
  permalink,
  label,
  count,
  description,
  hideCount = false,
}: Props & {hideCount?: boolean}): ReactNode {
  return (
    <Link rel="tag" href={permalink} title={description} className="kc-tag">
      {label}
      {count !== undefined && !hideCount && <span className="kc-tag__count">{count}</span>}
    </Link>
  );
}
