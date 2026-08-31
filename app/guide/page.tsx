import type { Metadata } from "next";
import { GuideView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/guide/",
  t.guide.title,
  t.guide.title,
);

export default function Page() {
  return <GuideView locale="en" />;
}
