import React, {type ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import type {Props} from '@theme/NotFound/Content';

const destinations = [
  {to: '/', label: 'Home'},
  {to: '/blog', label: 'Blog'},
  {to: '/events', label: 'Talks and workshops'},
  {to: '/docs/guided-coding', label: 'Guided Coding guide'},
  {to: '/docs/chack', label: 'CHACK guide'},
];

export default function NotFoundContent({className}: Props): ReactNode {
  return (
    <main className={clsx('container kc-page', className)}>
      <header className="kc-page-header">
        <Heading as="h1" className="kc-page-title">
          This page doesn’t exist (anymore)
        </Heading>
        <p className="kc-page-lede">
          The link may be outdated, or the page moved. One of these will get you back on track.
        </p>
      </header>
      <nav aria-label="Main sections">
        <ul className="kc-tags__list kc-tag-cloud">
          {destinations.map(({to, label}) => (
            <li key={to}>
              <Link to={to} className="kc-tag">
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </main>
  );
}
