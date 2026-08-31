import type { Metadata } from "next";
import { rootMetadata } from "../i18n/metadata";

export const metadata: Metadata = rootMetadata("zh");

export default function ZhLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        dangerouslySetInnerHTML={{
          __html: `document.documentElement.lang="zh-CN";`,
        }}
      />
      {children}
    </>
  );
}
