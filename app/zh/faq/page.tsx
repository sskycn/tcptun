import type { Metadata } from "next";
import { FaqView } from "../../faq/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/faq/",
  t.faq.title,
  t.faq.heroLead || t.faq.heroTitle,
);

export default function Page() {
  return <FaqView locale="zh" />;
}
