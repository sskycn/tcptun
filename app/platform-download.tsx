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
  fallbackLabel = "下载 Linux x64",
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
      下载 {recommended.platformLabel} {recommended.archLabel}
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
          <p className="eyebrow">下载</p>
          <h2>多平台二进制，开箱即用。</h2>
          <p>来自 npm 包 tcptun@{releaseVersion}，经 CDN 直链分发。</p>
        </div>
        <a className="button secondary" href={npmLinks.tarball}>
          下载 .tgz
        </a>
      </div>

      {recommended && detected ? (
        <div className="platform-recommend">
          <div className="platform-recommend-copy">
            <span className="platform-recommend-badge">为你推荐</span>
            <div>
              <strong>
                检测到 {detected.label}
              </strong>
              <p>
                推荐下载 <code>{recommended.filename}</code>
                （{formatBytes(recommended.size)}）
              </p>
            </div>
          </div>
          <a
            className="button primary"
            href={recommended.url}
            download={recommended.filename}
          >
            下载推荐版本
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
                  {isRecommended ? <span className="recommend-pill">推荐</span> : null}
                </div>
                <code>{item.filename}</code>
                <p>{formatBytes(item.size)} · npm CDN</p>
              </div>
              <a className="download-link" href={item.url} download={item.filename}>
                下载
              </a>
            </article>
          );
        })}
      </div>

      <InstallCommand variant="panel" />
    </>
  );
}
