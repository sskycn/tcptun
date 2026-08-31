import type { Metadata } from "next";
import { ArchitectureView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/architecture/",
  t.architecture.title,
  t.architecture.heroLead,
);

export default function Page() {
  return <ArchitectureView locale="en" />;
}
