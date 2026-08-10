import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { productDescription, productTagline } from "./site-data";

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
  title: {
    default: "tcptun · Programmable Networking Runtime",
    template: "%s · tcptun",
  },
  description: productDescription,
  keywords: [
    "programmable networking runtime",
    "Go networking library",
    "TCP UDP tunnel runtime",
    "embedded VPN engine",
    "reverse TCP tunnel",
    "application aware VPN routing",
    "QUIC tunnel runtime",
    "tcptun",
  ],
  openGraph: {
    title: "tcptun · Programmable Networking Runtime",
    description: productTagline,
    type: "website",
    url: "https://tcptun.com",
  },
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
