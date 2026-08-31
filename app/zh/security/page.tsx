import type { Metadata } from "next";
import { SecurityView } from "../../security/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/security/",
  t.security.title,
  t.security.heroTitle,
);

export default function Page() {
  return <SecurityView locale="zh" />;
}
