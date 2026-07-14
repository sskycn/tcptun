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
import { binaryDownloads, installCommand, npmLinks } from "./site-data";
import CopyButton from "./copy-button";

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
          <p className="eyebrow">npm 二进制</p>
          <h2>无需安装 Go，下载后直接运行。</h2>
          <p>
            下面是 npm `tcptun@{releaseVersion}` 发布包内的原始二进制，通过 npm CDN 直接下载。
          </p>
        </div>
        <a className="button secondary" href={npmLinks.tarball}>
          下载完整 npm .tgz
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

      <div className="download-note">
        <div className="download-note-copy">
          <strong>一条命令自动选择平台并安装</strong>
          <div className="download-note-command">
            <code>{installCommand}</code>
            <CopyButton value={installCommand} label="复制" className="copy-button-solid" />
          </div>
          <span>
            默认安装 npm 最新版到 `/usr/local/bin`；可用 `TCPTUN_VERSION` 与 `TCPTUN_INSTALL_DIR`
            覆盖。
          </span>
        </div>
        <a className="download-note-link" href="/install.sh">
          查看脚本
          <span aria-hidden="true">↗</span>
        </a>
      </div>
    </>
  );
}
