import type { Metadata } from "next";
import { GuideView } from "../../guide/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/guide/",
  t.guide.title,
  t.guide.title,
);

export default function Page() {
  return <GuideView locale="zh" />;
}
