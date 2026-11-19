import type {ReactNode} from 'react';
import Layout from '@theme/Layout';
import HeroSection from '../components/Home/HeroSection';
import EventsSection from '../components/Home/EventsSection';
import MethodsSection from '../components/Home/MethodsSection';
import BlogSection from '../components/Home/BlogSection';

export default function Home(): ReactNode {
  return (
    <Layout
      title="Kenny Pflug"
      description="Kenny Pflug builds cloud-native .NET systems, speaks at conferences, and helps teams stay in control when AI agents write the code.">
      <main>
        <HeroSection />
        <EventsSection />
        <MethodsSection />
        <BlogSection />
      </main>
    </Layout>
  );
}
