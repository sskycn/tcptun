"use client";

import { useEffect, useId, useState } from "react";
import { useMessages } from "./locale-context";

const storageKey = "tcptun-cookie-consent";
export const cookieBannerOpenEvent = "tcptun-open-cookie-banner";

export function openCookieBanner() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(cookieBannerOpenEvent));
}

export default function CookieBanner() {
  const t = useMessages();
  const [visible, setVisible] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const detailsId = useId();

  useEffect(() => {
    let shouldShow = false;
    try {
      if (window.localStorage.getItem(storageKey) !== "accepted") {
        shouldShow = true;
      }
    } catch {
      shouldShow = true;
    }
    const revealTimer = window.setTimeout(() => {
      if (shouldShow) setVisible(true);
    }, 0);

    function onOpen() {
      setDetailsOpen(true);
      setVisible(true);
    }

    window.addEventListener(cookieBannerOpenEvent, onOpen);
    return () => {
      window.clearTimeout(revealTimer);
      window.removeEventListener(cookieBannerOpenEvent, onOpen);
    };
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
    <div className="cookie-banner" role="dialog" aria-label={t.cookies.aria} aria-modal="false">
      <div className="cookie-banner-inner">
        <div className="cookie-banner-copy">
          <strong className="cookie-banner-title">{t.cookies.title}</strong>
          <p>{t.cookies.lead}</p>
          {detailsOpen ? (
            <div className="cookie-banner-details" id={detailsId}>
              <ul>
                {t.cookies.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
              <p>{t.cookies.acceptance}</p>
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
            {detailsOpen ? t.cookies.hideDetails : t.cookies.details}
          </button>
          <button type="button" className="button primary" onClick={accept}>
            {t.cookies.accept}
          </button>
        </div>
      </div>
    </div>
  );
}
