import type { Metadata } from "next";
import { UriView } from "../../uri/view";
import { getDictionary } from "../../i18n";
import { pageMetadata } from "../../i18n/metadata";

const t = getDictionary("zh");

export const metadata: Metadata = pageMetadata(
  "zh",
  "/uri/",
  t.uri.title,
  t.uri.title,
);

export default function Page() {
  return <UriView locale="zh" />;
}
