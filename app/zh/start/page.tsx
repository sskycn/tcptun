import type { Metadata } from "next";
import { StartView } from "../../start/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/start/",
  t.start.title,
  t.start.heroLead || t.start.heroTitle,
);

export default function Page() {
  return <StartView locale="zh" />;
}
