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
import { binaryDownloads, npmInstallCommand, npmLinks } from "./site-data";
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
    <a className={className} href={recommended.url} rel="noreferrer">
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
          <p>
            CLI builds ship inside the npm package{" "}
            <a href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
              tcptun@{releaseVersion}
            </a>
            . Direct file links below come from that package.
          </p>
        </div>
        <div className="download-heading-actions">
          <a className="button secondary" href={npmLinks.package} target="_blank" rel="noreferrer">
            npm package
          </a>
          <a className="button ghost" href={npmLinks.tarball} rel="noreferrer">
            tarball
          </a>
        </div>
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
          <a className="button primary" href={recommended.url} rel="noreferrer">
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
                <p>{formatBytes(item.size)} · npm</p>
              </div>
              <a className="download-link" href={item.url} rel="noreferrer">
                Download
              </a>
            </article>
          );
        })}
      </div>

      <div className="download-note npm-install-note">
        <div className="download-note-copy">
          <strong>Install via npm</strong>
          <div className="download-note-command">
            <code>{npmInstallCommand}</code>
          </div>
          <span>
            The package wraps the same platform binaries under <code>dist/</code>. Use{" "}
            <code>npm install -g tcptun@latest</code> for the newest release.
          </span>
        </div>
        <a className="download-note-link" href={npmLinks.packageVersion} target="_blank" rel="noreferrer">
          View on npm
          <span aria-hidden="true">↗</span>
        </a>
      </div>

      <InstallCommand variant="panel" />
    </>
  );
}
