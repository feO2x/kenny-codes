import { ThemeProvider } from "../theme-context";
import { Body } from "./body";

export function AppShell({ children }: ChildProps) {
    return (
        <ThemeProvider>
            <Body>{children}</Body>
        </ThemeProvider>
    );
}
