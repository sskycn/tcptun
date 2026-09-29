"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./copy-button";
import LocalizedLink from "./localized-link";
import {
  applyExampleSecrets,
  generateExampleSecrets,
  secretsSummary,
  type ExampleSecrets,
} from "./example-secrets";
import { exampleCopy } from "./i18n/examples-cases";
import { useLocale, useMessages } from "./locale-context";
import { exampleCatalogGroups, protocolUseCases } from "./site-data";

type SideTab = "server" | "client";
type ProtocolFilter = "all" | "native";

const validIds = new Set(protocolUseCases.map((item) => item.id));

function readHashId(): (typeof protocolUseCases)[number]["id"] | null {
  if (typeof window === "undefined") return null;
  const hash = window.location.hash.replace(/^#/, "").trim();
  if (hash && validIds.has(hash as (typeof protocolUseCases)[number]["id"])) {
    return hash as (typeof protocolUseCases)[number]["id"];
  }
  return null;
}

export default function ExamplesBrowser() {
  const t = useMessages();
  const locale = useLocale();
  const defaultId = protocolUseCases[0]?.id ?? "native-reality";
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("native");
  const [useCaseId, setUseCaseId] = useState<(typeof protocolUseCases)[number]["id"]>(defaultId);
  const [side, setSide] = useState<SideTab>("server");
  const [secrets, setSecrets] = useState<ExampleSecrets | null>(null);
  const [secretsError, setSecretsError] = useState<string | null>(null);

  useEffect(() => {
    const fromHash = readHashId();
    if (!fromHash) return;
    const match = protocolUseCases.find((item) => item.id === fromHash);
    if (!match) return;
    setUseCaseId(match.id);
    setProtocolFilter(match.protocol === "native" ? "native" : "all");
  }, []);

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

  const groupedCases = useMemo(() => {
    return exampleCatalogGroups
      .map((group) => ({
        ...group,
        items: filteredCases.filter((item) => item.group === group.id),
      }))
      .filter((group) => group.items.length > 0);
  }, [filteredCases]);

  const activeCase = useMemo(() => {
    return filteredCases.find((item) => item.id === useCaseId) ?? filteredCases[0] ?? protocolUseCases[0];
  }, [filteredCases, useCaseId]);

  useEffect(() => {
    if (!activeCase) return;
    if (typeof window === "undefined") return;
    const next = `#${activeCase.id}`;
    if (window.location.hash !== next) {
      window.history.replaceState(null, "", next);
    }
  }, [activeCase]);

  const rawCode = side === "server" ? activeCase.serverCode : activeCase.clientCode;
  const activeCode = secrets ? applyExampleSecrets(rawCode, secrets) : rawCode;
  const activeHint = side === "server" ? activeCase.serverHint : activeCase.clientHint;
  const commandsText = activeCase.commands.join("\n");
  const copyReady = Boolean(secrets) && !secretsError;

  function selectCase(id: (typeof protocolUseCases)[number]["id"]) {
    setUseCaseId(id);
    setSide("server");
  }

  return (
    <section className="section protocol-section examples-catalog" id="protocol-examples">
      <div className="examples-catalog-toolbar">
        <div>
          <p className="eyebrow">{t.examples.catalogEyebrow}</p>
          <h2>{t.examples.catalogTitle}</h2>
          <p>{t.examples.catalogLead}</p>
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
        </div>
        <div className="examples-filter-tabs" role="tablist" aria-label="Filter by protocol">
          {(
            [
              ["native", t.examples.filterNative],
              ["all", t.examples.filterAll],
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
                if (next) selectCase(next.id);
              }}
            >
              {label}
              {id === "native" ? (
                <span className="examples-filter-count">
                  {protocolUseCases.filter((item) => item.protocol === "native").length}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </div>

      <div className="examples-catalog-layout">
        <nav className="examples-menu" aria-label="Example configurations">
          {groupedCases.map((group) => (
            <div className="examples-menu-group" key={group.id}>
              <div className="examples-menu-heading">
                <p className="examples-menu-label">
                  {t.examples.groups[group.id]?.label ?? group.label}
                </p>
                <p className="examples-menu-desc">
                  {t.examples.groups[group.id]?.description ?? group.description}
                </p>
              </div>
              <ul className="examples-menu-list">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className={activeCase.id === item.id ? "is-active" : undefined}
                      aria-current={activeCase.id === item.id ? "page" : undefined}
                      onClick={() => selectCase(item.id)}
                    >
                      <span className="examples-menu-item-title">
                        {exampleCopy(locale, item.id)?.title ?? item.title}
                        {item.recommended ? <span className="examples-menu-badge">{t.examples.rec}</span> : null}
                      </span>
                      <span className="examples-menu-item-summary">
                        {exampleCopy(locale, item.id)?.summary ?? item.summary}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="examples-detail" id={activeCase.id}>
          <div className="native-usecase-panel examples-detail-panel">
            <div className="native-usecase-copy">
              <p className="eyebrow">
                {activeCase.protocol}
                {activeCase.recommended ? ` · ${t.examples.recommended}` : ""}
              </p>
              <h3>{exampleCopy(locale, activeCase.id)?.title ?? activeCase.title}</h3>
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
                <pre>
                  <code>{commandsText}</code>
                </pre>
                <CopyButton value={commandsText} label="Copy" className="copy-button-on-dark" />
              </div>
              <div className="native-usecase-links">
                <a className="chip-link" href="/generate/">
                  {t.examples.openGenerator}
                </a>
                <a className="chip-link" href="/config/">
                  {t.examples.configRef}
                </a>
                {activeCase.id === "route-split" ? (
                  <LocalizedLink className="chip-link" href="/config/#route">
                    {t.examples.routeRef}
                  </LocalizedLink>
                ) : null}
                {activeCase.protocol === "native" ? (
                  <a className="chip-link" href="/protocols/native/">
                    {t.nav.nativeProtocol}
                  </a>
                ) : (
                  <a className="chip-link" href="/protocols/">
                    {t.nav.protocols}
                  </a>
                )}
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
                      {t.common.server}
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={side === "client"}
                      className={side === "client" ? "is-active" : undefined}
                      onClick={() => setSide("client")}
                    >
                      {t.common.client}
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
                  <code>{copyReady ? activeCode : t.examples.generatingKeys}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
