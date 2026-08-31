"use client";

import Link from "next/link";
import type { ComponentProps } from "react";
import { localizeHref } from "./i18n";
import { useLocale } from "./locale-context";

type LocalizedLinkProps = ComponentProps<typeof Link>;

function isExternalHref(href: LocalizedLinkProps["href"]): boolean {
  const value = typeof href === "string" ? href : href.pathname || "";
  return /^(https?:|mailto:|tel:)/i.test(value);
}

export default function LocalizedLink({ href, ...rest }: LocalizedLinkProps) {
  const locale = useLocale();
  if (typeof href !== "string") {
    return <Link href={href} {...rest} />;
  }
  if (isExternalHref(href) || href.startsWith("#")) {
    return <Link href={href} {...rest} />;
  }
  return <Link href={localizeHref(href, locale)} {...rest} />;
}
