import type { Metadata } from "next";
import { PrivacyView } from "../../privacy/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/privacy/",
  t.privacy.title,
  t.privacy.heroTitle,
);

export default function Page() {
  return <PrivacyView locale="zh" />;
}
