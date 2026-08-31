import type { Metadata } from "next";
import { DocsView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/docs/",
  t.docs.title,
  t.docs.heroLead,
);

export default function Page() {
  return <DocsView locale="en" />;
}
