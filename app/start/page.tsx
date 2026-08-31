import type { Metadata } from "next";
import { StartView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/start/",
  t.start.title,
  t.start.heroLead,
);

export default function Page() {
  return <StartView locale="en" />;
}
