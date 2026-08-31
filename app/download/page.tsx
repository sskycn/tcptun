import type { Metadata } from "next";
import { DownloadView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/download/",
  t.download.title,
  t.download.heroLead,
);

export default function Page() {
  return <DownloadView locale="en" />;
}
