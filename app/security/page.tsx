import type { Metadata } from "next";
import { SecurityView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/security/",
  t.security.title,
  t.security.heroTitle,
);

export default function Page() {
  return <SecurityView locale="en" />;
}
