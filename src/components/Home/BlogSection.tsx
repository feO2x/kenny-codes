import React, {type ReactNode} from 'react';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import homeData from '@site/src/data/home-data.json';
import {formatDate} from '@site/src/utils/dateFormatting';
import styles from './Home.module.css';

/** Excerpts are cut at 200 characters by the generator; trim to the last full word. */
function tidyExcerpt(excerpt: string): string {
  const text = excerpt.replace(/\s+/g, ' ').replace(/\.\.\.$/, '').trim();
  if (text.length < 190) return text;
  return `${text.slice(0, text.lastIndexOf(' '))}…`;
}

export default function BlogSection(): ReactNode {
  const {recentPosts} = homeData;

  return (
    <section className={styles.section} aria-labelledby="writing-title">
      <div className="container">
        <div className={styles.split}>
          <div className={styles.splitIntro}>
            <Heading as="h2" id="writing-title" className={styles.sectionTitle}>
              Writing
            </Heading>
            <p className={styles.sectionLede}>
              Articles on AI-assisted development, software design, and .NET.
            </p>
            <Link to="/blog" className={styles.textLink}>
              All articles
            </Link>
          </div>

          <div className={styles.splitList}>
            {recentPosts.map((post) => (
              <article key={post.link} className={styles.post}>
                <time className={styles.postDate} dateTime={post.date}>
                  {formatDate(post.date)}
                </time>
                <Heading as="h3" className={styles.postTitle}>
                  <Link to={post.link} className={styles.postLink}>
                    {post.title}
                  </Link>
                </Heading>
                <p className={styles.postExcerpt}>{tidyExcerpt(post.excerpt)}</p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
