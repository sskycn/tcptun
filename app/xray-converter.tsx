"use client";

import { useMemo, useState, type FormEvent } from "react";
import CopyButton from "./copy-button";
import {
  convertXrayInput,
  downloadText,
  sampleXrayConfig,
  type ConvertResult,
} from "./xray-convert";

type ResultTab = "client" | "server" | "warnings";

export default function XrayConverter() {
  const [input, setInput] = useState("");
  const [localListen, setLocalListen] = useState("127.0.0.1");
  const [localPort, setLocalPort] = useState(1080);
  const [preferredTag, setPreferredTag] = useState("");
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<ResultTab>("client");

  const tabs = useMemo(() => {
    if (!result) return [] as Array<[ResultTab, string]>;
    const items: Array<[ResultTab, string]> = [];
    if (result.clientJson) items.push(["client", "client.json"]);
    if (result.serverJson) items.push(["server", "server.json"]);
    if (result.warnings.length) items.push(["warnings", `Warnings (${result.warnings.length})`]);
    return items;
  }, [result]);

  const activeContent = useMemo(() => {
    if (!result) return "";
    if (tab === "client") return result.clientJson || "";
    if (tab === "server") return result.serverJson || "";
    return result.warnings.map((item, index) => `${index + 1}. ${item}`).join("\n");
  }, [result, tab]);

  function handleConvert(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const converted = convertXrayInput(input, {
        localListen,
        localPort,
        preferredOutboundTag: preferredTag.trim() || undefined,
      });
      setResult(converted);
      if (converted.clientJson) setTab("client");
      else if (converted.serverJson) setTab("server");
      else setTab("warnings");
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "Conversion failed");
    }
  }

  return (
    <section className="section converter-section" id="convert">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">Convert</p>
          <h2>Xray config → tcptun</h2>
          <p>
            Accepts full Xray JSON, a single inbound/outbound, or vless / vmess / trojan share links.
            Only wire protocols and transports are converted; rebuild route rules yourself.
          </p>
        </div>
        <div className="chip-row">
          <span>VLESS</span>
          <span>VMess</span>
          <span>Trojan</span>
          <span>REALITY</span>
        </div>
      </div>

      <div className="converter-grid">
        <form className="converter-form" onSubmit={handleConvert}>
          <label className="converter-input-label">
            <span>Xray config or share link</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Paste Xray config.json, or one vless:// / vmess:// / trojan:// link per line"
              spellCheck={false}
              required
            />
          </label>

          <div className="converter-options">
            <label>
              <span>Local listen</span>
              <input
                value={localListen}
                onChange={(event) => setLocalListen(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              <span>Local port</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={localPort}
                onChange={(event) => setLocalPort(Number(event.target.value))}
              />
            </label>
            <label className="converter-option-wide">
              <span>Preferred outbound tag (optional)</span>
              <input
                value={preferredTag}
                onChange={(event) => setPreferredTag(event.target.value)}
                placeholder="e.g. proxy"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="converter-actions">
            <button type="submit" className="button primary">
              Convert to tcptun
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setInput(sampleXrayConfig());
                setError(null);
              }}
            >
              Load sample
            </button>
            <button
              type="button"
              className="button ghost"
              onClick={() => {
                setInput("");
                setResult(null);
                setError(null);
              }}
            >
              Clear
            </button>
          </div>

          {error ? (
            <p className="generator-error" role="alert">
              {error}
            </p>
          ) : null}

          <ul className="converter-notes">
            <li>Supported: VLESS / VMess / Trojan with raw / ws / h2 / h3, TLS, and REALITY</li>
            <li>Not converted: gRPC, xhttp, kcp, and similar; freedom / blackhole are ignored</li>
            <li>Xray route rules are not migrated; rebuild them under tcptun route</li>
          </ul>
        </form>

        <div className="converter-result">
          {result ? (
            <>
              <div className="converter-result-header">
                <p className="converter-summary">{result.summary}</p>
                <div className="generator-result-toolbar">
                  <div className="config-example-tabs" role="tablist" aria-label="Conversion result">
                    {tabs.map(([id, label]) => (
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
                  {tab !== "warnings" && activeContent ? (
                    <div className="generator-result-actions">
                      <CopyButton value={activeContent} label="Copy" className="copy-button-solid" />
                      <button
                        type="button"
                        className="button secondary generator-download"
                        onClick={() =>
                          downloadText(tab === "client" ? "client.json" : "server.json", activeContent)
                        }
                      >
                        Download
                      </button>
                    </div>
                  ) : null}
                </div>
              </div>

              {tab === "warnings" ? (
                <ul className="converter-warnings">
                  {result.warnings.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <pre className="generator-result-code" role="tabpanel">
                  <code>{activeContent}</code>
                </pre>
              )}

              <div className="generator-bulk">
                {result.clientJson ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => downloadText("client.json", result.clientJson!)}
                  >
                    Download client.json
                  </button>
                ) : null}
                {result.serverJson ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => downloadText("server.json", result.serverJson!)}
                  >
                    Download server.json
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">Output</p>
              <h3>Paste an Xray config to convert</h3>
              <p>Client configs wrap a local mixed inbound; server inbounds land on a direct outbound.</p>
              <ul>
                <li>Understands streamSettings.network / security / realitySettings</li>
                <li>Supports multi-line share-link batch import</li>
                <li>Conversion runs entirely in the browser</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
