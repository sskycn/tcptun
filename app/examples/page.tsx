import type { Metadata } from "next";
import { ExamplesView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/examples/",
  t.examples.title,
  t.examples.heroLead,
);

export default function Page() {
  return <ExamplesView locale="en" />;
}
