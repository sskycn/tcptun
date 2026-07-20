"use client";

import { useEffect, useId, useState } from "react";
import { cookieNotice } from "./site-data";

const storageKey = "tcptun-cookie-consent";
export const cookieBannerOpenEvent = "tcptun-open-cookie-banner";

export function openCookieBanner() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(cookieBannerOpenEvent));
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  useEffect(() => {
    try {
      if (window.localStorage.getItem(storageKey) !== "accepted") {
        setVisible(true);
      }
    } catch {
      setVisible(true);
    }

    function onOpen() {
      setDetailsOpen(true);
      setVisible(true);
    }

    window.addEventListener(cookieBannerOpenEvent, onOpen);
    return () => window.removeEventListener(cookieBannerOpenEvent, onOpen);
  }, []);

  function accept() {
    try {
      window.localStorage.setItem(storageKey, "accepted");
    } catch {
      // Ignore quota / private-mode failures; still hide the banner.
    }
    setVisible(false);
    setDetailsOpen(false);
  }

  if (!visible) return null;

  return (
    <div className="cookie-banner" role="dialog" aria-label="Cookie notice" aria-modal="false">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-copy">
          <strong className="cookie-banner-title">We use cookies</strong>
          <p>
            {cookieNotice.intro} We also store your theme preference locally. See details or accept
            to continue.
          </p>
          {detailsOpen ? (
            <div className="cookie-banner-details" id={detailsId}>
              <ul>
                {cookieNotice.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p>{cookieNotice.acceptance}</p>
            </div>
          ) : null}
        </div>
        <div className="cookie-banner-actions">
          <button
            type="button"
            className="button ghost cookie-banner-details-toggle"
            aria-expanded={detailsOpen}
            aria-controls={detailsId}
            onClick={() => setDetailsOpen((value) => !value)}
          >
            {detailsOpen ? "Hide details" : "Learn more"}
          </button>
          <button type="button" className="button primary" onClick={accept}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
