"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CopyButton from "./copy-button";
import {
  downloadText,
  generateConfigPair,
  type GeneratedConfigs,
  type TunnelProtocol,
} from "./generate-config";

type WizardProfile = "native-reality-auto" | "native-quic" | "vless" | "vmess" | "trojan";

type WizardForm = {
  profile: WizardProfile;
  server: string;
  port: number;
  listen: string;
  localListen: string;
  localPort: number;
  serverName: string;
  dest: string;
  resume: boolean;
};

type StepId =
  | "protocol"
  | "server"
  | "listen"
  | "reality"
  | "client"
  | "options"
  | "review"
  | "result";

const profiles: Array<{
  id: WizardProfile;
  title: string;
  stack: string;
  hint: string;
  recommended?: boolean;
}> = [
  {
    id: "native-reality-auto",
    title: "native + raw + reality",
    stack: "group mux · QUIC-first · TCP fallback",
    hint: "Recommended for tcptun-to-tcptun on v0.2.3+",
    recommended: true,
  },
  {
    id: "native-quic",
    title: "native + raw + reality-quic",
    stack: "mux.mode=quic · forced QUIC · no TCP fallback",
    hint: "When you want a dedicated QUIC pool only",
  },
  {
    id: "vless",
    title: "vless + raw + reality",
    stack: "Vision flow · Xray-compatible wire",
    hint: "Interop with Xray VLESS clients/servers",
  },
  {
    id: "vmess",
    title: "vmess + raw + reality",
    stack: "VMess AEAD · Xray-compatible wire",
    hint: "Interop with the VMess ecosystem",
  },
  {
    id: "trojan",
    title: "trojan + raw + reality",
    stack: "Password auth · Xray-compatible wire",
    hint: "Simple password credential with REALITY",
  },
];

const steps: Array<{ id: StepId; title: string; summary: string }> = [
  {
    id: "protocol",
    title: "Protocol",
    summary: "Pick a tunnel stack. native + raw + reality is listed first.",
  },
  {
    id: "server",
    title: "Public endpoint",
    summary: "Host and port clients will dial.",
  },
  {
    id: "listen",
    title: "Server listen",
    summary: "Where the VPS binds.",
  },
  {
    id: "reality",
    title: "REALITY camouflage",
    summary: "SNI and dest for the security layer.",
  },
  {
    id: "client",
    title: "Local proxy",
    summary: "Client mixed inbound for apps.",
  },
  {
    id: "options",
    title: "Options",
    summary: "Protocol-specific extras.",
  },
  {
    id: "review",
    title: "Review",
    summary: "Confirm inputs before generation.",
  },
  {
    id: "result",
    title: "Your plan",
    summary: "Runnable configs, commands, and checklist.",
  },
];

const defaultForm: WizardForm = {
  profile: "native-reality-auto",
  server: "proxy.example.com",
  port: 9443,
  listen: "0.0.0.0",
  localListen: "127.0.0.1",
  localPort: 1080,
  serverName: "example.com",
  dest: "example.com:443",
  resume: false,
};

function joinHostPort(host: string, port: number): string {
  const normalized = host.trim().replace(/^\[|\]$/g, "");
  if (normalized.includes(":") && !normalized.startsWith("[")) {
    return `[${normalized}]:${port}`;
  }
  return `${normalized}:${port}`;
}

function profileMeta(profile: WizardProfile) {
  return profiles.find((item) => item.id === profile) ?? profiles[0];
}

function toGenerateInput(form: WizardForm) {
  const protocol: TunnelProtocol =
    form.profile === "native-reality-auto" || form.profile === "native-quic"
      ? "native"
      : form.profile;

  return {
    protocol,
    server: form.server.trim(),
    port: form.port,
    listen: form.listen.trim(),
    localListen: form.localListen.trim(),
    localPort: form.localPort,
    serverName: form.serverName.trim(),
    dest: form.dest.trim(),
    quic: form.profile === "native-quic",
    autoReality: form.profile === "native-reality-auto",
    resume: form.profile === "native-reality-auto" ? form.resume : false,
  };
}

function stackLabel(profile: WizardProfile, resume: boolean): string {
  const meta = profileMeta(profile);
  if (profile === "native-reality-auto") {
    return resume
      ? "native + raw + reality + group mux + resume"
      : "native + raw + reality + group mux";
  }
  if (profile === "native-quic") {
    return "native + raw + reality-quic + mux.mode=quic";
  }
  return meta.stack;
}

function firewallNote(profile: WizardProfile): string {
  if (profile === "native-reality-auto") {
    return "Open BOTH TCP and UDP on the public port (auto dual carriers).";
  }
  if (profile === "native-quic") {
    return "Open UDP on the public port (forced QUIC).";
  }
  return "Open TCP on the public port (REALITY over raw).";
}

export default function GuideWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [form, setForm] = useState<WizardForm>(defaultForm);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<GeneratedConfigs | null>(null);
  const [resultTab, setResultTab] = useState<"server" | "client" | "uri" | "runbook">("runbook");

  const step = steps[stepIndex];
  const total = steps.length;
  const progress = ((stepIndex + 1) / total) * 100;
  const isResult = step.id === "result";
  const selected = profileMeta(form.profile);

  const runbook = useMemo(() => {
    if (!result) return "";
    const publicEndpoint = joinHostPort(form.server, form.port);
    const localProxy = joinHostPort(form.localListen, form.localPort);
    const generate = toGenerateInput(form);
    return [
      `# tcptun plan · ${stackLabel(form.profile, form.resume)}`,
      `# Profile: ${selected.title}`,
      `# Public edge: ${publicEndpoint}`,
      `# Local proxy:  ${localProxy}`,
      form.profile === "native-reality-auto"
        ? form.resume
          ? "# Resumable TCP: enabled"
          : "# Resumable TCP: off"
        : "# Resumable TCP: n/a",
      "",
      "# 1) Install on server and client",
      "curl -fsSL https://tcptun.com/install.sh | sh",
      "tcptun --version",
      "",
      "# 2) Save generated files",
      "# - server.json  (edge host)",
      "# - client.json  (local machine)",
      "",
      `# 3) Firewall / security group`,
      `# ${firewallNote(form.profile)}`,
      `# port ${form.port}`,
      "",
      "# 4) Validate",
      "tcptun config check --config server.json",
      "tcptun config check --config client.json",
      "",
      "# 5) Start server first, then client",
      "tcptun --config server.json",
      "tcptun --config client.json",
      "",
      "# 6) Test from the client machine",
      `curl -x socks5h://${localProxy} https://example.com -I`,
      "",
      "# Equivalent CLI regenerate (keys will differ)",
      result.cliCommand,
      generate.protocol !== "native" ? "" : "",
    ]
      .filter((line) => line !== "")
      .join("\n");
  }, [form, result, selected.title]);

  function update<K extends keyof WizardForm>(key: K, value: WizardForm[K]) {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (key === "profile" && value !== "native-reality-auto") {
        next.resume = false;
      }
      return next;
    });
    setError(null);
  }

  function validateCurrentStep(): string | null {
    switch (step.id) {
      case "protocol":
        return null;
      case "server":
        if (!form.server.trim()) return "Public server host is required.";
        if (!Number.isInteger(form.port) || form.port < 1 || form.port > 65535) {
          return "Port must be an integer from 1 to 65535.";
        }
        return null;
      case "listen":
        if (!form.listen.trim()) return "Server listen address is required.";
        return null;
      case "reality":
        if (!form.serverName.trim()) return "REALITY server name (SNI) is required.";
        if (form.dest.trim() && !form.dest.includes(":")) {
          return "Dest should look like host:port, e.g. example.com:443.";
        }
        return null;
      case "client":
        if (!form.localListen.trim()) return "Local listen address is required.";
        if (!Number.isInteger(form.localPort) || form.localPort < 1 || form.localPort > 65535) {
          return "Local port must be an integer from 1 to 65535.";
        }
        return null;
      default:
        return null;
    }
  }

  function goTo(index: number) {
    setError(null);
    setStepIndex(Math.max(0, Math.min(total - 1, index)));
  }

  function handleBack() {
    if (stepIndex === 0) return;
    setError(null);
    setStepIndex((value) => value - 1);
  }

  async function handleNext() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (step.id === "review") {
      setBusy(true);
      setError(null);
      try {
        const generated = await generateConfigPair(toGenerateInput(form));
        setResult(generated);
        setResultTab("runbook");
        setStepIndex(total - 1);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Generation failed");
      } finally {
        setBusy(false);
      }
      return;
    }

    if (stepIndex < total - 1) {
      setStepIndex((value) => value + 1);
    }
  }

  function handleReset() {
    setForm(defaultForm);
    setResult(null);
    setError(null);
    setBusy(false);
    setResultTab("runbook");
    setStepIndex(0);
  }

  const activeResultContent =
    resultTab === "server"
      ? result?.serverJson || ""
      : resultTab === "client"
        ? result?.clientJson || ""
        : resultTab === "uri"
          ? result?.clientUri || ""
          : runbook;

  return (
    <section className="section guide-wizard-section" id="wizard">
      <div className="guide-wizard">
        <div className="guide-wizard-progress" aria-hidden="true">
          <div className="guide-wizard-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="guide-wizard-meta">
          <span className="guide-wizard-step-count">
            Step {String(stepIndex + 1).padStart(2, "0")} / {String(total).padStart(2, "0")}
          </span>
          <span className="guide-wizard-stack-badge">{selected.title}</span>
        </div>

        <ol className="guide-wizard-rail" aria-label="Wizard steps">
          {steps.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  index === stepIndex ? "is-active" : index < stepIndex ? "is-done" : undefined
                }
                onClick={() => {
                  if (index <= stepIndex || (result && index === total - 1)) goTo(index);
                }}
                disabled={index > stepIndex && !(result && index === total - 1)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <em>{item.title}</em>
              </button>
            </li>
          ))}
        </ol>

        <div className="guide-wizard-main">
          <article className="guide-wizard-card">
            <p className="eyebrow">Interactive wizard</p>
            <h2>{step.title}</h2>
            <p className="guide-wizard-summary">{step.summary}</p>

            {step.id === "protocol" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  Choose a tunnel profile. The recommended <strong>native + raw + reality</strong>{" "}
                  automatic dual-carrier stack is listed first. Other protocols generate matching
                  REALITY pairs for Xray interop.
                </p>
                <div className="guide-profile-grid" role="radiogroup" aria-label="Protocol profile">
                  {profiles.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      className={form.profile === item.id ? "is-active" : undefined}
                      onClick={() => update("profile", item.id)}
                    >
                      <div className="guide-profile-heading">
                        <strong>{item.title}</strong>
                        {item.recommended ? (
                          <span className="guide-recommended">Recommended</span>
                        ) : null}
                      </div>
                      <span className="guide-profile-stack">{item.stack}</span>
                      <span>{item.hint}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step.id === "server" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  This is the public host and port your clients dial. DNS or IP both work.
                </p>
                <label className="guide-field">
                  <span>Public server host</span>
                  <input
                    value={form.server}
                    onChange={(event) => update("server", event.target.value)}
                    placeholder="proxy.example.com"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
                  <span>Public port</span>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={form.port}
                    onChange={(event) => update("port", Number(event.target.value))}
                    required
                  />
                </label>
                <p className="guide-field-hint">{firewallNote(form.profile)}</p>
              </div>
            ) : null}

            {step.id === "listen" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  Where the server process binds. Most VPS deployments use all interfaces.
                </p>
                <div className="guide-choice-grid" role="radiogroup" aria-label="Listen address">
                  {[
                    { value: "0.0.0.0", label: "All IPv4", hint: "0.0.0.0 (recommended)" },
                    { value: "::", label: "All interfaces", hint: ":: (dual-stack where supported)" },
                    { value: "127.0.0.1", label: "Local only", hint: "127.0.0.1 (testing)" },
                  ].map((choice) => (
                    <button
                      key={choice.value}
                      type="button"
                      className={form.listen === choice.value ? "is-active" : undefined}
                      onClick={() => update("listen", choice.value)}
                    >
                      <strong>{choice.label}</strong>
                      <span>{choice.hint}</span>
                    </button>
                  ))}
                </div>
                <label className="guide-field">
                  <span>Custom listen host</span>
                  <input
                    value={form.listen}
                    onChange={(event) => update("listen", event.target.value)}
                    placeholder="0.0.0.0"
                    autoComplete="off"
                  />
                </label>
                <p className="guide-field-hint">
                  Final server listen address:{" "}
                  <code>{joinHostPort(form.listen || "0.0.0.0", form.port)}</code>
                </p>
              </div>
            ) : null}

            {step.id === "reality" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  {form.profile === "native-reality-auto"
                    ? "REALITY camouflage is shared by QUIC and TCP carriers. Prefer a popular HTTPS site that also supports HTTP/3 when possible."
                    : form.profile === "native-quic"
                      ? "REALITY-QUIC uses the same key fields. Dest should support HTTPS camouflage; the carrier itself is QUIC-only."
                      : "Generated configs use raw + REALITY. Server name is SNI; dest is the camouflage target."}
                </p>
                <label className="guide-field">
                  <span>Server name (SNI)</span>
                  <input
                    value={form.serverName}
                    onChange={(event) => update("serverName", event.target.value)}
                    placeholder="example.com"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
                  <span>Dest (optional, default server-name:443)</span>
                  <input
                    value={form.dest}
                    onChange={(event) => update("dest", event.target.value)}
                    placeholder="example.com:443"
                    autoComplete="off"
                  />
                </label>
                <div className="guide-choice-grid" role="group" aria-label="Common camouflage presets">
                  {[
                    { name: "example.com", dest: "example.com:443" },
                    { name: "www.cloudflare.com", dest: "www.cloudflare.com:443" },
                    { name: "www.microsoft.com", dest: "www.microsoft.com:443" },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      className={
                        form.serverName === preset.name && (form.dest === preset.dest || !form.dest)
                          ? "is-active"
                          : undefined
                      }
                      onClick={() => {
                        update("serverName", preset.name);
                        update("dest", preset.dest);
                      }}
                    >
                      <strong>{preset.name}</strong>
                      <span>{preset.dest}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step.id === "client" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  Apps on the client machine will use this local mixed proxy after the tunnel starts.
                </p>
                <label className="guide-field">
                  <span>Local listen</span>
                  <input
                    value={form.localListen}
                    onChange={(event) => update("localListen", event.target.value)}
                    placeholder="127.0.0.1"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
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
                <div className="guide-choice-grid">
                  {[1080, 10808, 7890].map((port) => (
                    <button
                      key={port}
                      type="button"
                      className={form.localPort === port ? "is-active" : undefined}
                      onClick={() => update("localPort", port)}
                    >
                      <strong>:{port}</strong>
                      <span>Common local proxy port</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step.id === "options" ? (
              <div className="guide-wizard-form">
                {form.profile === "native-reality-auto" ? (
                  <>
                    <p className="guide-wizard-body">
                      Optional v0.2.3 feature. Resumable streams keep eligible TCP flows alive when the
                      physical Reality QUIC/TCP carrier is replaced. Both ends must run v0.2.3+.
                    </p>
                    <div className="guide-choice-grid" role="radiogroup" aria-label="Resumable streams">
                      <button
                        type="button"
                        className={!form.resume ? "is-active" : undefined}
                        onClick={() => update("resume", false)}
                      >
                        <strong>Standard</strong>
                        <span>Reality auto only — simpler, recommended first run</span>
                      </button>
                      <button
                        type="button"
                        className={form.resume ? "is-active" : undefined}
                        onClick={() => update("resume", true)}
                      >
                        <strong>Resumable TCP</strong>
                        <span>mux.resume=true on both peers (one server process)</span>
                      </button>
                    </div>
                    <ul className="guide-wizard-bullets">
                      <li>Does not cover UDP, reverse publish, or multi-backend L4 load balancers</li>
                      <li>Keep resume off during rolling upgrades until both peers are ready</li>
                    </ul>
                  </>
                ) : form.profile === "native-quic" ? (
                  <>
                    <p className="guide-wizard-body">
                      Forced QUIC mode uses <code>reality-quic</code> with <code>mux.mode=quic</code>.
                      There is no TCP fallback. Resume is not available on this path.
                    </p>
                    <ul className="guide-wizard-bullets">
                      <li>UDP must reach the public port end-to-end</li>
                      <li>Do not replace reality-quic with plain reality</li>
                      <li>DATAGRAM UDP modes can be tuned later in the JSON mux block</li>
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="guide-wizard-body">
                      <strong>{selected.title}</strong> generates a standard REALITY pair for Xray
                      wire interop. Credential type:{" "}
                      {form.profile === "trojan"
                        ? "password"
                        : form.profile === "vless"
                          ? "UUID + Vision flow"
                          : "UUID"}.
                    </p>
                    <ul className="guide-wizard-bullets">
                      <li>tcptun config format is not Xray config format</li>
                      <li>Wire protocol interop covers VLESS / VMess / Trojan, not the full Xray JSON schema</li>
                      <li>You can convert existing Xray links later on the Convert page</li>
                    </ul>
                  </>
                )}
              </div>
            ) : null}

            {step.id === "review" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  Confirm the plan. Generating creates fresh REALITY keys and credentials in this
                  browser — nothing is uploaded.
                </p>
                <dl className="guide-review-list">
                  <div>
                    <dt>Profile</dt>
                    <dd>{selected.title}</dd>
                  </div>
                  <div>
                    <dt>Stack</dt>
                    <dd>{stackLabel(form.profile, form.resume)}</dd>
                  </div>
                  <div>
                    <dt>Public edge</dt>
                    <dd>
                      <code>{joinHostPort(form.server, form.port)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Server listen</dt>
                    <dd>
                      <code>{joinHostPort(form.listen, form.port)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>REALITY SNI / dest</dt>
                    <dd>
                      <code>{form.serverName}</code> /{" "}
                      <code>{form.dest.trim() || `${form.serverName}:443`}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Local proxy</dt>
                    <dd>
                      <code>{joinHostPort(form.localListen, form.localPort)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>Resumable TCP</dt>
                    <dd>
                      {form.profile === "native-reality-auto"
                        ? form.resume
                          ? "Enabled"
                          : "Off"
                        : "n/a"}
                    </dd>
                  </div>
                  <div>
                    <dt>Firewall</dt>
                    <dd>{firewallNote(form.profile)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {step.id === "result" && result ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  Your executable plan for <strong>{selected.title}</strong> is ready. Download the
                  JSON files to the matching machines, apply the firewall rules, then follow the
                  runbook.
                </p>
                <div className="guide-result-actions">
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
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => downloadText("tcptun-runbook.sh", `${runbook}\n`, "text/plain")}
                  >
                    Download runbook
                  </button>
                </div>
              </div>
            ) : null}

            {error ? (
              <p className="generator-error" role="alert">
                {error}
              </p>
            ) : null}

            <div className="guide-wizard-nav">
              <button
                type="button"
                className="button secondary"
                disabled={stepIndex === 0 || busy}
                onClick={handleBack}
              >
                Back
              </button>
              <div className="guide-wizard-nav-links">
                <button type="button" className="chip-link guide-reset-button" onClick={handleReset}>
                  Start over
                </button>
                <Link className="chip-link" href="/examples/">
                  Examples
                </Link>
              </div>
              {!isResult ? (
                <button
                  type="button"
                  className="button primary"
                  disabled={busy}
                  onClick={() => void handleNext()}
                >
                  {step.id === "review" ? (busy ? "Generating…" : "Generate plan") : "Next"}
                </button>
              ) : (
                <Link className="button primary" href="/download/">
                  Download binaries
                </Link>
              )}
            </div>
          </article>

          <aside className="guide-wizard-aside">
            <div className="guide-wizard-flow" aria-label="Traffic path">
              <span>App</span>
              <span className="arrow">→</span>
              <span>mixed :{form.localPort || 1080}</span>
              <span className="arrow">→</span>
              <span>{toGenerateInput(form).protocol}</span>
              <span className="arrow">→</span>
              <span>
                {form.profile === "native-quic"
                  ? "reality-quic"
                  : form.profile === "native-reality-auto"
                    ? "reality auto"
                    : "reality"}
              </span>
              <span className="arrow">→</span>
              <span>direct</span>
            </div>

            {isResult && result ? (
              <div className="config-example-panel guide-wizard-config">
                <div className="config-example-toolbar">
                  <div className="config-example-tabs" role="tablist" aria-label="Plan outputs">
                    {(
                      [
                        ["runbook", "Runbook"],
                        ["server", "server.json"],
                        ["client", "client.json"],
                        ["uri", "client.uri"],
                      ] as const
                    ).map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={resultTab === id}
                        className={resultTab === id ? "is-active" : undefined}
                        onClick={() => setResultTab(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <div className="config-example-meta">
                    <CopyButton
                      value={activeResultContent}
                      label="Copy"
                      className="copy-button-solid"
                    />
                  </div>
                </div>
                <pre className="config-example-code">
                  <code>{activeResultContent}</code>
                </pre>
              </div>
            ) : (
              <div className="guide-wizard-checklist">
                <strong>Live plan snapshot</strong>
                <ul>
                  <li>
                    Profile <code>{selected.title}</code>
                  </li>
                  <li>
                    Edge <code>{joinHostPort(form.server || "…", form.port || 0)}</code>
                  </li>
                  <li>
                    Listen <code>{joinHostPort(form.listen || "…", form.port || 0)}</code>
                  </li>
                  <li>
                    SNI <code>{form.serverName || "…"}</code>
                  </li>
                  <li>
                    Dest <code>{form.dest.trim() || `${form.serverName || "…"}:443`}</code>
                  </li>
                  <li>
                    Local{" "}
                    <code>{joinHostPort(form.localListen || "…", form.localPort || 0)}</code>
                  </li>
                  <li>
                    Resume{" "}
                    {form.profile === "native-reality-auto"
                      ? form.resume
                        ? "on"
                        : "off"
                      : "n/a"}
                  </li>
                </ul>
                <div className="guide-wizard-checklist-links">
                  <Link className="button secondary" href="/protocols/">
                    Protocols
                  </Link>
                  <Link className="button ghost" href="/generate/">
                    Advanced generator
                  </Link>
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </section>
  );
}
