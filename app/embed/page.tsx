import type { Metadata } from "next";
import { EmbedView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/embed/",
  t.embed.title,
  t.embed.heroLead,
);

export default function Page() {
  return <EmbedView locale="en" />;
}
