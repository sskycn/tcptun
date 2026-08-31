import type { Metadata } from "next";
import HomeView from "../home-view";
import { rootMetadata } from "../i18n/metadata";

export const metadata: Metadata = rootMetadata("zh");

export default function ZhHome() {
  return <HomeView locale="zh" />;
}
