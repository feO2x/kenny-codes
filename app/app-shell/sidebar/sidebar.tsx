import styles from "./sidebar.module.scss";
import { Avatar } from "./avatar";
import { Navigation } from "./navigation";
import { SocialLinks } from "./social-links";

export function Sidebar() {
    return (
        <aside className={styles.sidebar}>
            <Avatar />
            <Navigation />
            <SocialLinks />
        </aside>
    );
}
