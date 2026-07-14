"use client";

import { useState } from "react";
import CopyButton from "./copy-button";
import { installCommand, pinnedInstallCommand, releaseVersion } from "./site-data";

type InstallCommandProps = {
  variant?: "hero" | "panel";
};

export default function InstallCommand({ variant = "hero" }: InstallCommandProps) {
  const [mode, setMode] = useState<"latest" | "pinned">("latest");
  const command = mode === "latest" ? installCommand : pinnedInstallCommand;

  if (variant === "hero") {
    return (
      <div className="install-strip">
        <div className="install-strip-copy">
          <div className="install-mode-row">
            <span className="install-strip-label">一键安装</span>
            <div className="install-mode-toggle" role="group" aria-label="安装版本">
              <button
                type="button"
                className={mode === "latest" ? "is-active" : undefined}
                aria-pressed={mode === "latest"}
                onClick={() => setMode("latest")}
              >
                latest
              </button>
              <button
                type="button"
                className={mode === "pinned" ? "is-active" : undefined}
                aria-pressed={mode === "pinned"}
                onClick={() => setMode("pinned")}
              >
                v{releaseVersion}
              </button>
            </div>
          </div>
          <code>{command}</code>
        </div>
        <CopyButton value={command} label="复制命令" className="copy-button-solid" />
      </div>
    );
  }

  return (
    <div className="download-note">
      <div className="download-note-copy">
        <div className="install-mode-row">
          <strong>一条命令自动选择平台并安装</strong>
          <div className="install-mode-toggle" role="group" aria-label="安装版本">
            <button
              type="button"
              className={mode === "latest" ? "is-active" : undefined}
              aria-pressed={mode === "latest"}
              onClick={() => setMode("latest")}
            >
              latest
            </button>
            <button
              type="button"
              className={mode === "pinned" ? "is-active" : undefined}
              aria-pressed={mode === "pinned"}
              onClick={() => setMode("pinned")}
            >
              v{releaseVersion}
            </button>
          </div>
        </div>
        <div className="download-note-command">
          <code>{command}</code>
          <CopyButton value={command} label="复制" className="copy-button-solid" />
        </div>
        <span>
          {mode === "latest"
            ? "默认安装 npm 最新版到 `/usr/local/bin`；可用 `TCPTUN_INSTALL_DIR` 覆盖安装目录。"
            : `固定安装 tcptun@${releaseVersion}；可用 \`TCPTUN_INSTALL_DIR\` 覆盖安装目录。`}
        </span>
      </div>
      <a className="download-note-link" href="/install.sh">
        查看脚本
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
