import type { Metadata } from "next";
import "./globals.css";
import { releaseVersion } from "./site-data";

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
  title: `tcptun-go v${releaseVersion} - 多入口、多出口代理运行时`,
  description: `tcptun-go v${releaseVersion} 是配置驱动的多 inbound、多 outbound 代理运行时，支持 TCP/UDP、Native、VLESS、VMess、Trojan、REALITY、mux、路由与 mDNS discovery。`,
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
      lang="zh-CN"
      className="h-full antialiased"
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
