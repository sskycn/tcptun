"use client";

import { useEffect, useMemo, useState } from "react";
import CopyButton from "./copy-button";
import { exampleCatalogGroups, protocolUseCases } from "./site-data";

type SideTab = "server" | "client";
type ProtocolFilter = "all" | "native" | "vless" | "vmess" | "trojan";

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
  const defaultId = protocolUseCases[0]?.id ?? "native-reality";
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("native");
  const [useCaseId, setUseCaseId] = useState<(typeof protocolUseCases)[number]["id"]>(defaultId);
  const [side, setSide] = useState<SideTab>("server");

  useEffect(() => {
    const fromHash = readHashId();
    if (!fromHash) return;
    const match = protocolUseCases.find((item) => item.id === fromHash);
    if (!match) return;
    setUseCaseId(match.id);
    setProtocolFilter(match.protocol === "native" ? "native" : "all");
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

  const activeCode = side === "server" ? activeCase.serverCode : activeCase.clientCode;
  const activeHint = side === "server" ? activeCase.serverHint : activeCase.clientHint;
  const commandsText = activeCase.commands.join("\n");

  function selectCase(id: (typeof protocolUseCases)[number]["id"]) {
    setUseCaseId(id);
    setSide("server");
  }

  return (
    <section className="section protocol-section examples-catalog" id="protocol-examples">
      <div className="examples-catalog-toolbar">
        <div>
          <p className="eyebrow">Catalog</p>
          <h2>Browse every worked config.</h2>
          <p>
            Native stacks first. Pick a configuration from the menu, then copy the matching server /
            client JSON. Replace placeholders, run <code>tcptun config check</code>, start the
            server, then the client.
          </p>
        </div>
        <div className="examples-filter-tabs" role="tablist" aria-label="Filter by protocol">
          {(
            [
              ["native", "native"],
              ["all", "All"],
              ["vless", "vless"],
              ["vmess", "vmess"],
              ["trojan", "trojan"],
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
                <p className="examples-menu-label">{group.label}</p>
                <p className="examples-menu-desc">{group.description}</p>
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
                        {item.title}
                        {item.recommended ? <span className="examples-menu-badge">Rec</span> : null}
                      </span>
                      <span className="examples-menu-item-summary">{item.summary}</span>
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
                {activeCase.recommended ? " · recommended" : ""}
              </p>
              <h3>{activeCase.title}</h3>
              <p className="native-usecase-summary">{activeCase.summary}</p>
              <p>
                <strong>When:</strong> {activeCase.when}
              </p>
              <ol className="native-usecase-steps">
                {activeCase.steps.map((step) => (
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
                  Open generator
                </a>
                <a className="chip-link" href="/config/">
                  Config reference
                </a>
                {activeCase.protocol === "native" ? (
                  <a className="chip-link" href="/protocols/native/">
                    Native guide
                  </a>
                ) : (
                  <a className="chip-link" href="/protocols/">
                    Protocols
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
                    <CopyButton value={activeCode} label="Copy config" className="copy-button-solid" />
                  </div>
                </div>
                <pre className="config-example-code" role="tabpanel">
                  <code>{activeCode}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
