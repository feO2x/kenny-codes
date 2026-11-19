import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import type {Props} from '@theme/Tag';

/** A tag pill. Styled globally by `.kc-tag` in src/css/custom.css. */
export default function Tag({permalink, label, count, description}: Props): ReactNode {
  return (
    <Link rel="tag" href={permalink} title={description} className="kc-tag">
      {label}
      {count !== undefined && (
        <span className="kc-tag__count">
          <span className="kc-sr-only">, </span>
          {count}
        </span>
      )}
    </Link>
  );
}
