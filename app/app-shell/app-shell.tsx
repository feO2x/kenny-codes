import styles from "./app-shell.module.scss";
import { Header } from "./header/header";
import { Sidebar } from "./sidebar/sidebar";
import { ThemeProvider } from "../theme-context";

export function AppShell({ children }: ChildProps) {
    return (
        <ThemeProvider>
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
        </ThemeProvider>
    );
}
