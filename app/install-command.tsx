"use client";

import { useState } from "react";
import CopyButton from "./copy-button";
import { interpolate } from "./i18n";
import { useMessages } from "./locale-context";
import { installCommand, pinnedInstallCommand, releaseVersion } from "./site-data";

type InstallCommandProps = {
  variant?: "hero" | "panel";
};

export default function InstallCommand({ variant = "hero" }: InstallCommandProps) {
  const t = useMessages();
  const [mode, setMode] = useState<"latest" | "pinned">("latest");
  const command = mode === "latest" ? installCommand : pinnedInstallCommand;

  if (variant === "hero") {
    return (
      <div className="install-strip">
        <div className="install-strip-copy">
          <div className="install-mode-row">
            <span className="install-strip-label">{t.download.oneLine}</span>
            <div className="install-mode-toggle" role="group" aria-label={t.download.installVersion}>
              <button
                type="button"
                className={mode === "latest" ? "is-active" : undefined}
                aria-pressed={mode === "latest"}
                onClick={() => setMode("latest")}
              >
                {t.common.latest}
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
        <CopyButton value={command} label={t.common.copyCommand} className="copy-button-solid" />
      </div>
    );
  }

  return (
    <div className="download-note">
      <div className="download-note-copy">
        <div className="install-mode-row">
          <strong>{t.download.oneLine}</strong>
          <div className="install-mode-toggle" role="group" aria-label={t.download.installVersion}>
            <button
              type="button"
              className={mode === "latest" ? "is-active" : undefined}
              aria-pressed={mode === "latest"}
              onClick={() => setMode("latest")}
            >
              {t.common.latest}
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
          <CopyButton value={command} label={t.common.copy} className="copy-button-solid" />
        </div>
        <span>
          {mode === "latest"
            ? t.download.latestNote
            : interpolate(t.download.pinnedNote, { version: releaseVersion })}
        </span>
      </div>
      <a className="download-note-link" href="/install.sh">
        {t.download.viewScript}
        <span aria-hidden="true">↗</span>
      </a>
    </div>
  );
}
