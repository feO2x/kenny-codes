import Layout from "@theme/Layout";
import { ReactNode } from "react";
import HeaderWithImage from "@site/src/components/HeaderWithImage";

export default function Events(): ReactNode {
  return (
    <Layout title="Events" description="Upcoming events and activities">
      <HeaderWithImage title="Events" imageUrl="/img/events.jpg" />
    </Layout>
  );
}
