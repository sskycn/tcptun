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
  nativeServerExample,
  nativeWorkflowCommands,
} from "./site-data";

const exampleTabs = [
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

type ExampleTabId = (typeof exampleTabs)[number]["id"];

export default function ConfigSection() {
  const [activeTab, setActiveTab] = useState<ExampleTabId>("server");
  const activeExample = exampleTabs.find((tab) => tab.id === activeTab) ?? exampleTabs[0];

  return (
    <section className="section config-section" id="config">
      <div className="section-heading row-heading">
        <div>
          <p className="eyebrow">配置说明</p>
          <h2>严格 JSON 拓扑，重点讲清 native。</h2>
          <p>
            tcptun 用一份配置描述入口、出口、路由与发现。下面以 <strong>native</strong>{" "}
            私有隧道协议为主，覆盖最小可运行示例、字段含义、mux / QUIC 与生成命令。
          </p>
        </div>
        <div className="chip-row">
          <span>FileConfig</span>
          <span>native</span>
          <span>mux</span>
          <span>quic</span>
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

      <div className="native-focus">
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

      <div className="config-example-panel">
        <div className="config-example-toolbar">
          <div className="config-example-tabs" role="tablist" aria-label="Native 配置示例">
            {exampleTabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={activeTab === tab.id}
                className={activeTab === tab.id ? "is-active" : undefined}
                onClick={() => setActiveTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="config-example-meta">
            <span>{activeExample.hint}</span>
            <CopyButton value={activeExample.code} label="复制配置" className="copy-button-solid" />
          </div>
        </div>
        <pre className="config-example-code" role="tabpanel">
          <code>{activeExample.code}</code>
        </pre>
      </div>

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
          <h3>字段速查</h3>
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
          <h3>推荐工作流</h3>
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
    </section>
  );
}
