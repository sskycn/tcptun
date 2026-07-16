"use client";

import Image from "next/image";
import QRCode from "qrcode";
import { useMemo, useState, type FormEvent } from "react";
import CopyButton from "./copy-button";
import { downloadText } from "./generate-config";
import {
  configToUris,
  urisToConfig,
  type UriExportScope,
} from "./uri-convert";

type ConvertMode = "export" | "import" | "qrcode";

type ConvertResult = {
  content: string;
  filename: string;
  summary: string;
  qrCodes: string[];
};

const SAMPLE_CONFIG = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
      "token": "replace-with-token",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" },
      "mux": { "enabled": false }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] }
}`;

const SAMPLE_URI =
  "native://replace-with-token@proxy.example.com:9443?v=1&type=raw&network=tcp%2Cudp&mux=false#tcptun";

export default function UriConverter() {
  const [mode, setMode] = useState<ConvertMode>("export");
  const [input, setInput] = useState("");
  const [scope, setScope] = useState<UriExportScope>("outbounds");
  const [name, setName] = useState("tcptun");
  const [client, setClient] = useState(true);
  const [localListen, setLocalListen] = useState("127.0.0.1");
  const [localPort, setLocalPort] = useState(1080);
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [qrIndex, setQrIndex] = useState(0);

  const qrUris = useMemo(
    () => (mode !== "import" && result ? result.content.split(/\r?\n/).filter(Boolean) : []),
    [mode, result],
  );

  function switchMode(next: ConvertMode) {
    setMode(next);
    setInput("");
    setResult(null);
    setError(null);
    setQrIndex(0);
  }

  async function handleConvert(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (mode === "export") {
        const converted = await configToUris(input, { scope, name });
        const uris = converted.uriText.split(/\r?\n/).filter(Boolean);
        const qrCodes = await generateQrCodes(uris);
        setResult({
          content: converted.uriText,
          filename: "client.uri",
          summary: `${converted.summary}，并生成 ${qrCodes.length} 张二维码`,
          qrCodes,
        });
        setQrIndex(0);
      } else if (mode === "import") {
        const converted = urisToConfig(input, { client, localListen, localPort });
        setResult({
          content: converted.configJson,
          filename: client ? "client.json" : converted.count === 1 ? "outbound.json" : "outbounds.json",
          summary: converted.summary,
          qrCodes: [],
        });
      } else {
        const uris = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        urisToConfig(uris.join("\n"), { client: false });
        const qrCodes = await generateQrCodes(uris);
        setResult({
          content: uris.join("\n"),
          filename: "client.uri",
          summary: `已从 ${uris.length} 条 URI 生成 ${qrCodes.length} 张二维码`,
          qrCodes,
        });
        setQrIndex(0);
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "转换失败");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section uri-section" id="uri">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">URI</p>
          <h2>配置、分享 URI 与二维码互转。</h2>
          <p>
            对齐 <code>tcptun uri export/import</code>，支持 Native、VLESS、VMess 与 Trojan；导出 URI 时同步生成可下载二维码，所有内容仅在浏览器本地处理。
          </p>
        </div>
        <div className="chip-row">
          <span>Config ↔ URI</span>
          <span>QR Code</span>
          <span>本地处理</span>
        </div>
      </div>

      <div className="uri-mode-switch" role="tablist" aria-label="URI 转换方向">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "export"}
          className={mode === "export" ? "is-active" : undefined}
          onClick={() => switchMode("export")}
        >
          配置 → URI + 二维码
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "import"}
          className={mode === "import" ? "is-active" : undefined}
          onClick={() => switchMode("import")}
        >
          URI → 配置
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "qrcode"}
          className={mode === "qrcode" ? "is-active" : undefined}
          onClick={() => switchMode("qrcode")}
        >
          URI → 二维码
        </button>
      </div>

      <div className="converter-grid">
        <form className="converter-form" onSubmit={handleConvert}>
          <label className="converter-input-label">
            <span>{mode === "export" ? "tcptun 配置 JSON" : "分享 URI（一行一条）"}</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === "export"
                  ? "粘贴完整 config.json、outbound 对象或 outbound 数组"
                  : "粘贴 native:// / vless:// / vmess:// / trojan://"
              }
              spellCheck={false}
              required
            />
          </label>

          {mode === "export" ? (
            <div className="converter-options">
              <label>
                <span>导出端点</span>
                <select value={scope} onChange={(event) => setScope(event.target.value as UriExportScope)}>
                  <option value="outbounds">outbounds（客户端配置）</option>
                  <option value="inbounds">inbounds（服务端配置）</option>
                </select>
              </label>
              <label>
                <span>显示名称</span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" />
              </label>
            </div>
          ) : mode === "import" ? (
            <>
              <div className="converter-options">
                <label>
                  <span>本地监听</span>
                  <input
                    value={localListen}
                    onChange={(event) => setLocalListen(event.target.value)}
                    autoComplete="off"
                    disabled={!client}
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
                    disabled={!client}
                  />
                </label>
              </div>
              <label className="generator-check">
                <input type="checkbox" checked={client} onChange={(event) => setClient(event.target.checked)} />
                <span>生成可直接运行的完整客户端配置（关闭则仅输出 outbound）</span>
              </label>
            </>
          ) : null}

          <div className="converter-actions">
            <button type="submit" className="button primary" disabled={busy}>
              {busy
                ? "转换中…"
                : mode === "export"
                  ? "生成 URI 与二维码"
                  : mode === "import"
                    ? "生成配置"
                    : "生成二维码"}
            </button>
            <button
              type="button"
              className="button secondary"
              onClick={() => {
                setInput(mode === "export" ? SAMPLE_CONFIG : SAMPLE_URI);
                setResult(null);
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

          {error ? <p className="generator-error" role="alert">{error}</p> : null}

          {mode === "qrcode" ? (
            <ul className="converter-notes">
              <li>支持一行一条 URI 批量生成二维码</li>
              <li>每条 URI 生成独立的 512 × 512 PNG</li>
              <li>生成过程完全在浏览器本地完成</li>
            </ul>
          ) : (
            <ul className="converter-notes">
              <li>完整配置会自动筛选支持 URI 的 tunnel inbound / outbound</li>
              <li>多端点导出为一行一条 URI，并分别生成二维码</li>
              <li>URI 无法承载出口链、路由规则、服务端私钥等配置字段</li>
            </ul>
          )}
        </form>

        <div className="converter-result uri-result">
          {result ? (
            <>
              <div className="converter-result-header">
                <p className="converter-summary">{result.summary}</p>
                <div className="generator-result-toolbar">
                  <span className="uri-result-label">{result.filename}</span>
                  <div className="generator-result-actions">
                    <CopyButton value={result.content} label="复制" className="copy-button-solid" />
                    <button
                      type="button"
                      className="button secondary generator-download"
                      onClick={() =>
                        downloadText(
                          result.filename,
                          result.content,
                          mode === "import" ? "application/json" : "text/plain",
                        )
                      }
                    >
                      下载
                    </button>
                  </div>
                </div>
              </div>

              <pre className="generator-result-code uri-result-code">
                <code>{result.content}</code>
              </pre>

              {result.qrCodes.length ? (
                <div className="uri-qr-panel">
                  <div className="uri-qr-heading">
                    <div>
                      <span>URI 二维码</span>
                      <small>{result.qrCodes.length > 1 ? `${qrIndex + 1} / ${result.qrCodes.length}` : "PNG · 512 × 512"}</small>
                    </div>
                    <button
                      type="button"
                      className="button secondary generator-download"
                      onClick={() => downloadDataUrl(`client-${qrIndex + 1}.png`, result.qrCodes[qrIndex])}
                    >
                      下载二维码
                    </button>
                  </div>
                  {result.qrCodes.length > 1 ? (
                    <div className="uri-qr-tabs" role="tablist" aria-label="选择 URI 二维码">
                      {result.qrCodes.map((_, index) => (
                        <button
                          key={qrUris[index] || index}
                          type="button"
                          role="tab"
                          aria-selected={qrIndex === index}
                          className={qrIndex === index ? "is-active" : undefined}
                          onClick={() => setQrIndex(index)}
                        >
                          {index + 1}
                        </button>
                      ))}
                    </div>
                  ) : null}
                  <div className="uri-qr-image">
                    <Image
                      src={result.qrCodes[qrIndex]}
                      alt={`第 ${qrIndex + 1} 条 URI 的二维码`}
                      width={256}
                      height={256}
                      unoptimized
                    />
                  </div>
                  <p className="uri-qr-caption">{qrUris[qrIndex]}</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">输出</p>
              <h3>
                {mode === "export"
                  ? "粘贴配置后生成分享入口"
                  : mode === "import"
                    ? "粘贴 URI 后还原配置"
                    : "粘贴 URI 后生成二维码"}
              </h3>
              <p>
                {mode === "export"
                  ? "输出 URI 文本与二维码 PNG；可从客户端 outbound 或服务端 inbound 导出。"
                  : mode === "import"
                    ? "可生成单个 outbound，或带 mixed 本地入口、路由的完整 client.json。"
                    : "直接把一条或多条分享 URI 生成为可预览、下载的二维码 PNG。"}
              </p>
              <ul>
                <li>支持 Native / VLESS / VMess / Trojan</li>
                <li>保留 raw / ws / h2 / h3、TLS / REALITY 与 mux 参数</li>
                <li>兼容 IPv4、IPv6 与域名端点</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const anchor = document.createElement("a");
  anchor.href = dataUrl;
  anchor.download = filename;
  anchor.click();
}

function generateQrCodes(uris: string[]): Promise<string[]> {
  return Promise.all(
    uris.map((uri) =>
      QRCode.toDataURL(uri, {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 512,
        color: { dark: "#071b2a", light: "#ffffff" },
      }),
    ),
  );
}
