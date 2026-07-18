"use client";

import Image from "next/image";
import jsQR from "jsqr";
import QRCode from "qrcode";
import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type FormEvent,
} from "react";
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
      "address": ["127.0.0.1:1080"],
      "network": ["tcp", "udp"]
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "address": ["proxy.example.com:9443"],
      "token": "replace-with-token",
      "network": ["tcp", "udp"],
      "transport": { "type": "raw" }
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
  const qrFileInput = useRef<HTMLInputElement>(null);

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
    if (qrFileInput.current) qrFileInput.current.value = "";
  }

  async function handleQrFiles(files: File[]) {
    if (files.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const decoded = await Promise.all(files.map(decodeQrFile));
      const uriText = decoded
        .flatMap((value) => value.split(/\r?\n/))
        .map((value) => value.trim())
        .filter(Boolean)
        .join("\n");
      const converted = urisToConfig(uriText, { client: false });
      setInput(uriText);
      setResult({
        content: uriText,
        filename: "client.uri",
        summary: `已从 ${files.length} 张二维码识别 ${converted.count} 条 URI`,
        qrCodes: [],
      });
      setQrIndex(0);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "二维码识别失败");
    } finally {
      setBusy(false);
      if (qrFileInput.current) qrFileInput.current.value = "";
    }
  }

  function handleQrFileChange(event: ChangeEvent<HTMLInputElement>) {
    void handleQrFiles(Array.from(event.target.files || []));
  }

  function handleQrDrop(event: DragEvent<HTMLLabelElement>) {
    event.preventDefault();
    if (!busy) void handleQrFiles(Array.from(event.dataTransfer.files));
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
          URI ↔ 二维码
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

          {mode === "qrcode" ? (
            <label
              className={`uri-qr-upload${busy ? " is-disabled" : ""}`}
              onDragOver={(event) => event.preventDefault()}
              onDrop={handleQrDrop}
            >
              <input
                ref={qrFileInput}
                type="file"
                accept="image/*"
                multiple
                disabled={busy}
                onChange={handleQrFileChange}
              />
              <strong>{busy ? "正在识别二维码…" : "上传二维码图片"}</strong>
              <span>点击选择或拖放 PNG / JPEG，可一次识别多张</span>
            </label>
          ) : null}

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
                if (qrFileInput.current) qrFileInput.current.value = "";
              }}
            >
              清空
            </button>
          </div>

          {error ? <p className="generator-error" role="alert">{error}</p> : null}

          {mode === "qrcode" ? (
            <ul className="converter-notes">
              <li>支持 URI 生成二维码，也支持上传二维码图片反向识别</li>
              <li>一行一条 URI 或一张一条二维码，可批量处理</li>
              <li>每条 URI 生成独立的 512 × 512 PNG</li>
              <li>识别与生成过程完全在浏览器本地完成</li>
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

              <pre
                className={`generator-result-code uri-result-code${mode === "import" ? " is-config" : ""}`}
                aria-label={`${result.filename} 内容`}
                tabIndex={0}
              >
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
                    : "粘贴 URI 生成二维码，或上传二维码图片识别并导出分享 URI。"}
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

async function decodeQrFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} 不是图片文件`);
  }

  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl, file.name);
    const maxDimension = 2048;
    const scale = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * scale));
    const height = Math.max(1, Math.round(image.naturalHeight * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) throw new Error("当前浏览器无法读取二维码图片");
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const decoded = jsQR(pixels.data, width, height, { inversionAttempts: "attemptBoth" });
    if (!decoded?.data.trim()) throw new Error(`${file.name} 中未识别到二维码`);
    return decoded.data.trim();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string, filename: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`无法读取图片 ${filename}`));
    image.src = src;
  });
}
