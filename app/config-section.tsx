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
  protocolComparison,
  protocolOutboundSnippets,
  realityCommands,
  realityFieldGroups,
  realityRules,
  reversePublishNotes,
  vlessRealityClientExample,
  vlessRealityServerExample,
} from "./site-data";

const nativeExampleTabs = [
  {
    id: "server",
    label: "服务端 raw+mux",
    hint: "server-native.json",
    code: nativeServerExample,
  },
  {
    id: "client",
    label: "客户端 raw+mux",
    hint: "client-native.json",
    code: nativeClientExample,
  },
  {
    id: "quic-server",
    label: "服务端 QUIC",
    hint: "server-native-quic.json",
    code: nativeQuicServerExample,
  },
  {
    id: "quic-client",
    label: "客户端 QUIC",
    hint: "client-native-quic.json",
    code: nativeQuicClientExample,
  },
  {
    id: "reverse-server",
    label: "反向发布服务端",
    hint: "server-reverse.json",
    code: nativeReverseServerExample,
  },
  {
    id: "reverse-client",
    label: "反向发布客户端",
    hint: "client-reverse.json",
    code: nativeReverseClientExample,
  },
] as const;

const realityExampleTabs = [
  {
    id: "vless-server",
    label: "VLESS 服务端",
    hint: "server-vless-reality.json",
    code: vlessRealityServerExample,
  },
  {
    id: "vless-client",
    label: "VLESS 客户端",
    hint: "client-vless-reality.json",
    code: vlessRealityClientExample,
  },
  {
    id: "native-server",
    label: "Native 服务端",
    hint: "native + REALITY server",
    code: nativeRealityServerExample,
  },
  {
    id: "native-client",
    label: "Native 客户端",
    hint: "native + REALITY client",
    code: nativeRealityClientExample,
  },
] as const;

const nativeRealityQuicLayers = [
  {
    label: "Protocol",
    value: "native",
    body: "负责 token 认证、TCP / UDP 隧道语义与反向发布。",
  },
  {
    label: "Transport",
    value: "raw",
    body: "作为 QUIC 模式要求的基础传输，不再叠加 ws / h2 / h3。",
  },
  {
    label: "Security",
    value: "reality-quic",
    body: "使用 REALITY 密钥与站点参数保护 QUIC 握手，无需部署证书。",
  },
  {
    label: "Multiplexing",
    value: "mux.mode: quic",
    body: "用 QUIC 连接池承载 stream 与 UDP DATAGRAM。",
  },
] as const;

type NativeTabId = (typeof nativeExampleTabs)[number]["id"];
type RealityTabId = (typeof realityExampleTabs)[number]["id"];
type SnippetKey = keyof typeof protocolOutboundSnippets;

export default function ConfigSection() {
  const [nativeTab, setNativeTab] = useState<NativeTabId>("server");
  const [realityTab, setRealityTab] = useState<RealityTabId>("vless-server");
  const [snippetKey, setSnippetKey] = useState<SnippetKey>("native");

  const activeNative =
    nativeExampleTabs.find((tab) => tab.id === nativeTab) ?? nativeExampleTabs[0];
  const activeReality =
    realityExampleTabs.find((tab) => tab.id === realityTab) ?? realityExampleTabs[0];
  const activeSnippet = protocolOutboundSnippets[snippetKey];

  return (
    <section className="section config-section" id="config">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">配置</p>
          <h2>JSON 拓扑、native 与 REALITY。</h2>
          <p>用一份配置描述入口、出口与安全层。先看 native，再看 REALITY 与协议选型。</p>
        </div>
        <div className="chip-row">
          <a className="chip-link" href="#config-native">
            native
          </a>
          <a className="chip-link" href="#native-reality-quic">
            reality-quic
          </a>
          <a className="chip-link" href="#reverse">
            反向发布
          </a>
          <a className="chip-link" href="#reality">
            REALITY
          </a>
          <a className="chip-link" href="#generate">
            生成
          </a>
          <a className="chip-link" href="#protocol-compare">
            对照
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
            <h3>低开销私有隧道</h3>
            <p>
              支持 TCP / UDP 与 mux，传输可选 raw / ws / h2 / h3。服务端{" "}
              <code>users[].id</code> 与客户端 <code>token</code> 必须一致。
            </p>
          </div>
          <div className="native-auth-map" aria-label="Native 认证对应关系">
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
              这不是三种可替换的模式，而是一套分层组合：<code>native</code> 是隧道协议，
              <code>raw</code> 是传输，<code>reality-quic</code> 是 QUIC 专用安全层；同时必须设置
              <code>mux.mode=quic</code> 才会启用原生 QUIC 连接池。
            </p>
          </div>
          <div className="native-reality-quic-fit">
            <span>适合</span>
            <strong>两端均为 tcptun</strong>
            <p>希望同时承载 TCP stream 与 UDP DATAGRAM，并避免维护 TLS 证书。</p>
          </div>
        </div>

        <div className="native-reality-quic-stack" aria-label="Native Reality QUIC 分层结构">
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
            <strong>两端必须配对</strong>
            <p>
              token、REALITY 公私钥、server name 与 short ID 要对应；普通
              <code>security.type=reality</code> 不能代替 <code>reality-quic</code>。
            </p>
          </div>
          <div className="native-reality-quic-command">
            <pre><code>tcptun config native --quic --server proxy.example.com --port 9443</code></pre>
            <CopyButton
              value="tcptun config native --quic --server proxy.example.com --port 9443"
              label="复制"
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
        tablistLabel="Native 配置示例"
      />

      <div className="native-pair-note">
        <div>
          <strong>最小拓扑</strong>
          <p>
            服务端暴露 <code>native</code> 入口；客户端用本地 <code>mixed</code> 入口转发到{" "}
            <code>native</code> 出口。替换示例中的凭据与地址即可运行。
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
          <h3>字段</h3>
          <p>常用字段一览。</p>
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
            短连接场景建议开启 mux。峰值吞吐优先 <code>native + raw + mux</code>。
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
            <span>mux 片段</span>
            <CopyButton
              value={`"mux": {
  "max_sessions": 4,
  "max_streams_per_session": 16,
  "warm_spares": 1
}`}
              label="复制"
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
          <h3>反向发布</h3>
          <p>
            把 NAT 后的 TCP/UDP 服务挂到隧道服务端监听端口。服务端配置{" "}
            <code>publish</code>，客户端配置 <code>expose</code>。
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
          <h3>工作流</h3>
          <p>生成 → 校验 → 启动。</p>
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
                <CopyButton value={item.command} label="复制" className="copy-button-on-dark" />
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
            <h3>REALITY 与 REALITY QUIC</h3>
            <p>
              写在 <code>security</code> 中。四种隧道协议均可使用；VLESS 生成配置默认附带 Vision。
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
          tablistLabel="REALITY 配置示例"
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
                <CopyButton value={item.command} label="复制" className="copy-button-on-dark" />
              </div>
            </article>
          ))}
        </div>

        <div className="reality-warn">
          <strong>注意</strong>
          <p>
            普通 <code>reality</code> 不能直接用于 QUIC mux；Native QUIC 可选证书 TLS，或使用
            <code>security.type=reality-quic</code>。<code>tcptun config native --quic</code> 会生成后者。
          </p>
        </div>
      </div>

      {/* ---------- Protocol compare ---------- */}
      <div className="protocol-compare-panel" id="protocol-compare">
        <div className="section-subheading row-heading section-subheading-wide">
          <div>
            <p className="eyebrow">对照</p>
            <h3>四种隧道协议</h3>
            <p>与 Xray 兼容的是线路协议，不是配置文件。</p>
          </div>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>协议</th>
                <th>凭据</th>
                <th>互操作</th>
                <th>默认安全</th>
                <th>Vision</th>
                <th>Mux</th>
                <th>场景</th>
              </tr>
            </thead>
            <tbody>
              {protocolComparison.map((row) => (
                <tr key={row.name}>
                  <td>
                    <code className="protocol-name-cell">{row.name}</code>
                  </td>
                  <td>{row.credential}</td>
                  <td>{row.interop}</td>
                  <td>{row.securityDefault}</td>
                  <td>{row.vision}</td>
                  <td>{row.muxNote}</td>
                  <td>{row.bestFor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="snippet-panel">
          <div className="snippet-toolbar">
            <div className="config-example-tabs" role="tablist" aria-label="协议 outbound 片段">
              {(Object.keys(protocolOutboundSnippets) as SnippetKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={snippetKey === key}
                  className={snippetKey === key ? "is-active" : undefined}
                  onClick={() => setSnippetKey(key)}
                >
                  {key}
                </button>
              ))}
            </div>
            <CopyButton value={activeSnippet} label="复制" className="copy-button-solid" />
          </div>
          <pre className="config-example-code">
            <code>{activeSnippet}</code>
          </pre>
          <p className="snippet-footnote">
            <code>
              {protocolComparison.find((item) => item.name === snippetKey)?.generator ??
                "tcptun config <protocol> --server … --port …"}
            </code>
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
          <CopyButton value={active.code} label="复制配置" className="copy-button-solid" />
        </div>
      </div>
      <pre className="config-example-code" role="tabpanel">
        <code>{active.code}</code>
      </pre>
    </div>
  );
}
