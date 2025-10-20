import React, {type ReactNode} from 'react';
import clsx from 'clsx';

import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import {
  PageMetadata,
  HtmlClassNameProvider,
  ThemeClassNames,
} from '@docusaurus/theme-common';
import BlogLayout from '@theme/BlogLayout';
import BlogListPaginator from '@theme/BlogListPaginator';
import SearchMetadata from '@theme/SearchMetadata';
import type {Props} from '@theme/BlogListPage';
import BlogPostItems from '@theme/BlogPostItems';
import BlogListPageStructuredData from '@theme/BlogListPage/StructuredData';
import Layout from '@theme/Layout';
import HeaderWithImage from '@site/src/components/HeaderWithImage';
import EventCard from '@site/src/components/EventCard';
import styles from './styles.module.css';

function BlogListPageMetadata(props: Props): ReactNode {
  const {metadata} = props;
  const {
    siteConfig: {title: siteTitle},
  } = useDocusaurusContext();
  const {blogDescription, blogTitle, permalink} = metadata;
  const isBlogOnlyMode = permalink === '/';
  const title = isBlogOnlyMode ? siteTitle : blogTitle;
  return (
    <>
      <PageMetadata title={title} description={blogDescription} />
      <SearchMetadata tag="blog_posts_list" />
    </>
  );
}

function BlogListPageContent(props: Props): ReactNode {
  const {metadata, items, sidebar} = props;
  const isEventsPage = metadata.blogTitle === 'Events';

  if (isEventsPage) {
    // Custom layout for events page
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    };
    
    const upcomingEvents = items.filter(item => {
      const eventDate = new Date(item.content.metadata.date);
      return eventDate >= now;
    });
    
    const pastEvents = items.filter(item => {
      const eventDate = new Date(item.content.metadata.date);
      return eventDate < now;
    });

    // Sort upcoming earliest first, past most recent first
    upcomingEvents.sort((a, b) => 
      new Date(a.content.metadata.date).getTime() - new Date(b.content.metadata.date).getTime()
    );
    pastEvents.sort((a, b) => 
      new Date(b.content.metadata.date).getTime() - new Date(a.content.metadata.date).getTime()
    );

    return (
      <Layout title="Events" description="Past and upcoming events">
        <HeaderWithImage title="Events" imageUrl="/kenny-codes/img/events.jpg" />
        
        <div className={styles.eventsContainer}>
          <div className={styles.statsSection}>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{items.length}</span>
              <span className={styles.statLabel}>Total Events</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{upcomingEvents.length}</span>
              <span className={styles.statLabel}>Upcoming</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNumber}>{pastEvents.length}</span>
              <span className={styles.statLabel}>Past Events</span>
            </div>
          </div>

          {upcomingEvents.length > 0 && (
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Upcoming Events</h2>
              {upcomingEvents.map((item, index) => {
                const frontMatter = item.content.frontMatter as any;
                return (
                  <EventCard
                    key={index}
                    title={item.content.metadata.title}
                    permalink={item.content.metadata.permalink}
                    date={item.content.metadata.date}
                    formattedDate={formatDate(item.content.metadata.date)}
                    type={frontMatter.type}
                    duration={frontMatter.duration}
                    language={frontMatter.language}
                    location={frontMatter.location}
                    country={frontMatter.country}
                    event={frontMatter.event}
                    description={item.content.metadata.description}
                    tags={item.content.metadata.tags}
                  />
                );
              })}
            </div>
          )}
          
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Past Events</h2>
            {pastEvents.map((item, index) => {
              const frontMatter = item.content.frontMatter as any;
              return (
                <EventCard
                  key={index}
                  title={item.content.metadata.title}
                  permalink={item.content.metadata.permalink}
                  date={item.content.metadata.date}
                  formattedDate={formatDate(item.content.metadata.date)}
                  type={frontMatter.type}
                  duration={frontMatter.duration}
                  language={frontMatter.language}
                  location={frontMatter.location}
                  country={frontMatter.country}
                  event={frontMatter.event}
                  description={item.content.metadata.description}
                  tags={item.content.metadata.tags}
                />
              );
            })}
          </div>
        </div>
      </Layout>
    );
  }

  // Default blog layout for regular blog
  return (
    <BlogLayout sidebar={sidebar}>
      <BlogPostItems items={items} />
      <BlogListPaginator metadata={metadata} />
    </BlogLayout>
  );
}

export default function BlogListPage(props: Props): ReactNode {
  return (
    <HtmlClassNameProvider
      className={clsx(
        ThemeClassNames.wrapper.blogPages,
        ThemeClassNames.page.blogListPage,
      )}>
      <BlogListPageMetadata {...props} />
      <BlogListPageStructuredData {...props} />
      <BlogListPageContent {...props} />
    </HtmlClassNameProvider>
  );
}
