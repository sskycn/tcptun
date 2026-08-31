import type { Metadata } from "next";
import { GenerateView } from "../../generate/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/generate/",
  t.generate.title,
  t.generate.heroLead || t.generate.heroTitle,
);

export default function Page() {
  return <GenerateView locale="zh" />;
}
