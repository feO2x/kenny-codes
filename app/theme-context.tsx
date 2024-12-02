"use client";

import { createContext, useState, useContext, useEffect } from "react";

const themeStorageKey = "theme";
export const lightTheme = "light-theme";
export const darkTheme = "dark-theme";

const themeContext = createContext({
    theme: lightTheme,
    toggleTheme: () => {},
});

export const useTheme = () => useContext(themeContext);

export function ThemeProvider({ children }: ChildProps) {
    const [theme, setTheme] = useState(lightTheme);

    useEffect(() => {
        const storedTheme = localStorage.getItem(themeStorageKey);
        if (storedTheme) {
            setTheme(storedTheme);
        }
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === lightTheme ? darkTheme : lightTheme;

        localStorage.setItem(themeStorageKey, newTheme);
        setTheme(newTheme);
    };

    return (
        <themeContext.Provider value={{ theme, toggleTheme }}>
            {children}
        </themeContext.Provider>
    );
}
