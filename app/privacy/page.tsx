import type { Metadata } from "next";
import { PrivacyView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/privacy/",
  t.privacy.title,
  t.privacy.heroTitle,
);

export default function Page() {
  return <PrivacyView locale="en" />;
}
