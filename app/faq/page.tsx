import type { Metadata } from "next";
import { FaqView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/faq/",
  t.faq.title,
  t.faq.heroLead,
);

export default function Page() {
  return <FaqView locale="en" />;
}
