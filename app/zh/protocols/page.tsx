import type { Metadata } from "next";
import { ProtocolsView } from "../../protocols/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/protocols/",
  t.protocols.title,
  t.protocols.heroLead || t.protocols.heroTitle,
);

export default function Page() {
  return <ProtocolsView locale="zh" />;
}
