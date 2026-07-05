import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "tcptun-go - 高性能 TCP 隧道和 mixed 代理",
  description:
    "tcptun-go 项目介绍、npm 安装方式、配置生成器，以及 Xray/V2Ray JSON 到 tcptun 配置的浏览器本地转换工具。",
  icons: {
    icon: "/tcptun-logo.webp",
    apple: "/tcptun-logo.webp",
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
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
