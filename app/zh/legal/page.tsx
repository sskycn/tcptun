import type { Metadata } from "next";
import { LegalView } from "../../legal/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/legal/",
  t.legal.title,
  t.legal.heroLead || t.legal.heroTitle,
);

export default function Page() {
  return <LegalView locale="zh" />;
}
