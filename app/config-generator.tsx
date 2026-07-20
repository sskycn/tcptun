"use client";

import { useMemo, useState, type FormEvent } from "react";
import CopyButton from "./copy-button";
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
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section generator-section" id="generate">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">Generate</p>
          <h2>Generate native server / client pairs in the browser.</h2>
          <p>
            Matches <code>tcptun config native</code>: normal mode uses raw + REALITY; QUIC mode uses
            reality-quic + QUIC mux. Keys are generated locally and never uploaded.
          </p>
        </div>
        <div className="chip-row">
          <span>native</span>
          <span>X25519</span>
          <span>server + client</span>
          <span>URI</span>
        </div>
      </div>

      <div className="generator-grid">
        <form className="generator-form" onSubmit={handleGenerate}>
          <fieldset className="generator-fieldset">
            <legend>Protocol</legend>
            <div className="generator-protocol-grid" role="radiogroup" aria-label="Tunnel protocol">
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
                      }))
                    }
                  />
                  <span className="generator-protocol-name">{item.label}</span>
                  <span className="generator-protocol-hint">{item.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="generator-fields">
            <label>
              <span>Server address</span>
              <input
                value={form.server}
                onChange={(event) => update("server", event.target.value)}
                placeholder="proxy.example.com"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>Port</span>
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
              <span>Server listen</span>
              <input
                value={form.listen}
                onChange={(event) => update("listen", event.target.value)}
                placeholder="0.0.0.0"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>Local listen</span>
              <input
                value={form.localListen}
                onChange={(event) => update("localListen", event.target.value)}
                placeholder="127.0.0.1"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>Local port</span>
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
              <span>REALITY server name</span>
              <input
                value={form.serverName}
                onChange={(event) => update("serverName", event.target.value)}
                placeholder="example.com"
                autoComplete="off"
                required
              />
            </label>
            <label className="generator-field-wide">
              <span>REALITY dest (optional, default server-name:443)</span>
              <input
                value={form.dest}
                onChange={(event) => update("dest", event.target.value)}
                placeholder="example.com:443"
                autoComplete="off"
              />
            </label>
          </div>

          {form.protocol === "native" ? (
            <label className="generator-check">
              <input
                type="checkbox"
                checked={Boolean(form.quic)}
                onChange={(event) => update("quic", event.target.checked)}
              />
              <span>Generate Native QUIC config (same as <code>--quic</code>)</span>
            </label>
          ) : null}

          <div className="generator-actions">
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? "Generating…" : "Generate config"}
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
              Reset
            </button>
          </div>

          {error ? <p className="generator-error" role="alert">{error}</p> : null}
        </form>

        <div className="generator-result">
          {result ? (
            <>
              <div className="generator-result-toolbar">
                <div className="config-example-tabs" role="tablist" aria-label="Generated result">
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
                  <CopyButton value={activeContent} label="Copy" className="copy-button-solid" />
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
                    Download
                  </button>
                </div>
              </div>

              <pre className="generator-result-code" role="tabpanel">
                <code>{activeContent}</code>
              </pre>

              <div className="generator-cli">
                <div className="generator-cli-heading">
                  <span>Equivalent CLI</span>
                  <CopyButton value={result.cliCommand} label="Copy" className="copy-button-ghost" />
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
                  Download server.json
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.json", result.clientJson)}
                >
                  Download client.json
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.uri", result.clientUri, "text/plain")}
                >
                  Download client.uri
                </button>
              </div>
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">Output</p>
              <h3>Fill in the form, then generate</h3>
              <p>
                Creates server.json, client.json, and client.uri. JSON matches{" "}
                <code>tcptun config {form.protocol}</code>; URI matches <code>tcptun uri export</code>.
              </p>
              <ul>
                <li>Generates an X25519 key pair and short id</li>
                <li>Creates a native token shared by server and client</li>
                <li>Default path: raw + REALITY</li>
                <li>Optional: reality-quic + QUIC mux via the checkbox</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
