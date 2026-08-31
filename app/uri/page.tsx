import type { Metadata } from "next";
import { UriView } from "./view";
import { getDictionary } from "../i18n";
import { pageMetadata } from "../i18n/metadata";

const t = getDictionary("en");

export const metadata: Metadata = pageMetadata(
  "en",
  "/uri/",
  t.uri.title,
  t.uri.title,
);

export default function Page() {
  return <UriView locale="en" />;
}
