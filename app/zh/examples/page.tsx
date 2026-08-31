import type { Metadata } from "next";
import { ExamplesView } from "../../examples/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/examples/",
  t.examples.title,
  t.examples.heroLead || t.examples.heroTitle,
);

export default function Page() {
  return <ExamplesView locale="zh" />;
}
