import type { Metadata } from "next";
import { ConvertView } from "../../convert/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/convert/",
  t.convert.title,
  t.convert.heroLead || t.convert.heroTitle,
);

export default function Page() {
  return <ConvertView locale="zh" />;
}
