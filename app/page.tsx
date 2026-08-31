import type { Metadata } from "next";
import HomeView from "./home-view";
import { rootMetadata } from "./i18n/metadata";

export const metadata: Metadata = rootMetadata("en");

export default function Home() {
  return <HomeView locale="en" />;
}
