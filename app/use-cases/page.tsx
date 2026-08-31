import type { Metadata } from "next";
import { UseCasesView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/use-cases/",
  t.useCases.title,
  t.useCases.heroLead,
);

export default function Page() {
  return <UseCasesView locale="en" />;
}
