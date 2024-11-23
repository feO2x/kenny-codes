import styles from "./app-shell.module.scss";
import { Sidebar } from "./sidebar/sidebar";

export function AppShell({ children }: ChildProps) {
    return (
        <>
            <main>
                <div className={styles.container}>
                    <article className={styles["main-content"]}>
                        {children}
                    </article>
                    <Sidebar />
                </div>
            </main>
            <footer>Footer</footer>
        </>
    );
}
