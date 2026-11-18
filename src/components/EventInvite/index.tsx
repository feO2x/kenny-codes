import React, {type ReactNode} from 'react';
import {CONTACT_EMAIL, CONTACT_MAILTO, LINKEDIN_URL} from '@site/src/utils/contact';
import styles from './styles.module.css';

/** Closing call to action on event pages, for organizers who want the session too. */
export default function EventInvite(): ReactNode {
  return (
    <aside className={styles.invite} aria-labelledby="event-invite-title">
      <h2 id="event-invite-title" className={styles.title}>
        Want this session at your event or company?
      </h2>
      <p className={styles.text}>
        I give talks and workshops in German and English, on site or online. Write to{' '}
        <a href={`${CONTACT_MAILTO}?subject=Speaking%20inquiry`}>{CONTACT_EMAIL}</a> or message me on{' '}
        <a href={LINKEDIN_URL} target="_blank" rel="noopener noreferrer">
          LinkedIn
        </a>
        .
      </p>
    </aside>
  );
}
