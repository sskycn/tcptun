"use client";

import { useState } from "react";
import CopyButton from "./copy-button";
import {
  configModelNotes,
  nativeClientExample,
  nativeConfigHighlights,
  nativeFieldGroups,
  nativeMuxNotes,
  nativeQuicClientExample,
  nativeQuicServerExample,
  nativeRealityClientExample,
  nativeRealityServerExample,
  nativeReverseClientExample,
  nativeReverseServerExample,
  nativeServerExample,
  nativeWorkflowCommands,
  protocolOutboundSnippets,
  realityCommands,
  realityFieldGroups,
  realityRules,
  reversePublishNotes,
} from "./site-data";

const nativeExampleTabs = [
  {
    id: "server",
    label: "Server raw+mux",
    hint: "server-native.json",
    code: nativeServerExample,
  },
  {
    id: "client",
    label: "Client raw+mux",
    hint: "client-native.json",
    code: nativeClientExample,
  },
  {
    id: "quic-server",
    label: "Server QUIC",
    hint: "server-native-quic.json",
    code: nativeQuicServerExample,
  },
  {
    id: "quic-client",
    label: "Client QUIC",
    hint: "client-native-quic.json",
    code: nativeQuicClientExample,
  },
  {
    id: "reverse-server",
    label: "Reverse publish server",
    hint: "server-reverse.json",
    code: nativeReverseServerExample,
  },
  {
    id: "reverse-client",
    label: "Reverse publish client",
    hint: "client-reverse.json",
    code: nativeReverseClientExample,
  },
] as const;

const realityExampleTabs = [
  {
    id: "native-server",
    label: "Native server",
    hint: "native + REALITY server",
    code: nativeRealityServerExample,
  },
  {
    id: "native-client",
    label: "Native client",
    hint: "native + REALITY client",
    code: nativeRealityClientExample,
  },
] as const;

const nativeRealityQuicLayers = [
  {
    label: "Protocol",
    value: "native",
    body: "Handles token auth, TCP / UDP tunnel semantics, and reverse publish.",
  },
  {
    label: "Transport",
    value: "raw",
    body: "Required base transport for QUIC mode; do not stack ws / h2 / h3.",
  },
  {
    label: "Security",
    value: "reality-quic",
    body: "Protects the QUIC handshake with REALITY keys and site parameters; no cert deploy needed.",
  },
  {
    label: "Multiplexing",
    value: "mux.mode: quic",
    body: "Uses a QUIC connection pool for streams and UDP DATAGRAMs.",
  },
] as const;

type NativeTabId = (typeof nativeExampleTabs)[number]["id"];
type RealityTabId = (typeof realityExampleTabs)[number]["id"];

export default function ConfigSection() {
  const [nativeTab, setNativeTab] = useState<NativeTabId>("server");
  const [realityTab, setRealityTab] = useState<RealityTabId>("native-server");

  const activeNative =
    nativeExampleTabs.find((tab) => tab.id === nativeTab) ?? nativeExampleTabs[0];
  const activeReality =
    realityExampleTabs.find((tab) => tab.id === realityTab) ?? realityExampleTabs[0];
  const activeSnippet = protocolOutboundSnippets.native;

  return (
    <section className="section config-section" id="config">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">Config</p>
          <h2>JSON topology, native, and REALITY.</h2>
          <p>
            Describe inbounds, outbounds, and security in one config. This site documents the native
            tunnel protocol end to end.
          </p>
        </div>
        <div className="chip-row">
          <a className="chip-link" href="#config-native">
            native
          </a>
          <a className="chip-link" href="#native-reality-quic">
            reality-quic
          </a>
          <a className="chip-link" href="#reverse">
            Reverse publish
          </a>
          <a className="chip-link" href="#reality">
            REALITY
          </a>
          <a className="chip-link" href="#generate">
            Generate
          </a>
          <a className="chip-link" href="#native-snippet">
            Snippet
          </a>
        </div>
      </div>

      <div className="config-model-grid">
        {configModelNotes.map((item) => (
          <article className="config-model-card" key={item.title}>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </article>
        ))}
      </div>

      {/* ---------- Native ---------- */}
      <div className="native-focus" id="config-native">
        <div className="native-focus-heading">
          <div>
            <p className="eyebrow">Native</p>
            <h3>Low-overhead private tunnel</h3>
            <p>
              Supports TCP / UDP and mux, with transport options raw / ws / h2 / h3. Server{" "}
              <code>users[].id</code> and client <code>token</code> must match.
            </p>
          </div>
          <div className="native-auth-map" aria-label="Native auth mapping">
            <div>
              <span>Server inbound</span>
              <code>users[].id</code>
            </div>
            <span className="native-auth-eq" aria-hidden="true">
              =
            </span>
            <div>
              <span>Client outbound</span>
              <code>token</code>
            </div>
          </div>
        </div>

        <div className="highlight-grid">
          {nativeConfigHighlights.map((item) => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="native-reality-quic" id="native-reality-quic">
        <div className="native-reality-quic-heading">
          <div>
            <p className="eyebrow">Native QUIC</p>
            <h3>
              <code>native + raw + reality-quic</code>
            </h3>
            <p>
              This is not three interchangeable modes, but one layered stack: <code>native</code> is
              the tunnel protocol, <code>raw</code> is the transport, and <code>reality-quic</code> is
              the QUIC-only security layer. You must also set <code>mux.mode=quic</code> to enable the
              native QUIC connection pool.
            </p>
          </div>
          <div className="native-reality-quic-fit">
            <span>Best for</span>
            <strong>tcptun on both ends</strong>
            <p>Carry TCP streams and UDP DATAGRAMs together without managing TLS certificates.</p>
          </div>
        </div>

        <div className="native-reality-quic-stack" aria-label="Native Reality QUIC stack">
          {nativeRealityQuicLayers.map((layer, index) => (
            <div className="native-reality-quic-layer-wrap" key={layer.label}>
              <article className="native-reality-quic-layer">
                <span>{layer.label}</span>
                <code>{layer.value}</code>
                <p>{layer.body}</p>
              </article>
              {index < nativeRealityQuicLayers.length - 1 ? (
                <span className="native-reality-quic-plus" aria-hidden="true">+</span>
              ) : null}
            </div>
          ))}
        </div>

        <div className="native-reality-quic-footer">
          <div>
            <strong>Both ends must match</strong>
            <p>
              token, REALITY key pair, server name, and short ID must correspond. Plain{" "}
              <code>security.type=reality</code> cannot replace <code>reality-quic</code>.
            </p>
          </div>
          <div className="native-reality-quic-command">
            <pre><code>tcptun config native --quic --server proxy.example.com --port 9443</code></pre>
            <CopyButton
              value="tcptun config native --quic --server proxy.example.com --port 9443"
              label="Copy"
              className="copy-button-on-dark"
            />
          </div>
        </div>
      </div>

      <ExamplePanel
        tabs={nativeExampleTabs}
        activeId={nativeTab}
        onChange={(id) => setNativeTab(id as NativeTabId)}
        active={activeNative}
        tablistLabel="Native config examples"
      />

      <div className="native-pair-note">
        <div>
          <strong>Minimal topology</strong>
          <p>
            The server exposes a <code>native</code> inbound; the client forwards a local{" "}
            <code>mixed</code> inbound to a <code>native</code> outbound. Replace the sample
            credentials and addresses to run.
          </p>
        </div>
        <div className="native-pair-flow" aria-hidden="true">
          <span>mixed :1080</span>
          <span className="arrow">→</span>
          <span>native outbound</span>
          <span className="arrow">→</span>
          <span>native :9443</span>
          <span className="arrow">→</span>
          <span>direct</span>
        </div>
      </div>

      <div className="field-groups">
        <div className="section-subheading">
          <h3>Fields</h3>
          <p>Common field overview.</p>
        </div>
        <div className="field-group-grid">
          {nativeFieldGroups.map((group) => (
            <article className="field-group-card" key={group.name}>
              <h4>{group.name}</h4>
              <dl>
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <dt>
                      <code>{field.key}</code>
                      <span>{field.side}</span>
                    </dt>
                    <dd>{field.detail}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      </div>

      <div className="mux-panel">
        <div className="section-subheading">
          <h3>Mux / QUIC</h3>
          <p>
            Enable mux for short-connection workloads. Prefer <code>native + raw + mux</code> for peak throughput.
          </p>
        </div>
        <div className="mux-grid">
          {nativeMuxNotes.map((item) => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
        <div className="mux-snippet">
          <div className="mux-snippet-heading">
            <span>mux snippet</span>
            <CopyButton
              value={`"mux": {
  "max_sessions": 4,
  "max_streams_per_session": 16,
  "warm_spares": 1
}`}
              label="Copy"
              className="copy-button-ghost"
            />
          </div>
          <pre>
            <code>{`"mux": {
  "max_sessions": 4,
  "max_streams_per_session": 16,
  "warm_spares": 1
}`}</code>
          </pre>
        </div>
      </div>

      <div className="mux-panel" id="reverse">
        <div className="section-subheading">
          <h3>Reverse publish</h3>
          <p>
            Hang NAT-side TCP/UDP services on tunnel server listen ports. Configure{" "}
            <code>publish</code> on the server and <code>expose</code> on the client.
          </p>
        </div>
        <div className="mux-grid">
          {reversePublishNotes.map((item) => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </div>

      <div className="config-workflow">
        <div className="section-subheading">
          <h3>Workflow</h3>
          <p>Generate → validate → start.</p>
        </div>
        <div className="config-workflow-grid">
          {nativeWorkflowCommands.map((item, index) => (
            <article key={item.name}>
              <div className="config-workflow-meta">
                <span className="mode-name">{item.name}</span>
                <span className="mode-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
              <div className="mode-command-row">
                <pre>
                  <code>{item.command}</code>
                </pre>
                <CopyButton value={item.command} label="Copy" className="copy-button-on-dark" />
              </div>
            </article>
          ))}
        </div>
      </div>

      {/* ---------- REALITY ---------- */}
      <div className="reality-panel" id="reality">
        <div className="section-subheading row-heading section-subheading-wide">
          <div>
            <p className="eyebrow">REALITY</p>
            <h3>REALITY and REALITY QUIC</h3>
            <p>
              Configured under <code>security</code> on native endpoints. Plain{" "}
              <code>reality</code> pairs with raw TCP; <code>reality-quic</code> pairs with QUIC mux.
            </p>
          </div>
          <div className="chip-row">
            <span>raw</span>
            <span>X25519</span>
          </div>
        </div>

        <div className="highlight-grid">
          {realityRules.map((item) => (
            <article key={item.title}>
              <h4>{item.title}</h4>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="field-group-grid reality-fields">
          {realityFieldGroups.map((group) => (
            <article className="field-group-card" key={group.name}>
              <h4>{group.name}</h4>
              <dl>
                {group.fields.map((field) => (
                  <div key={field.key}>
                    <dt>
                      <code>{field.key}</code>
                    </dt>
                    <dd>{field.detail}</dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>

        <ExamplePanel
          tabs={realityExampleTabs}
          activeId={realityTab}
          onChange={(id) => setRealityTab(id as RealityTabId)}
          active={activeReality}
          tablistLabel="REALITY config examples"
        />

        <div className="reality-commands">
          {realityCommands.map((item) => (
            <article key={item.title}>
              <div className="config-workflow-meta">
                <h4>{item.title}</h4>
              </div>
              <p>{item.body}</p>
              <div className="mode-command-row">
                <pre>
                  <code>{item.command}</code>
                </pre>
                <CopyButton value={item.command} label="Copy" className="copy-button-on-dark" />
              </div>
            </article>
          ))}
        </div>

        <div className="reality-warn">
          <strong>Note</strong>
          <p>
            Plain <code>reality</code> cannot be used directly with QUIC mux. Native QUIC can use
            certificate TLS or <code>security.type=reality-quic</code>.{" "}
            <code>tcptun config native --quic</code> generates the latter.
          </p>
        </div>
      </div>

      {/* ---------- Native outbound snippet ---------- */}
      <div className="protocol-compare-panel" id="native-snippet">
        <div className="section-subheading row-heading section-subheading-wide">
          <div>
            <p className="eyebrow">Snippet</p>
            <h3>Native outbound shape</h3>
            <p>Minimal client-side native tunnel outbound used across the examples on this site.</p>
          </div>
        </div>

        <div className="snippet-panel">
          <div className="snippet-toolbar">
            <span className="snippet-label">native outbound</span>
            <CopyButton value={activeSnippet} label="Copy" className="copy-button-solid" />
          </div>
          <pre className="config-example-code">
            <code>{activeSnippet}</code>
          </pre>
          <p className="snippet-footnote">
            <code>tcptun config native --server … --port …</code>
          </p>
        </div>
      </div>
    </section>
  );
}

type ExampleTab = {
  id: string;
  label: string;
  hint: string;
  code: string;
};

function ExamplePanel({
  tabs,
  activeId,
  onChange,
  active,
  tablistLabel,
}: {
  tabs: readonly ExampleTab[];
  activeId: string;
  onChange: (id: string) => void;
  active: ExampleTab;
  tablistLabel: string;
}) {
  return (
    <div className="config-example-panel">
      <div className="config-example-toolbar">
        <div className="config-example-tabs" role="tablist" aria-label={tablistLabel}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeId === tab.id}
              className={activeId === tab.id ? "is-active" : undefined}
              onClick={() => onChange(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="config-example-meta">
          <span>{active.hint}</span>
          <CopyButton value={active.code} label="Copy config" className="copy-button-solid" />
        </div>
      </div>
      <pre className="config-example-code" role="tabpanel">
        <code>{active.code}</code>
      </pre>
    </div>
  );
}
