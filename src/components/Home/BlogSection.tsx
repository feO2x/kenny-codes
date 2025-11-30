import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Heading from '@theme/Heading';
import styles from '@site/src/css/section.module.css';
import homeData from '@site/src/data/home-data.json';
import ContentCard from '../ContentCard';

export default function BlogSection() {
  const {recentPosts} = homeData;

  return (
    <section className={clsx(styles.section, styles.sectionDark)}>
      <div className="container">
        <Heading as="h2" className={styles.sectionTitle}>
          Latest Insights
        </Heading>
        <div className={styles.cardGrid}>
          {recentPosts.map((post, idx) => (
            <ContentCard
              key={idx}
              title={post.title}
              link={post.link}
              date={new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              tags={post.tags}
              excerpt={post.excerpt}
            />
          ))}
        </div>

        <div className="text--center margin-top--lg">
          <Link to="/blog" className="button button--info button--lg">
            View All Posts
          </Link>
        </div>
      </div>
    </section>
  );
}
