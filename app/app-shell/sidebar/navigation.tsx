import Link from "next/link";
import styles from "./navigation.module.scss";

export function Navigation() {
    return (
        <nav className={styles.navigation}>
            <ul>
                <li>
                    <Link href="/">Blog</Link>
                </li>
                <li>
                    <Link href="/talks-and-conferences">
                        Talks and Conferences
                    </Link>
                </li>
                <li>
                    <Link href="/about">About</Link>
                </li>
            </ul>
        </nav>
    );
}
