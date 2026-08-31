import type { Metadata } from "next";
import { ArchitectureView } from "../../architecture/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/architecture/",
  t.architecture.title,
  t.architecture.heroLead || t.architecture.heroTitle,
);

export default function Page() {
  return <ArchitectureView locale="zh" />;
}
