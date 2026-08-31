import type { Metadata } from "next";
import { LegalView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/legal/",
  t.legal.title,
  t.legal.heroLead,
);

export default function Page() {
  return <LegalView locale="en" />;
}
