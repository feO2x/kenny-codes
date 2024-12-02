import styles from "./header.module.scss";
import { HomeLink } from "./home-link";

export function Header() {
    return (
        <header>
            <div className={styles.container}>
                <HomeLink />
            </div>
        </header>
    );
}
