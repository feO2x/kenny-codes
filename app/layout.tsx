import type { Metadata } from "next";
import "./globals.scss";
import { AppShell } from "./app-shell/app-shell";

export const metadata: Metadata = {
    title: "kenny-codes.com",
    description: "Kenny Pflug's website software development",
};

export default function RootLayout({ children }: ChildProps) {
    return (
        <html lang="en">
            <body>
                <AppShell>{children}</AppShell>
            </body>
        </html>
    );
}
