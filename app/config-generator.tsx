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
      setError(err instanceof Error ? err.message : "生成失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section generator-section" id="generate">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">生成</p>
          <h2>在浏览器生成配对配置。</h2>
          <p>
            server/client 逻辑对齐 <code>tcptun config</code>：raw + REALITY、匹配密钥与凭据；并额外生成可导入的 URI。密钥仅在本机生成，不会上传。
          </p>
        </div>
        <div className="chip-row">
          <span>X25519</span>
          <span>server + client</span>
          <span>URI</span>
        </div>
      </div>

      <div className="generator-grid">
        <form className="generator-form" onSubmit={handleGenerate}>
          <fieldset className="generator-fieldset">
            <legend>协议</legend>
            <div className="generator-protocol-grid" role="radiogroup" aria-label="隧道协议">
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
                    onChange={() => update("protocol", item.id as TunnelProtocol)}
                  />
                  <span className="generator-protocol-name">{item.label}</span>
                  <span className="generator-protocol-hint">{item.hint}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="generator-fields">
            <label>
              <span>服务端地址</span>
              <input
                value={form.server}
                onChange={(event) => update("server", event.target.value)}
                placeholder="proxy.example.com"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>端口</span>
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
              <span>服务端监听</span>
              <input
                value={form.listen}
                onChange={(event) => update("listen", event.target.value)}
                placeholder="0.0.0.0"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>本地监听</span>
              <input
                value={form.localListen}
                onChange={(event) => update("localListen", event.target.value)}
                placeholder="127.0.0.1"
                autoComplete="off"
                required
              />
            </label>
            <label>
              <span>本地端口</span>
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
              <span>REALITY dest（可选，默认 server-name:443）</span>
              <input
                value={form.dest}
                onChange={(event) => update("dest", event.target.value)}
                placeholder="example.com:443"
                autoComplete="off"
              />
            </label>
          </div>

          <label className="generator-check">
            <input
              type="checkbox"
              checked={Boolean(form.enableMux)}
              onChange={(event) => update("enableMux", event.target.checked)}
            />
            <span>启用 mux（CLI 生成器默认关闭）</span>
          </label>

          <div className="generator-actions">
            <button type="submit" className="button primary" disabled={busy}>
              {busy ? "生成中…" : "生成配置"}
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
              重置
            </button>
          </div>

          {error ? <p className="generator-error" role="alert">{error}</p> : null}
        </form>

        <div className="generator-result">
          {result ? (
            <>
              <div className="generator-result-toolbar">
                <div className="config-example-tabs" role="tablist" aria-label="生成结果">
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
                  <CopyButton value={activeContent} label="复制" className="copy-button-solid" />
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
                    下载
                  </button>
                </div>
              </div>

              <pre className="generator-result-code" role="tabpanel">
                <code>{activeContent}</code>
              </pre>

              <div className="generator-cli">
                <div className="generator-cli-heading">
                  <span>等价 CLI</span>
                  <CopyButton value={result.cliCommand} label="复制" className="copy-button-ghost" />
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
                  下载 server.json
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.json", result.clientJson)}
                >
                  下载 client.json
                </button>
                <button
                  type="button"
                  className="button secondary"
                  onClick={() => downloadText("client.uri", result.clientUri, "text/plain")}
                >
                  下载 client.uri
                </button>
              </div>
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">输出</p>
              <h3>填写参数后点击生成</h3>
              <p>
                将创建 server.json、client.json 与 client.uri；JSON 对齐{" "}
                <code>tcptun config {form.protocol}</code>，URI 对齐 <code>tcptun uri export</code>。
              </p>
              <ul>
                <li>自动生成 X25519 密钥对与 short id</li>
                <li>按协议生成 token / UUID / password</li>
                <li>vless 默认启用 Vision flow</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
