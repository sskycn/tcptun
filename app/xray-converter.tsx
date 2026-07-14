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
    if (result.warnings.length) items.push(["warnings", `警告 (${result.warnings.length})`]);
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
      setError(err instanceof Error ? err.message : "转换失败");
    }
  }

  return (
    <section className="section converter-section" id="convert">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">转换</p>
          <h2>Xray 配置 → tcptun</h2>
          <p>
            支持完整 Xray JSON、单个 inbound/outbound，以及 vless / vmess / trojan 分享链接。仅转换线路协议与传输层，路由规则需自行核对。
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
            <span>Xray 配置或分享链接</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="粘贴 Xray config.json，或一行一条 vless:// / vmess:// / trojan://"
              spellCheck={false}
              required
            />
          </label>

          <div className="converter-options">
            <label>
              <span>本地监听</span>
              <input
                value={localListen}
                onChange={(event) => setLocalListen(event.target.value)}
                autoComplete="off"
              />
            </label>
            <label>
              <span>本地端口</span>
              <input
                type="number"
                min={1}
                max={65535}
                value={localPort}
                onChange={(event) => setLocalPort(Number(event.target.value))}
              />
            </label>
            <label className="converter-option-wide">
              <span>优先出口 tag（可选）</span>
              <input
                value={preferredTag}
                onChange={(event) => setPreferredTag(event.target.value)}
                placeholder="例如 proxy"
                autoComplete="off"
              />
            </label>
          </div>

          <div className="converter-actions">
            <button type="submit" className="button primary">
              转换为 tcptun
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setInput(sampleXrayConfig());
                setError(null);
              }}
            >
              填入示例
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
              清空
            </button>
          </div>

          {error ? (
            <p className="generator-error" role="alert">
              {error}
            </p>
          ) : null}

          <ul className="converter-notes">
            <li>可转换：VLESS / VMess / Trojan，传输 raw / ws / h2 / h3，TLS 与 REALITY</li>
            <li>不转换：gRPC、xhttp、kcp 等；freedom / blackhole 会忽略</li>
            <li>Xray 路由规则不会自动迁移，请在 tcptun route 中重建</li>
          </ul>
        </form>

        <div className="converter-result">
          {result ? (
            <>
              <div className="converter-result-header">
                <p className="converter-summary">{result.summary}</p>
                <div className="generator-result-toolbar">
                  <div className="config-example-tabs" role="tablist" aria-label="转换结果">
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
                      <CopyButton value={activeContent} label="复制" className="copy-button-solid" />
                      <button
                        type="button"
                        className="button secondary generator-download"
                        onClick={() =>
                          downloadText(tab === "client" ? "client.json" : "server.json", activeContent)
                        }
                      >
                        下载
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
                    下载 client.json
                  </button>
                ) : null}
                {result.serverJson ? (
                  <button
                    type="button"
                    className="button secondary"
                    onClick={() => downloadText("server.json", result.serverJson!)}
                  >
                    下载 server.json
                  </button>
                ) : null}
              </div>
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">输出</p>
              <h3>粘贴 Xray 配置后转换</h3>
              <p>客户端配置会包一层 local mixed 入口；服务端入口会落到 direct 出口。</p>
              <ul>
                <li>兼容 streamSettings.network / security / realitySettings</li>
                <li>支持多行分享链接批量导入</li>
                <li>转换在浏览器本地完成</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
