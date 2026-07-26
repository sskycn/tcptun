"use client";

import { useMemo, useState } from "react";
import CopyButton from "./copy-button";
import { protocolUseCases } from "./site-data";

type SideTab = "server" | "client";
type ProtocolFilter = "all" | "native" | "vless" | "vmess" | "trojan";

export default function ExamplesBrowser() {
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all");
  const [useCaseId, setUseCaseId] = useState<(typeof protocolUseCases)[number]["id"]>(
    protocolUseCases[0]?.id ?? "native-basic",
  );
  const [side, setSide] = useState<SideTab>("server");

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

  const activeCode = side === "server" ? activeCase.serverCode : activeCase.clientCode;
  const activeHint = side === "server" ? activeCase.serverHint : activeCase.clientHint;
  const commandsText = activeCase.commands.join("\n");

  return (
    <section className="section protocol-section" id="protocol-examples">
      <div className="native-usecase-tabs" role="tablist" aria-label="Filter by protocol">
        {(
          [
            ["all", "All"],
            ["native", "native"],
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

      <div
        className="native-usecase-tabs native-usecase-tabs-secondary"
        role="tablist"
        aria-label="Protocol use cases"
      >
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
            {item.title}
          </button>
        ))}
      </div>

      <div className="native-usecase-panel">
        <div className="native-usecase-copy">
          <p className="eyebrow">{activeCase.protocol}</p>
          <h4>{activeCase.title}</h4>
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
            <a className="chip-link" href="/config/#protocol-compare">
              Compare protocols
            </a>
            {activeCase.protocol === "native" ? (
              <a className="chip-link" href="/config/#config-native">
                Native fields
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
                <CopyButton value={activeCode} label="Copy config" className="copy-button-solid" />
              </div>
            </div>
            <pre className="config-example-code" role="tabpanel">
              <code>{activeCode}</code>
            </pre>
          </div>
        </div>
      </div>
    </section>
  );
}
