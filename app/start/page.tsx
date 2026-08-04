import type { Metadata } from "next";
import Image from "next/image";
import CopyButton from "../copy-button";
import PageHero from "../page-hero";
import { PlatformDownloadButton } from "../platform-download";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `CLI quickstart · tcptun v${releaseVersion}`,
  description: "Run, check, generate, and import tcptun configs from the command line.",
};

const displayVersion = `v${releaseVersion}`;

const workflows = [
  {
    name: "run",
    title: "Run a config",
    body: "Load and validate JSON, then start every inbound.",
    command: "tcptun --config config.json",
  },
  {
    name: "check",
    title: "Validate only",
    body: "Validate and compile without listening on ports.",
    command: "tcptun config check --config config.json",
  },
  {
    name: "generate",
    title: "Generate a pair",
    body: "Generate matching server / client configs with credentials and REALITY keys.",
    command: "tcptun config native --server proxy.example.com --port 9443 --server-name example.com --dest example.com:443",
  },
  {
    name: "uri",
    title: "Import URI",
    body: "Build a client config from native / VLESS / VMess / Trojan URIs.",
    command: "tcptun uri import --input client.uri --client --output client.json",
  },
  {
    name: "quic",
    title: "Forced QUIC pair",
    body: "Generate native Reality with carrier.mode=quic (no TCP fallback).",
    command: "tcptun config native --quic --server proxy.example.com --port 9443",
  },
  {
    name: "resume",
    title: "Resumable Reality auto",
    body: "After generating a native Reality pair, set mux.resume=true on both ends (v0.2.5+).",
    command: `# on both server inbound and client outbound mux blocks
"mux": {
  "enabled": true,
  "resume": true,
  "resume_timeout": "15s",
  "resume_buffer_size": 4194304
}`,
  },
];

export default function StartPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="CLI"
        title="Run, check, generate, import."
        description="Most power lives in JSON; the CLI loads, validates, and generates configs. Start the server first, then the client."
        actions={[
          { href: "/download/", label: "Download binaries", variant: "primary" },
          { href: "/examples/", label: "Copy examples", variant: "secondary" },
        ]}
      />

      <section className="section quickstart-section">
        <div className="mode-grid">
          {workflows.map((item, index) => (
            <article className="mode-card" key={item.name}>
              <div className="mode-meta">
                <span className="mode-name">{item.name}</span>
                <span className="mode-index">{String(index + 1).padStart(2, "0")}</span>
              </div>
              <h3>{item.title}</h3>
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
        <div className="next-step">
          <div className="next-step-glow" aria-hidden="true" />
          <Image src="/tcptun-logo.png" alt="" width={64} height={64} />
          <div>
            <p className="eyebrow">tcptun {displayVersion}</p>
            <h2>Download and run.</h2>
          </div>
          <PlatformDownloadButton />
        </div>
      </section>
    </SiteChrome>
  );
}
