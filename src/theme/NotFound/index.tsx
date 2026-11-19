import React, {type ReactNode} from 'react';
import {PageMetadata} from '@docusaurus/theme-common';
import Layout from '@theme/Layout';
import NotFoundContent from '@theme/NotFound/Content';

/** The stock 404 page with a sentence-case title and its own description. */
export default function NotFound(): ReactNode {
  return (
    <>
      <PageMetadata
        title="Page not found"
        description="This page does not exist on Kenny Codes. Find articles, talks, and the Guided Coding and CHACK guides from here."
      />
      <Layout>
        <NotFoundContent />
      </Layout>
    </>
  );
}
