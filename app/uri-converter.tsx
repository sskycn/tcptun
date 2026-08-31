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
import { useMessages } from "./locale-context";
import { decodeProfilePayload, encodeT3 } from "./profile-t3";
import {
  configToUris,
  parseOutboundUri,
  urisToConfig,
  type UriExportScope,
} from "./uri-convert";

type ConvertMode = "export" | "import" | "qrcode";

type ConvertResult = {
  content: string;
  filename: string;
  summary: string;
  warnings: string[];
  qrCodes: string[];
  qrPayloads: string[];
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
  const t = useMessages();
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

  const qrPayloads = useMemo(() => result?.qrPayloads || [], [result]);

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
        filename: uriText.startsWith("T3:") || uriText.startsWith("T2:") ? "client.profile" : "client.uri",
        summary: `Recognized ${converted.count} share endpoints from ${files.length} QR codes`,
        warnings: [],
        qrCodes: [],
        qrPayloads: [],
      });
      setQrIndex(0);
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : "QR code recognition failed");
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
        const profiles = converted.profileText.split(/\r?\n/).filter(Boolean);
        const qrCodes = await generateQrCodes(profiles);
        setResult({
          content: converted.uriText,
          filename: "client.uri",
          summary: `${converted.summary}, and generated ${qrCodes.length} T3 QR codes`,
          warnings: converted.profileWarnings,
          qrCodes,
          qrPayloads: profiles,
        });
        setQrIndex(0);
      } else if (mode === "import") {
        const converted = urisToConfig(input, { client, localListen, localPort });
        setResult({
          content: converted.configJson,
          filename: client ? "client.json" : converted.count === 1 ? "outbound.json" : "outbounds.json",
          summary: converted.summary,
          warnings: [],
          qrCodes: [],
          qrPayloads: [],
        });
      } else {
        const shares = input.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
        urisToConfig(shares.join("\n"), { client: false });
        const profiles = shares.map((share, index) => profilePayloadFromShare(share, index));
        const qrCodes = await generateQrCodes(profiles);
        setResult({
          content: profiles.join("\n"),
          filename: "client.profile",
          summary: `Generated ${qrCodes.length} T3 QR codes from ${shares.length} share endpoints`,
          warnings: [],
          qrCodes,
          qrPayloads: profiles,
        });
        setQrIndex(0);
      }
    } catch (err) {
      setResult(null);
      setError(err instanceof Error ? err.message : t.uri.failed);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section uri-section" id="uri">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">URI</p>
          <h2>{t.uri.heading}</h2>
          <p>{t.uri.lead}</p>
        </div>
        <div className="chip-row">
          <span>{t.uri.chipPair}</span>
          <span>{t.uri.chipQr}</span>
          <span>{t.uri.chipLocal}</span>
        </div>
      </div>

      <div className="uri-mode-switch" role="tablist" aria-label={t.uri.modeAria}>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "export"}
          className={mode === "export" ? "is-active" : undefined}
          onClick={() => switchMode("export")}
        >
          {t.uri.modeExport}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "import"}
          className={mode === "import" ? "is-active" : undefined}
          onClick={() => switchMode("import")}
        >
          {t.uri.modeImport}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "qrcode"}
          className={mode === "qrcode" ? "is-active" : undefined}
          onClick={() => switchMode("qrcode")}
        >
          {t.uri.modeQr}
        </button>
      </div>

      <div className="converter-grid">
        <form className="converter-form" onSubmit={handleConvert}>
          <label className="converter-input-label">
            <span>{mode === "export" ? t.uri.inputConfig : t.uri.inputShare}</span>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder={
                mode === "export" ? t.uri.placeholderConfig : t.uri.placeholderShare
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
              <strong>{busy ? t.uri.reading : t.uri.uploadTitle}</strong>
              <span>{t.uri.uploadHint}</span>
            </label>
          ) : null}

          {mode === "export" ? (
            <div className="converter-options">
              <label>
                <span>{t.uri.exportEndpoints}</span>
                <select value={scope} onChange={(event) => setScope(event.target.value as UriExportScope)}>
                  <option value="outbounds">{t.uri.outbounds}</option>
                  <option value="inbounds">{t.uri.inbounds}</option>
                </select>
              </label>
              <label>
                <span>{t.uri.displayName}</span>
                <input value={name} onChange={(event) => setName(event.target.value)} autoComplete="off" />
              </label>
            </div>
          ) : mode === "import" ? (
            <>
              <div className="converter-options">
                <label>
                  <span>{t.uri.localListen}</span>
                  <input
                    value={localListen}
                    onChange={(event) => setLocalListen(event.target.value)}
                    autoComplete="off"
                    disabled={!client}
                  />
                </label>
                <label>
                  <span>{t.uri.localPort}</span>
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
                <span>{t.uri.fullClient}</span>
              </label>
            </>
          ) : null}

          <div className="converter-actions">
            <button type="submit" className="button primary" disabled={busy}>
              {busy
                ? t.uri.converting
                : mode === "export"
                  ? t.uri.generateUriQr
                  : mode === "import"
                    ? t.uri.generateConfig
                    : t.uri.generateQr}
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
              {t.uri.loadSample}
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
              {t.common.clear}
            </button>
          </div>

          {error ? <p className="generator-error" role="alert">{error}</p> : null}

          {mode === "qrcode" ? (
            <ul className="converter-notes">
              {t.uri.notesQr.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : (
            <ul className="converter-notes">
              {t.uri.notesConvert.map((item) => (
                <li key={item}>{item}</li>
              ))}
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
                    <CopyButton value={result.content} label={t.common.copy} className="copy-button-solid" />
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
                      {t.common.download}
                    </button>
                  </div>
                </div>
              </div>

              <pre
                className={`generator-result-code uri-result-code${mode === "import" ? " is-config" : ""}`}
                aria-label={`${result.filename} content`}
                tabIndex={0}
              >
                <code>{result.content}</code>
              </pre>

              {result.warnings.length ? (
                <div className="converter-result-warnings" role="status">
                  <strong>{t.uri.qrSkipped}</strong>
                  <ul>
                    {result.warnings.map((warning) => <li key={warning}>{warning}</li>)}
                  </ul>
                  <p>{t.uri.qrSkippedNote}</p>
                </div>
              ) : null}

              {result.qrCodes.length ? (
                <div className="uri-qr-panel">
                  <div className="uri-qr-heading">
                    <div>
                      <span>{t.uri.qrTitle}</span>
                      <small>{result.qrCodes.length > 1 ? `${qrIndex + 1} / ${result.qrCodes.length}` : t.uri.qrPng}</small>
                    </div>
                    <button
                      type="button"
                      className="button secondary generator-download"
                      onClick={() => downloadDataUrl(`client-${qrIndex + 1}.png`, result.qrCodes[qrIndex])}
                    >
                      {t.uri.downloadQr}
                    </button>
                  </div>
                  {result.qrCodes.length > 1 ? (
                    <div className="uri-qr-tabs" role="tablist" aria-label="Select T3 Profile QR code">
                      {result.qrCodes.map((_, index) => (
                        <button
                          key={qrPayloads[index] || index}
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
                      alt={`QR code for T3 profile ${qrIndex + 1}`}
                      width={256}
                      height={256}
                      unoptimized
                    />
                  </div>
                  <p className="uri-qr-caption">{qrPayloads[qrIndex]}</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="generator-empty">
              <p className="eyebrow">{t.uri.output}</p>
              <h3>
                {mode === "export"
                  ? t.uri.emptyExportTitle
                  : mode === "import"
                    ? t.uri.emptyImportTitle
                    : t.uri.emptyQrTitle}
              </h3>
              <p>
                {mode === "export"
                  ? t.uri.emptyExportLead
                  : mode === "import"
                    ? t.uri.emptyImportLead
                    : t.uri.emptyQrLead}
              </p>
              <ul>
                {t.uri.emptyBullets.map((item) => (
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

function profilePayloadFromShare(share: string, index: number): string {
  if (share.startsWith("T3:") || share.startsWith("T2:")) {
    const decoded = decodeProfilePayload(share, `proxy-${index + 1}`);
    return encodeT3(decoded.outbound, decoded.name);
  }
  const outbound = parseOutboundUri(share, `proxy-${index + 1}`);
  let displayName = "tcptun";
  try {
    const fragment = new URL(share).hash.slice(1);
    if (fragment) displayName = decodeURIComponent(fragment);
  } catch {
    // parseOutboundUri above owns validation and already produced the useful error.
  }
  return encodeT3(outbound, displayName);
}

async function decodeQrFile(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) {
    throw new Error(`${file.name} is not an image file`);
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
    if (!context) throw new Error("This browser cannot read QR images");
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height);
    const decoded = jsQR(pixels.data, width, height, { inversionAttempts: "attemptBoth" });
    if (!decoded?.data.trim()) throw new Error(`No QR code found in ${file.name}`);
    return decoded.data.trim();
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
}

function loadImage(src: string, filename: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = document.createElement("img");
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`Unable to read image ${filename}`));
    image.src = src;
  });
}
