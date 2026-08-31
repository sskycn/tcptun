import type { Metadata } from "next";
import { DocsView } from "../../docs/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/docs/",
  t.docs.title,
  t.docs.heroLead || t.docs.heroTitle,
);

export default function Page() {
  return <DocsView locale="zh" />;
}
