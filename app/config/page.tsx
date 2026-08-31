import type { Metadata } from "next";
import { ConfigView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/config/",
  t.config.title,
  t.config.heroLead,
);

export default function Page() {
  return <ConfigView locale="en" />;
}
