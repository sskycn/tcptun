"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./copy-button";
import {
  applyExampleSecrets,
  generateExampleSecrets,
  secretsSummary,
  type ExampleSecrets,
} from "./example-secrets";
import { exampleCopy } from "./i18n/examples-cases";
import { useLocale, useMessages } from "./locale-context";
import ProtocolIcon from "./protocol-icon";
import {
  nativeTutorialSteps,
  protocolUseCases,
  tunnelProtocols,
} from "./site-data";

type SideTab = "server" | "client";
type ProtocolFilter = "all" | "native";

export default function NativeGuide() {
  const t = useMessages();
  const locale = useLocale();
  const n = t.protocols.native;
  const nativeProtocol = tunnelProtocols.find((item) => item.name === "native") ?? tunnelProtocols[0];
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("native");
  const [useCaseId, setUseCaseId] = useState<(typeof protocolUseCases)[number]["id"]>("native-reality");
  const [side, setSide] = useState<SideTab>("server");
  const [secrets, setSecrets] = useState<ExampleSecrets | null>(null);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const next = await generateExampleSecrets();
        if (!cancelled) {
          setSecrets(next);
          setSecretsError(null);
        }
      } catch (error) {
        if (!cancelled) {
          setSecrets(null);
          setSecretsError(error instanceof Error ? error.message : "Failed to generate keys");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filteredCases = useMemo(
    () =>
      protocolFilter === "all"
        ? protocolUseCases
        : protocolUseCases.filter((item) => item.protocol === protocolFilter),
    [protocolFilter],
  );

  const activeCase = useMemo(() => {
    return filteredCases.find((item) => item.id === useCaseId) ?? filteredCases[0] ?? protocolUseCases[0];
  }, [filteredCases, useCaseId]);

  const rawCode = side === "server" ? activeCase.serverCode : activeCase.clientCode;
  const activeCode = secrets ? applyExampleSecrets(rawCode, secrets) : rawCode;
  const activeHint = side === "server" ? activeCase.serverHint : activeCase.clientHint;
  const commandsText = activeCase.commands.join("\n");
  const copyReady = Boolean(secrets) && !secretsError;

  return (
    <>
      <section className="section protocol-section native-guide-section" id="native-guide">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{n.introEyebrow}</p>
            <h2>{n.introTitle}</h2>
            <p>{n.introLede}</p>
          </div>
          <div className="chip-row">
            <a className="chip-link" href="#native-overview">
              {t.common.overview}
            </a>
            <a className="chip-link" href="#native-tutorial">
              {t.common.tutorial}
            </a>
            <a className="chip-link" href="/examples/">
              {n.allExamples}
            </a>
            <a className="chip-link" href="/generate/">
              {n.generate}
            </a>
            <a className="chip-link" href="/config/#config-native">
              {n.configFields}
            </a>
          </div>
        </div>

        <div className="native-guide-overview" id="native-overview">
          <article className="protocol-card native-guide-hero-card">
            <div className="protocol-card-heading">
              <div className="protocol-title-row">
                <ProtocolIcon name={nativeProtocol.name} />
                <div>
                  <span className="protocol-index">01</span>
                  <h3>{nativeProtocol.name}</h3>
                </div>
              </div>
              <span className="security-badge">{t.protocols.nativeCredential}</span>
            </div>
            <p className="protocol-description">{t.protocols.nativeDescription}</p>
            <dl>
              <div>
                <dt>{t.protocols.interop}</dt>
                <dd>{t.protocols.nativeInterop}</dd>
              </div>
              <div>
                <dt>{t.protocols.defaultSecurity}</dt>
                <dd>{t.protocols.nativeSecurity}</dd>
              </div>
              <div className="wide">
                <dt>{t.protocols.mux}</dt>
                <dd>{t.protocols.nativeMux}</dd>
              </div>
            </dl>
            <div className="protocol-command-row">
              <pre className="protocol-command"><code>{nativeProtocol.command}</code></pre>
              <CopyButton value={nativeProtocol.command} label="Copy" className="copy-button-on-dark" />
            </div>
          </article>

          <div className="native-guide-points">
            {n.points.map((item, index) => (
              <article key={item.title}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="native-guide-concepts">
          <div className="section-subheading">
            <h3>{n.conceptsTitle}</h3>
            <p>{n.conceptsLead}</p>
          </div>
          <div className="highlight-grid">
            {n.concepts.map((item) => (
              <article key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </article>
            ))}
          </div>
        </div>

        <div className="native-guide-flow" aria-label="Typical native traffic path">
          <span>App</span>
          <span className="arrow">→</span>
          <span>mixed :1080</span>
          <span className="arrow">→</span>
          <span>native outbound</span>
          <span className="arrow">→</span>
          <span>native :9443</span>
          <span className="arrow">→</span>
          <span>direct</span>
        </div>

        <div className="native-guide-tutorial" id="native-tutorial">
          <div className="section-subheading">
            <h3>{n.tutorialTitle}</h3>
            <p>{n.tutorialLead}</p>
          </div>
          <div className="native-tutorial-grid">
            {nativeTutorialSteps.map((item) => {
              const commandText = item.commands.join("\n");
              return (
                <article className="native-tutorial-card" key={item.step}>
                  <div className="native-tutorial-meta">
                    <span className="mode-name">{n.step}</span>
                    <span className="mode-index">{item.step}</span>
                  </div>
                  <h4>{n.tutorial[Number(item.step) - 1]?.title ?? item.title}</h4>
                  <p>{n.tutorial[Number(item.step) - 1]?.body ?? item.body}</p>
                  <div className="mode-command-row">
                    <pre><code>{commandText}</code></pre>
                    <CopyButton value={commandText} label="Copy" className="copy-button-on-dark" />
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="section protocol-section" id="protocol-examples">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{t.useCases.label}</p>
            <h2>{n.examplesTitle}</h2>
            <p>{n.examplesLead}</p>
          </div>
          <div className="chip-row">
            <a className="chip-link" href="/generate/">
              {n.generator}
            </a>
            <a className="chip-link" href="/config/#protocol-compare">
              {n.compare}
            </a>
          </div>
        </div>

        <div className="native-usecase-tabs" role="tablist" aria-label="Filter by protocol">
          {(
            [
              ["all", t.examples.filterAll],
              ["native", t.examples.filterNative],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={protocolFilter === id}
              className={protocolFilter === id ? "is-active" : undefined}
              onClick={() => {
                setProtocolFilter(id);
                const next = protocolUseCases.find((item) =>
                  id === "all" ? true : item.protocol === id,
                );
                if (next) {
                  setUseCaseId(next.id);
                  setSide("server");
                }
              }}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="native-usecase-tabs native-usecase-tabs-secondary" role="tablist" aria-label="Protocol use cases">
          {filteredCases.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeCase.id === item.id}
              className={activeCase.id === item.id ? "is-active" : undefined}
              onClick={() => {
                setUseCaseId(item.id);
                setSide("server");
              }}
            >
              {exampleCopy(locale, item.id)?.title ?? item.title}
            </button>
          ))}
        </div>

        <div className="native-usecase-panel">
          <div className="native-usecase-copy">
            <p className="eyebrow">{activeCase.protocol}</p>
            <h4>{exampleCopy(locale, activeCase.id)?.title ?? activeCase.title}</h4>
            <p className="native-usecase-summary">
              {exampleCopy(locale, activeCase.id)?.summary ?? activeCase.summary}
            </p>
            <p>
              <strong>{t.examples.when}</strong>{" "}
              {exampleCopy(locale, activeCase.id)?.when ?? activeCase.when}
            </p>
            <ol className="native-usecase-steps">
              {(exampleCopy(locale, activeCase.id)?.steps ?? activeCase.steps).map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="mode-command-row">
              <pre><code>{commandsText}</code></pre>
              <CopyButton value={commandsText} label="Copy" className="copy-button-on-dark" />
            </div>
            {secrets ? (
              <p className="examples-secrets-note">
                {t.examples.freshCreds} <code>{secretsSummary(secrets)}</code>
              </p>
            ) : null}
            {secretsError ? (
              <p className="generator-error" role="alert">
                {secretsError}
              </p>
            ) : null}
            <div className="native-usecase-links">
              <a className="chip-link" href="/generate/">
                {t.examples.openGenerator}
              </a>
              <a className="chip-link" href="/config/#protocol-compare">
                {n.compare}
              </a>
              {activeCase.protocol === "native" ? (
                <a className="chip-link" href="/config/#config-native">
                  {n.configFields}
                </a>
              ) : null}
            </div>
          </div>

          <div className="native-usecase-code">
            <div className="config-example-panel native-usecase-example-panel">
              <div className="config-example-toolbar">
                <div className="config-example-tabs" role="tablist" aria-label="Server or client config">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={side === "server"}
                    className={side === "server" ? "is-active" : undefined}
                    onClick={() => setSide("server")}
                  >
                    Server
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={side === "client"}
                    className={side === "client" ? "is-active" : undefined}
                    onClick={() => setSide("client")}
                  >
                    Client
                  </button>
                </div>
                <div className="config-example-meta">
                  <span>{activeHint}</span>
                  <CopyButton
                    value={copyReady ? activeCode : ""}
                    label={copyReady ? t.common.copyConfig : t.common.generating}
                    className="copy-button-solid"
                  />
                </div>
              </div>
              <pre className="config-example-code" role="tabpanel">
                <code>{copyReady ? activeCode : "Generating Reality keys and credentials…"}</code>
              </pre>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
