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
            <span className="install-strip-label">One-line install</span>
            <div className="install-mode-toggle" role="group" aria-label="Install version">
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
        <CopyButton value={command} label="Copy command" className="copy-button-solid" />
      </div>
    );
  }

  return (
    <div className="download-note">
      <div className="download-note-copy">
        <div className="install-mode-row">
          <strong>One-line install</strong>
          <div className="install-mode-toggle" role="group" aria-label="Install version">
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
          <CopyButton value={command} label="Copy" className="copy-button-solid" />
        </div>
        <span>
          {mode === "latest"
            ? "Installs the latest release to /usr/local/bin. Override the directory with TCPTUN_INSTALL_DIR."
            : `Installs v${releaseVersion}. Override the directory with TCPTUN_INSTALL_DIR.`}
        </span>
      </div>
      <a className="download-note-link" href="/install.sh">
        View script
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
