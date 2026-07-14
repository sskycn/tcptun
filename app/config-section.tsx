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
  nativeServerExample,
  nativeWorkflowCommands,
  protocolComparison,
  protocolOutboundSnippets,
  realityCommands,
  realityFieldGroups,
  realityRules,
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
          <p className="eyebrow">配置说明</p>
          <h2>严格 JSON 拓扑：native、REALITY 与协议对照。</h2>
          <p>
            下面从 FileConfig 总览出发，重点讲 <strong>native</strong> 最小可运行配置，再覆盖{" "}
            <strong>REALITY</strong> 安全层，以及 native / vless / vmess / trojan 的选型对照。
          </p>
        </div>
        <div className="chip-row">
          <a className="chip-link" href="#config-native">
            native
          </a>
          <a className="chip-link" href="#reality">
            REALITY
          </a>
          <a className="chip-link" href="#protocol-compare">
            协议对照
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
            <p className="eyebrow">Native 协议</p>
            <h3>tcptun ↔ tcptun 的低开销认证隧道</h3>
            <p>
              支持 TCP / UDP relay、内置 mux，以及 raw / WebSocket / HTTP2 / HTTP3 transport。
              TLS 与 REALITY 在端点上配置；inbound 用 <code>users[].id</code>，outbound 用{" "}
              <code>token</code>，两端必须一致。
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

      <ExamplePanel
        tabs={nativeExampleTabs}
        activeId={nativeTab}
        onChange={(id) => setNativeTab(id as NativeTabId)}
        active={activeNative}
        tablistLabel="Native 配置示例"
      />

      <div className="native-pair-note">
        <div>
          <strong>配对关系</strong>
          <p>
            服务端 <code>type: native</code> inbound 暴露隧道；客户端本地{" "}
            <code>mixed</code>/<code>socks5</code> 入口把流量交给{" "}
            <code>type: native</code> outbound。把示例里的 <code>change-me</code>、
            <code>proxy.example.com</code> 换成真实值后即可对测。
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
          <h3>Native 字段速查</h3>
          <p>只列出 native 部署最常用、也最容易配错的字段。</p>
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
          <h3>Mux 与 QUIC</h3>
          <p>
            同版本两端推荐开启 mux 以合并短连接；追求峰值吞吐时优先{" "}
            <code>native + raw + mux</code>。
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
            <span>outbound mux 常用片段</span>
            <CopyButton
              value={`"mux": {
  "enabled": true,
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
  "enabled": true,
  "max_sessions": 4,
  "max_streams_per_session": 16,
  "warm_spares": 1
}`}</code>
          </pre>
        </div>
      </div>

      <div className="config-workflow">
        <div className="section-subheading">
          <h3>Native 推荐工作流</h3>
          <p>生成 → 校验 → 启动；需要分享客户端时再用 URI 导入。</p>
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
            <h3>隧道端点上的伪装安全层</h3>
            <p>
              REALITY 挂在 <code>security</code> 上，不是独立 outbound 类型。生成器对四种隧道协议默认输出{" "}
              <code>raw + REALITY</code> 配对配置；VLESS 额外带 Vision。
            </p>
          </div>
          <div className="chip-row">
            <span>raw only</span>
            <span>no transport.tls</span>
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
          <strong>与 QUIC / TLS 的边界</strong>
          <p>
            <code>mux.mode: &quot;quic&quot;</code> 要求 <code>transport.tls</code>，而 REALITY 禁止{" "}
            <code>transport.tls</code>，二者互斥。选伪装用 REALITY；选 native QUIC 承载用证书 TLS。
            生成器在 REALITY 场景下默认 <code>mux.enabled: false</code>，需要时再按两端版本手动打开。
          </p>
        </div>
      </div>

      {/* ---------- Protocol compare ---------- */}
      <div className="protocol-compare-panel" id="protocol-compare">
        <div className="section-subheading row-heading section-subheading-wide">
          <div>
            <p className="eyebrow">协议对照</p>
            <h3>native / vless / vmess / trojan</h3>
            <p>
              互操作指 <strong>wire protocol</strong> 兼容，不是配置文件兼容。tcptun JSON 不能直接当作
              Xray 配置使用。
            </p>
          </div>
        </div>

        <div className="compare-table-wrap">
          <table className="compare-table">
            <thead>
              <tr>
                <th>协议</th>
                <th>凭据</th>
                <th>互操作</th>
                <th>生成器默认安全</th>
                <th>Vision / 备注</th>
                <th>Mux</th>
                <th>更适合</th>
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
            <CopyButton value={activeSnippet} label="复制片段" className="copy-button-solid" />
          </div>
          <pre className="config-example-code">
            <code>{activeSnippet}</code>
          </pre>
          <p className="snippet-footnote">
            生成完整配对配置：
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
