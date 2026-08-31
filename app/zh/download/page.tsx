import type { Metadata } from "next";
import { DownloadView } from "../../download/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/download/",
  t.download.title,
  t.download.heroLead || t.download.heroTitle,
);

export default function Page() {
  return <DownloadView locale="zh" />;
}
