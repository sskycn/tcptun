import type { Metadata } from "next";
import { NativeProtocolView } from "../../../protocols/native/view";
import { getDictionary } from "../../../i18n";
import { pageMetadata } from "../../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/protocols/native/",
  t.protocols.title,
  t.protocols.heroLead || t.protocols.heroTitle,
);

export default function Page() {
  return <NativeProtocolView locale="zh" />;
}
