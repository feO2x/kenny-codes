import React, {type ReactNode} from 'react';
import Tag from '@theme/Tag';
import type {Props} from '@theme/TagsListInline';

export default function TagsListInline({tags}: Props): ReactNode {
  return (
    <div className="kc-tags">
      <span className="kc-tags__label">Tags</span>
      <ul className="kc-tags__list">
        {tags.map((tag) => (
          <li key={tag.permalink}>
            <Tag {...tag} />
          </li>
        ))}
      </ul>
    </div>
  );
}
