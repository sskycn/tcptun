"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CopyButton from "./copy-button";
import { interpolate } from "./i18n";
import { useMessages } from "./locale-context";
import {
  downloadText,
  generateConfigPair,
  type GeneratedConfigs,
  type TunnelProtocol,
} from "./generate-config";

type WizardProfile = "native-reality-auto" | "native-quic";

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

function wizardProfiles(t: ReturnType<typeof useMessages>) {
  return [
    {
      id: "native-reality-auto" as const,
      title: t.guide.autoTitle,
      stack: t.guide.autoStack,
      hint: t.guide.autoHint,
      recommended: true,
    },
    {
      id: "native-quic" as const,
      title: t.guide.quicTitle,
      stack: t.guide.quicStack,
      hint: t.guide.quicHint,
    },
  ];
}

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

function profileMeta(profile: WizardProfile, t: ReturnType<typeof useMessages>) {
  const profiles = wizardProfiles(t);
  return profiles.find((item) => item.id === profile) ?? profiles[0];
}

function toGenerateInput(form: WizardForm) {
  return {
    protocol: "native" as TunnelProtocol,
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

function stackLabel(profile: WizardProfile, resume: boolean, t: ReturnType<typeof useMessages>): string {
  const meta = profileMeta(profile, t);
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

function firewallNote(profile: WizardProfile, t: ReturnType<typeof useMessages>): string {
  if (profile === "native-reality-auto") return t.guide.firewallAuto;
  if (profile === "native-quic") return t.guide.firewallQuic;
  return t.guide.firewallTcp;
}

export default function GuideWizard() {
  const t = useMessages();
  const steps = t.guide.steps as Array<{ id: StepId; title: string; summary: string }>;
  const profiles = wizardProfiles(t);
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
  const selected = profileMeta(form.profile, t);

  const runbook = useMemo(() => {
    if (!result) return "";
    const publicEndpoint = joinHostPort(form.server, form.port);
    const localProxy = joinHostPort(form.localListen, form.localPort);
    const generate = toGenerateInput(form);
    return [
      `# tcptun plan · ${stackLabel(form.profile, form.resume, t)}`,
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
      `# ${firewallNote(form.profile, t)}`,
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
            {interpolate(t.guide.stepOf, {
              current: String(stepIndex + 1).padStart(2, "0"),
              total: String(total).padStart(2, "0"),
            })}
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
            <p className="eyebrow">{t.guide.interactive}</p>
            <h2>{step.title}</h2>
            <p className="guide-wizard-summary">{step.summary}</p>

            {step.id === "protocol" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  {t.guide.protocolBody}
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
                          <span className="guide-recommended">{t.guide.recommended}</span>
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
                  {t.guide.serverBody}
                </p>
                <label className="guide-field">
                  <span>{t.guide.publicHost}</span>
                  <input
                    value={form.server}
                    onChange={(event) => update("server", event.target.value)}
                    placeholder="proxy.example.com"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
                  <span>{t.guide.publicPort}</span>
                  <input
                    type="number"
                    min={1}
                    max={65535}
                    value={form.port}
                    onChange={(event) => update("port", Number(event.target.value))}
                    required
                  />
                </label>
                <p className="guide-field-hint">{firewallNote(form.profile, t)}</p>
              </div>
            ) : null}

            {step.id === "listen" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">{t.guide.listenBody}</p>
                <div className="guide-choice-grid" role="radiogroup" aria-label={t.guide.serverListen}>
                  {[
                    { value: "0.0.0.0", label: t.guide.listenAllV4, hint: t.guide.listenAllV4Hint },
                    { value: "::", label: t.guide.listenAll, hint: t.guide.listenAllHint },
                    { value: "127.0.0.1", label: t.guide.listenLocal, hint: t.guide.listenLocalHint },
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
                  <span>{t.guide.customListen}</span>
                  <input
                    value={form.listen}
                    onChange={(event) => update("listen", event.target.value)}
                    placeholder="0.0.0.0"
                    autoComplete="off"
                  />
                </label>
                <p className="guide-field-hint">
                  {t.guide.listenFinal}{" "}
                  <code>{joinHostPort(form.listen || "0.0.0.0", form.port)}</code>
                </p>
              </div>
            ) : null}

            {step.id === "reality" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  {form.profile === "native-quic" ? t.guide.realityQuicBody : t.guide.realityAutoBody}
                </p>
                <label className="guide-field">
                  <span>{t.guide.serverName}</span>
                  <input
                    value={form.serverName}
                    onChange={(event) => update("serverName", event.target.value)}
                    placeholder="example.com"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
                  <span>{t.guide.dest}</span>
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
                  {t.guide.clientBody}
                </p>
                <label className="guide-field">
                  <span>{t.guide.localListen}</span>
                  <input
                    value={form.localListen}
                    onChange={(event) => update("localListen", event.target.value)}
                    placeholder="127.0.0.1"
                    autoComplete="off"
                    required
                  />
                </label>
                <label className="guide-field">
                  <span>{t.guide.localPort}</span>
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
                      <span>{t.guide.commonPort}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {step.id === "options" ? (
              <div className="guide-wizard-form">
                {form.profile === "native-reality-auto" ? (
                  <>
                    <p className="guide-wizard-body">{t.guide.optionsResumeBody}</p>
                    <div className="guide-choice-grid" role="radiogroup" aria-label={t.guide.resumeTitle}>
                      <button
                        type="button"
                        className={!form.resume ? "is-active" : undefined}
                        onClick={() => update("resume", false)}
                      >
                        <strong>{t.guide.standard}</strong>
                        <span>{t.guide.resumeSimple}</span>
                      </button>
                      <button
                        type="button"
                        className={form.resume ? "is-active" : undefined}
                        onClick={() => update("resume", true)}
                      >
                        <strong>{t.guide.resumeTitle}</strong>
                        <span>{t.guide.resumeHint}</span>
                      </button>
                    </div>
                    <ul className="guide-wizard-bullets">
                      {t.guide.resumeNotes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                ) : (
                  <>
                    <p className="guide-wizard-body">{t.guide.quicBody}</p>
                    <ul className="guide-wizard-bullets">
                      {t.guide.quicNotes.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ) : null}

            {step.id === "review" ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">{t.guide.reviewBody}</p>
                <dl className="guide-review-list">
                  <div>
                    <dt>{t.guide.profile}</dt>
                    <dd>{selected.title}</dd>
                  </div>
                  <div>
                    <dt>{t.guide.stack}</dt>
                    <dd>{stackLabel(form.profile, form.resume, t)}</dd>
                  </div>
                  <div>
                    <dt>{t.guide.publicEdge}</dt>
                    <dd>
                      <code>{joinHostPort(form.server, form.port)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.guide.serverListen}</dt>
                    <dd>
                      <code>{joinHostPort(form.listen, form.port)}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.guide.realitySni}</dt>
                    <dd>
                      <code>{form.serverName}</code> /{" "}
                      <code>{form.dest.trim() || `${form.serverName}:443`}</code>
                    </dd>
                  </div>
                  <div>
                    <dt>{t.guide.localProxy}</dt>
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
                    <dd>{firewallNote(form.profile, t)}</dd>
                  </div>
                </dl>
              </div>
            ) : null}

            {step.id === "result" && result ? (
              <div className="guide-wizard-form">
                <p className="guide-wizard-body">
                  {interpolate(t.guide.resultBody, { title: selected.title })}
                </p>
                <div className="guide-result-actions">
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
                  <button
                    type="button"
                    className="button ghost"
                    onClick={() => downloadText("tcptun-runbook.sh", `${runbook}\n`, "text/plain")}
                  >
                    {interpolate(t.generate.downloadFile, { name: "runbook" })}
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
                {t.guide.back}
              </button>
              <div className="guide-wizard-nav-links">
                <button type="button" className="chip-link guide-reset-button" onClick={handleReset}>
                  {t.common.reset}
                </button>
                <Link className="chip-link" href="/examples/">
                  {t.nav.examples}
                </Link>
              </div>
              {!isResult ? (
                <button
                  type="button"
                  className="button primary"
                  disabled={busy}
                  onClick={() => void handleNext()}
                >
                  {step.id === "review" ? (busy ? t.common.generating : t.guide.generatePlan) : t.guide.next}
                </button>
              ) : (
                <Link className="button primary" href="/download/">
                  {t.nav.download}
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
                        ["runbook", t.guide.livePlan],
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
                      label={t.common.copy}
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
                <strong>{t.guide.livePlan}</strong>
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
