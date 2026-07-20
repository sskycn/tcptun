"use client";

import { useMemo, useState } from "react";
import CopyButton from "./copy-button";
import ProtocolIcon from "./protocol-icon";
import {
  nativeGuideConcepts,
  nativeGuideIntro,
  nativeTutorialSteps,
  protocolUseCases,
  tunnelProtocols,
} from "./site-data";

type SideTab = "server" | "client";
type ProtocolFilter = "all" | "native" | "vless" | "vmess" | "trojan";

export default function NativeGuide() {
  const nativeProtocol = tunnelProtocols.find((item) => item.name === "native") ?? tunnelProtocols[0];
  const [protocolFilter, setProtocolFilter] = useState<ProtocolFilter>("all");
  const [useCaseId, setUseCaseId] = useState<(typeof protocolUseCases)[number]["id"]>("native-basic");
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
    <>
      <section className="section protocol-section native-guide-section" id="native-guide">
        <div className="section-heading row-heading">
          <div>
            <p className="eyebrow">{nativeGuideIntro.eyebrow}</p>
            <h2>{nativeGuideIntro.title}</h2>
            <p>{nativeGuideIntro.lede}</p>
          </div>
          <div className="chip-row">
            <a className="chip-link" href="#native-overview">
              Overview
            </a>
            <a className="chip-link" href="#native-tutorial">
              Tutorial
            </a>
            <a className="chip-link" href="#protocol-examples">
              All examples
            </a>
            <a className="chip-link" href="#generate">
              Generate
            </a>
            <a className="chip-link" href="#config-native">
              Config fields
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
              <span className="security-badge">{nativeProtocol.credential}</span>
            </div>
            <p className="protocol-description">{nativeProtocol.description}</p>
            <dl>
              <div>
                <dt>Interop</dt>
                <dd>{nativeProtocol.interoperability}</dd>
              </div>
              <div>
                <dt>Default security</dt>
                <dd>{nativeProtocol.generatedSecurity}</dd>
              </div>
              <div className="wide">
                <dt>Mux</dt>
                <dd>{nativeProtocol.mux}</dd>
              </div>
            </dl>
            <div className="protocol-command-row">
              <pre className="protocol-command"><code>{nativeProtocol.command}</code></pre>
              <CopyButton value={nativeProtocol.command} label="Copy" className="copy-button-on-dark" />
            </div>
          </article>

          <div className="native-guide-points">
            {nativeGuideIntro.points.map((item, index) => (
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
            <h3>Core concepts</h3>
            <p>Keep these rules in mind when reading or writing native configs.</p>
          </div>
          <div className="highlight-grid">
            {nativeGuideConcepts.map((item) => (
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
            <h3>Native usage tutorial</h3>
            <p>
              Follow these steps for a first working native tunnel. The browser generator and URI tools
              on this page can replace the CLI generate / export steps if you prefer.
            </p>
          </div>
          <div className="native-tutorial-grid">
            {nativeTutorialSteps.map((item) => {
              const commandText = item.commands.join("\n");
              return (
                <article className="native-tutorial-card" key={item.step}>
                  <div className="native-tutorial-meta">
                    <span className="mode-name">step</span>
                    <span className="mode-index">{item.step}</span>
                  </div>
                  <h4>{item.title}</h4>
                  <p>{item.body}</p>
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
            <p className="eyebrow">Use cases</p>
            <h2>Worked examples for every tunnel protocol.</h2>
            <p>
              Complete server / client pairs for native, VLESS, VMess, and Trojan. Copy a pair, replace
              placeholders, validate, then start the server before the client.
            </p>
          </div>
          <div className="chip-row">
            <a className="chip-link" href="#generate">
              Generator
            </a>
            <a className="chip-link" href="#convert">
              Xray convert
            </a>
            <a className="chip-link" href="#protocol-compare">
              Compare
            </a>
          </div>
        </div>

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
              <pre><code>{commandsText}</code></pre>
              <CopyButton value={commandsText} label="Copy" className="copy-button-on-dark" />
            </div>
            <div className="native-usecase-links">
              <a className="chip-link" href="#generate">
                Open generator
              </a>
              <a className="chip-link" href="#protocol-compare">
                Compare protocols
              </a>
              {activeCase.protocol === "native" ? (
                <a className="chip-link" href="#config-native">
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
    </>
  );
}
