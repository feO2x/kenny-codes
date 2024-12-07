"use client";

import styles from "./body.module.scss";
import { Header } from "./header/header";
import { Sidebar } from "./sidebar/sidebar";
import { useTheme } from "../theme-context";

export function Body({ children }: ChildProps) {
    const { theme } = useTheme();
    return (
        <body className={theme}>
            <Header />
            <main>
                <div className={styles.container}>
                    <article className={styles["main-content"]}>
                        {children}
                    </article>
                    <Sidebar />
                </div>
            </main>
            <footer>Footer</footer>
        </body>
    );
}
