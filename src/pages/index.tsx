import type {ReactNode} from 'react';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import HeroSection from '../components/Home/HeroSection';
import EventsSection from '../components/Home/EventsSection';
import MethodsSection from '../components/Home/MethodsSection';
import BlogSection from '../components/Home/BlogSection';

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description="Kenny's stances on software development, architecture, design, Cloud Native and AI">
      <main>
        <HeroSection />
        <EventsSection />
        <MethodsSection />
        <BlogSection />
      </main>
    </Layout>
  );
}
