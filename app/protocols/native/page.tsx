import type { Metadata } from "next";
import { NativeProtocolView } from "./view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/protocols/native/",
  t.nav.nativeProtocol,
  t.protocols.heroLead,
);

export default function Page() {
  return <NativeProtocolView locale="en" />;
}
