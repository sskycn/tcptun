import type { Metadata } from "next";
import { ProtocolsView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/protocols/",
  t.protocols.title,
  t.protocols.heroLead,
);

export default function Page() {
  return <ProtocolsView locale="en" />;
}
