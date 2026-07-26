"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import CopyButton from "./copy-button";
import {
  nativeRealityClientExample,
  nativeRealityServerExample,
  realityAutoWizardSteps,
} from "./site-data";

export default function GuideWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const total = realityAutoWizardSteps.length;
  const step = realityAutoWizardSteps[stepIndex];
  const progress = ((stepIndex + 1) / total) * 100;

  const [configTab, setConfigTab] = useState<"server" | "client">("server");

  const activeConfig = useMemo(() => {
    if (step.configSide === "server") {
      return { label: "server.json", code: nativeRealityServerExample };
    }
    if (step.configSide === "client") {
      return { label: "client.json", code: nativeRealityClientExample };
    }
    if (step.configSide === "both") {
      return configTab === "server"
        ? { label: "server.json", code: nativeRealityServerExample }
        : { label: "client.json", code: nativeRealityClientExample };
    }
    return null;
  }, [step.configSide, configTab]);

  function goTo(index: number) {
    setStepIndex(Math.max(0, Math.min(total - 1, index)));
  }

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
          <span className="guide-wizard-stack-badge">native + raw + reality</span>
        </div>

        <ol className="guide-wizard-rail" aria-label="Wizard steps">
          {realityAutoWizardSteps.map((item, index) => (
            <li key={item.id}>
              <button
                type="button"
                className={
                  index === stepIndex
                    ? "is-active"
                    : index < stepIndex
                      ? "is-done"
                      : undefined
                }
                onClick={() => goTo(index)}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                <em>{item.title}</em>
              </button>
            </li>
          ))}
        </ol>

        <div className="guide-wizard-main">
          <article className="guide-wizard-card">
            <p className="eyebrow">Guided setup</p>
            <h2>{step.title}</h2>
            <p className="guide-wizard-summary">{step.summary}</p>
            <p className="guide-wizard-body">{step.body}</p>

            {step.bullets.length > 0 ? (
              <ul className="guide-wizard-bullets">
                {step.bullets.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            ) : null}

            {step.tips.length > 0 ? (
              <div className="guide-wizard-tips">
                <strong>Tips</strong>
                <ul>
                  {step.tips.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {step.commands.length > 0 ? (
              <div className="guide-wizard-commands">
                <div className="guide-wizard-commands-heading">
                  <span>Commands</span>
                  <CopyButton
                    value={step.commands.join("\n")}
                    label="Copy all"
                    className="copy-button-solid"
                  />
                </div>
                <div className="mode-command-row">
                  <pre>
                    <code>{step.commands.join("\n")}</code>
                  </pre>
                  <CopyButton
                    value={step.commands.join("\n")}
                    label="Copy"
                    className="copy-button-on-dark"
                  />
                </div>
              </div>
            ) : null}

            <div className="guide-wizard-nav">
              <button
                type="button"
                className="button secondary"
                disabled={stepIndex === 0}
                onClick={() => goTo(stepIndex - 1)}
              >
                Back
              </button>
              <div className="guide-wizard-nav-links">
                <Link className="chip-link" href="/generate/">
                  Open generator
                </Link>
                <Link className="chip-link" href="/examples/">
                  More examples
                </Link>
              </div>
              {stepIndex < total - 1 ? (
                <button type="button" className="button primary" onClick={() => goTo(stepIndex + 1)}>
                  Next step
                </button>
              ) : (
                <Link className="button primary" href="/examples/">
                  Browse examples
                </Link>
              )}
            </div>
          </article>

          <aside className="guide-wizard-aside">
            <div className="guide-wizard-flow" aria-label="Traffic path">
              <span>App</span>
              <span className="arrow">→</span>
              <span>mixed :1080</span>
              <span className="arrow">→</span>
              <span>native</span>
              <span className="arrow">→</span>
              <span>reality auto</span>
              <span className="arrow">→</span>
              <span>direct</span>
            </div>

            {activeConfig ? (
              <div className="config-example-panel guide-wizard-config">
                <div className="config-example-toolbar">
                  {step.configSide === "both" ? (
                    <div className="config-example-tabs" role="tablist" aria-label="Config side">
                      <button
                        type="button"
                        role="tab"
                        aria-selected={configTab === "server"}
                        className={configTab === "server" ? "is-active" : undefined}
                        onClick={() => setConfigTab("server")}
                      >
                        Server
                      </button>
                      <button
                        type="button"
                        role="tab"
                        aria-selected={configTab === "client"}
                        className={configTab === "client" ? "is-active" : undefined}
                        onClick={() => setConfigTab("client")}
                      >
                        Client
                      </button>
                    </div>
                  ) : (
                    <span className="guide-wizard-config-label">{activeConfig.label}</span>
                  )}
                  <div className="config-example-meta">
                    <span>{activeConfig.label}</span>
                    <CopyButton
                      value={activeConfig.code}
                      label="Copy config"
                      className="copy-button-solid"
                    />
                  </div>
                </div>
                <pre className="config-example-code">
                  <code>{activeConfig.code}</code>
                </pre>
              </div>
            ) : (
              <div className="guide-wizard-checklist">
                <strong>Checklist for this stack</strong>
                <ul>
                  <li>
                    <code>type: &quot;native&quot;</code>
                  </li>
                  <li>
                    <code>transport.type: &quot;raw&quot;</code>
                  </li>
                  <li>
                    <code>security.type: &quot;reality&quot;</code>
                  </li>
                  <li>
                    <code>mux.mode: &quot;group&quot;</code>
                  </li>
                  <li>TCP + UDP open on the public port</li>
                  <li>
                    <code>users[].id</code> matches <code>token</code>
                  </li>
                </ul>
                <div className="guide-wizard-checklist-links">
                  <Link className="button secondary" href="/download/">
                    Download binaries
                  </Link>
                  <Link className="button ghost" href="/config/#native-carriers">
                    Carrier details
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
