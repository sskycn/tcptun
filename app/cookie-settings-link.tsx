"use client";

import type { ReactNode } from "react";
import { openCookieBanner } from "./cookie-banner";

type CookieSettingsLinkProps = {
  className?: string;
  children?: ReactNode;
};

export default function CookieSettingsLink({
  className,
  children = "Cookies",
}: CookieSettingsLinkProps) {
  return (
    <button type="button" className={className} onClick={() => openCookieBanner()}>
      {children}
    </button>
  );
}
