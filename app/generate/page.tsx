import type { Metadata } from "next";
import { GenerateView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/generate/",
  t.generate.title,
  t.generate.heroLead,
);

export default function Page() {
  return <GenerateView locale="en" />;
}
