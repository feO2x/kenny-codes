import Image from "@theme/IdealImage";
import Layout from "@theme/Layout";
import clsx from "clsx";
import { ReactNode } from "react";
import eventsImageUrl from "@site/static/img/events.jpg";

function EventsHeader(): ReactNode {
  return (
    <header className={clsx("hero hero--secondary")}>
      <div className="container">
          <Image img={eventsImageUrl} />
      </div>
    </header>
  );
}

export default function Events(): ReactNode {
  return (
    <Layout title="Events" description="Upcoming events and activities">
      <EventsHeader />
    </Layout>
  );
}
