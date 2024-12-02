import styles from "./header.module.scss";
import { HomeLink } from "./home-link";
import { ThemeToggleButton } from "./theme-toggle-button";

export function Header() {
    return (
        <header>
            <div className={styles.container}>
                <HomeLink />
                <ThemeToggleButton />
            </div>
        </header>
    );
}
