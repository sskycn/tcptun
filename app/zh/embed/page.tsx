import type { Metadata } from "next";
import { EmbedView } from "../../embed/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/embed/",
  t.embed.title,
  t.embed.heroLead || t.embed.heroTitle,
);

export default function Page() {
  return <EmbedView locale="zh" />;
}
