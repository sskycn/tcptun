import type { Metadata } from "next";
import { UseCasesView } from "../../use-cases/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/use-cases/",
  t.useCases.title,
  t.useCases.heroLead || t.useCases.heroTitle,
);

export default function Page() {
  return <UseCasesView locale="zh" />;
}
