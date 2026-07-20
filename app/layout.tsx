import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { releaseVersion } from "./site-data";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

const themeInitScript = `
(() => {
  try {
    const storageKey = "tcptun-theme";
    const saved = localStorage.getItem(storageKey);
    const theme = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
    const resolved = theme === "system"
      ? (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      : theme;
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = resolved;
  } catch (_) {
    document.documentElement.dataset.theme = "system";
  }
})();
`;

export const metadata: Metadata = {
  title: `tcptun v${releaseVersion} · Config-driven proxy runtime`,
  description: `tcptun is a multi-inbound, multi-outbound proxy runtime built around the native tunnel protocol, with REALITY, reality-quic, mux, native QUIC, reverse publish, balance, and rule-based routing.`,
  icons: {
    icon: "/tcptun-logo.png",
    apple: "/tcptun-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`h-full antialiased ${sans.variable} ${mono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
