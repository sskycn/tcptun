import type { Metadata } from "next";
import { ConfigView } from "../../config/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/config/",
  t.config.title,
  t.config.heroLead || t.config.heroTitle,
);

export default function Page() {
  return <ConfigView locale="zh" />;
}
