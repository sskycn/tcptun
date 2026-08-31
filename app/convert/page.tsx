import type { Metadata } from "next";
import { ConvertView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/convert/",
  t.convert.title,
  t.convert.heroLead,
);

export default function Page() {
  return <ConvertView locale="en" />;
}
