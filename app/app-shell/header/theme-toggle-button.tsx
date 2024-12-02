"use client";

import styles from "./theme-toggle-button.module.scss";
import { useTheme, lightTheme } from "../../theme-context";
import { FaSun, FaMoon } from "react-icons/fa";

export function ThemeToggleButton() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button onClick={toggleTheme} className={styles.toggleButton}>
            {theme === lightTheme ? (
                <FaSun color="white" />
            ) : (
                <FaMoon color="white" />
            )}
        </button>
    );
}
