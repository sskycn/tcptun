"use client";

import { useMemo, useState, type FormEvent } from "react";
import CopyButton from "./copy-button";
import { interpolate } from "./i18n";
import { useMessages } from "./locale-context";
import {
  defaultGenerateInput,
  downloadText,
  generateConfigPair,
  protocols,
  type GenerateConfigInput,
  type GeneratedConfigs,
  type TunnelProtocol,
} from "./generate-config";

type ResultTab = "server" | "client" | "uri";

export default function ConfigGenerator() {
  const t = useMessages();
  const [form, setForm] = useState<GenerateConfigInput>(defaultGenerateInput);
  const [result, setResult] = useState<GeneratedConfigs | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState<ResultTab>("server");

  const activeContent = useMemo(() => {
    if (!result) return "";
    if (tab === "server") return result.serverJson;
    if (tab === "client") return result.clientJson;
    return result.clientUri;
  }, [result, tab]);

  const activeFilename =
    tab === "server" ? "server.json" : tab === "client" ? "client.json" : "client.uri";

  function update<K extends keyof GenerateConfigInput>(key: K, value: GenerateConfigInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const generated = await generateConfigPair(form);
      setResult(generated);
      setTab("server");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : t.generate.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section generator-section" id="generate">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">{t.generate.eyebrow}</p>
          <h2>{t.generate.heading}</h2>
          <p>{t.generate.lead}</p>
        </div>
        <div className="chip-row">
          <span>X25519</span>
          <span>{t.generate.chipPair}</span>
          <span>URI</span>
        </div>
      </div>

      <div className="generator-grid">
        <form className="generator-form" onSubmit={handleGenerate}>
          <fieldset className="generator-fieldset">
            <legend>{t.generate.protocol}</legend>
            <div className="generator-protocol-grid" role="radiogroup" aria-label={t.generate.protocolAria}>
              {protocols.map((item) => (
                <label
                  key={item.id}
                  className={`generator-protocol ${form.protocol === item.id ? "is-active" : ""}`}
                >
                  <input
                    type="radio"
                    name="protocol"
                    value={item.id}
                    checked={form.protocol === item.id}
                    onChange={() =>
                      setForm((previous) => ({
                        ...previous,
                        protocol: item.id as TunnelProtocol,
                        quic: item.id === "native" ? previous.quic : false,
                        autoReality: item.id === "native" ? previous.autoReality : false,
                        resume: item.id === "native" ? previous.resume : false,
                      }))
                    }
                  />
                  <span className="generator-protocol-name">{item.label}</span>
                  <span className="generator-protocol-hint">{t.generate.nativeHint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="generator-fields">
            <label>
              <span>{t.generate.serverAddress}</span>
              <input
                value={form.server}
                onChange={(event) => update("server", event.target.value)}
                placeholder="proxy.example.com"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>{t.generate.port}</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={form.port}
                onChange={(event) => update("port", Number(event.target.value))}
                required
              />
            </label>
            <label>
              <span>{t.generate.serverListen}</span>
              <input
                value={form.listen}
                onChange={(event) => update("listen", event.target.value)}
                placeholder="0.0.0.0"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>{t.generate.localListen}</span>
              <input
                value={form.localListen}
                onChange={(event) => update("localListen", event.target.value)}
                placeholder="127.0.0.1"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>{t.generate.localPort}</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={form.localPort}
                onChange={(event) => update("localPort", Number(event.target.value))}
                required
              />
            </label>
            <label>
              <span>{t.generate.realityServerName}</span>
              <input
                value={form.serverName}
                onChange={(event) => update("serverName", event.target.value)}
                placeholder="example.com"
                autoComplete="off"
                required
              />
            </label>
            <label className="generator-field-wide">
              <span>{t.generate.realityDest}</span>
              <input
                value={form.dest}
                onChange={(event) => update("dest", event.target.value)}
                placeholder="example.com:443"
                autoComplete="off"
              />
            </label>
          </div>

          {form.protocol === "native" ? (
            <>
              <label className="generator-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.autoReality)}
                  disabled={Boolean(form.quic)}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      autoReality: event.target.checked,
                      resume: event.target.checked ? previous.resume : false,
                    }))
                  }
                />
                <span>{t.generate.autoReality}</span>
              </label>
              {form.autoReality && !form.quic ? (
                <label className="generator-check">
                  <input
                    type="checkbox"
                    checked={Boolean(form.resume)}
                    onChange={(event) => update("resume", event.target.checked)}
                  />
                  <span>{t.generate.resume}</span>
                </label>
              ) : null}
              <label className="generator-check">
                <input
                  type="checkbox"
                  checked={Boolean(form.quic)}
                  onChange={(event) =>
                    setForm((previous) => ({
                      ...previous,
                      quic: event.target.checked,
                      autoReality: event.target.checked ? false : true,
                      resume: event.target.checked ? false : previous.resume,
                    }))
                  }
                />
                <span>{t.generate.forceQuic}</span>
              </label>
            </>
          ) : null}

          <div className="generator-actions">
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? t.common.generating : t.common.generate}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setForm(defaultGenerateInput());
                setResult(null);
                setError(null);
              }}
            >
              {t.common.reset}
            </button>
          </div>

          {error ? <p className="generator-error" role="alert">{error}</p> : null}
        </form>

        <div className="generator-result">
          {result ? (
            <>
              <div className="generator-result-toolbar">
                <div className="config-example-tabs" role="tablist" aria-label={t.generate.resultAria}>
                  {(
                    [
                      ["server", "server.json"],
                      ["client", "client.json"],
                      ["uri", "client.uri"],
                    ] as const
                  ).map(([id, label]) => (
                    <button
                      key={id}
                      type="button"
                      role="tab"
                      aria-selected={tab === id}
                      className={tab === id ? "is-active" : undefined}
                      onClick={() => setTab(id)}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="generator-result-actions">
                  <CopyButton value={activeContent} label={t.common.copy} className="copy-button-solid" />
                  <button
                    type="button"
                    className="button secondary generator-download"
                    onClick={() =>
                      downloadText(
                        activeFilename,
                        activeContent,
                        tab === "uri" ? "text/plain" : "application/json",
                      )
                    }
                  >
                    {t.common.download}
                  </button>
                </div>
              </div>

              <pre className="generator-result-code" role="tabpanel">
                <code>{activeContent}</code>
              </pre>

              <div className="generator-cli">
                <div className="generator-cli-heading">
                  <span>{t.generate.cliStart}</span>
                  <CopyButton value={result.cliCommand} label={t.common.copy} className="copy-button-ghost" />
                </div>
                <pre>
                  <code>{result.cliCommand}</code>
                </pre>
              </div>

              <div className="generator-bulk">
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("server.json", result.serverJson)}
                >
                  {interpolate(t.generate.downloadFile, { name: "server.json" })}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.json", result.clientJson)}
                >
                  {interpolate(t.generate.downloadFile, { name: "client.json" })}
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.uri", result.clientUri, "text/plain")}
                >
                  {interpolate(t.generate.downloadFile, { name: "client.uri" })}
                </button>
              </div>
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">{t.generate.output}</p>
              <h3>{t.generate.emptyTitle}</h3>
              <p>{t.generate.emptyLead}</p>
              <ul>
                {t.generate.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
