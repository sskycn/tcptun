import type { Metadata } from "next";
import "./globals.css";

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
  title: "tcptun-go v0.1.3 - TCP/UDP 隧道和 mixed 代理",
  description:
    "tcptun-go v0.1.3 项目介绍、npm 安装方式、默认多路复用、UDP relay、REALITY/Vision、性能优化、配置生成器，以及 Xray/V2Ray JSON 到 tcptun 配置的浏览器本地转换工具。",
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
