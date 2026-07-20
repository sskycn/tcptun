"use client";

import { useEffect, useState } from "react";
import {
  type BinaryDownload,
  type DetectedPlatform,
  detectPlatform,
  detectPlatformSync,
  findRecommendedBinary,
  formatBytes,
  platformInitial,
} from "./detect-platform";
import { binaryDownloads, npmLinks } from "./site-data";
import InstallCommand from "./install-command";

type PlatformDownloadButtonProps = {
  className?: string;
  fallbackLabel?: string;
  fallbackHref?: string;
};

export function PlatformDownloadButton({
  className = "button primary",
  fallbackLabel = "Download Linux x64",
  fallbackHref,
}: PlatformDownloadButtonProps) {
  const [recommended, setRecommended] = useState<BinaryDownload | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const detected = await detectPlatform();
      if (cancelled) return;
      setRecommended(findRecommendedBinary(detected));
      setReady(true);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const fallback =
    fallbackHref ||
    binaryDownloads.find((item) => item.platform === "linux" && item.arch === "amd64")?.url ||
    npmLinks.package;

  if (!ready || !recommended) {
    return (
      <a className={className} href={fallback}>
        {fallbackLabel}
      </a>
    );
  }

  return (
    <a className={className} href={recommended.url} download={recommended.filename}>
      Download {recommended.platformLabel} {recommended.archLabel}
    </a>
  );
}

export function DownloadSection({ releaseVersion }: { releaseVersion: string }) {
  const [detected, setDetected] = useState<DetectedPlatform | null>(null);
  const [recommended, setRecommended] = useState<BinaryDownload | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // Paint a sync guess first, then refine with high-entropy UA data.
      const sync = detectPlatformSync();
      if (!cancelled) {
        setDetected(sync);
        setRecommended(findRecommendedBinary(sync));
      }

      const refined = await detectPlatform();
      if (cancelled) return;
      setDetected(refined);
      setRecommended(findRecommendedBinary(refined));
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">Download</p>
          <h2>Multi-platform binaries, ready to run.</h2>
          <p>Hosted on this site&apos;s GitHub Pages under /releases/{releaseVersion}/.</p>
        </div>
        <a className="button secondary" href={`/releases/${releaseVersion}/SHA256SUMS`}>
          SHA256SUMS
        </a>
      </div>

      {recommended && detected ? (
        <div className="platform-recommend">
          <div className="platform-recommend-copy">
            <span className="platform-recommend-badge">Recommended for you</span>
            <div>
              <strong>
                Detected {detected.label}
              </strong>
              <p>
                Recommended download <code>{recommended.filename}</code>
                {" "}({formatBytes(recommended.size)})
              </p>
            </div>
          </div>
          <a
            className="button primary"
            href={recommended.url}
            download={recommended.filename}
          >
            Download recommended build
          </a>
        </div>
      ) : null}

      <div className="download-grid">
        {binaryDownloads.map((item) => {
          const isRecommended = recommended?.filename === item.filename;
          return (
            <article
              className={`download-card ${isRecommended ? "is-recommended" : ""}`}
              key={item.filename}
            >
              <div className={`platform-mark ${item.platform}`} aria-hidden="true">
                {platformInitial(item.platform)}
              </div>
              <div className="download-copy">
                <div className="download-title">
                  <h3>{item.platformLabel}</h3>
                  <span>{item.archLabel}</span>
                  {isRecommended ? <span className="recommend-pill">Recommended</span> : null}
                </div>
                <code>{item.filename}</code>
                <p>{formatBytes(item.size)} · Pages</p>
              </div>
              <a className="download-link" href={item.url} download={item.filename}>
                Download
              </a>
            </article>
          );
        })}
      </div>

      <InstallCommand variant="panel" />
    </>
  );
}
