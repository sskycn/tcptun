import type { Metadata } from "next";
import Link from "next/link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { releaseVersion } from "../site-data";

export const metadata: Metadata = {
  title: `Privacy · tcptun v${releaseVersion}`,
  description:
    "tcptun privacy notice: local browser processing, local storage, cookies, peer-to-peer chat, and third-party infrastructure.",
};

const privacyItems = [
  {
    title: "What this notice covers",
    body: (
      <>
        This notice covers the tcptun website, its browser-based tools, and the optional Chat page. It
        does not replace the privacy policies of hosting, CDN, package, signaling, STUN/TURN, or other
        services that you choose to use with tcptun. The tcptun command-line runtime and any server you
        operate can process network traffic according to your own configuration; this page does not
        describe those deployments.
      </>
    ),
  },
  {
    title: "Information processed by the website",
    body: (
      <>
        When a browser requests a page or asset, the hosting, CDN, and security infrastructure may
        receive ordinary technical information such as an IP address, browser and device information,
        request time, referrer, and requested resource. These providers control their own logs and
        retention periods. The site does not provide accounts, a contact form, a mailing list, or
        first-party advertising analytics.
      </>
    ),
  },
  {
    title: "Browser-local tools",
    body: (
      <>
        Config generation, URI conversion, and Xray conversion are designed to run in your browser.
        Values you paste into those tools, including keys, tokens, passwords, and configuration text,
        are not intentionally uploaded by the tcptun application. As with any web application, browser
        extensions, network inspection software, and the browser itself can have their own access.
      </>
    ),
  },
  {
    title: "Local storage and cookies",
    body: (
      <>
        The site uses browser storage for operations and preferences. This can include your theme and
        cookie-consent choice, and on Chat it can include a generated peer identity, display name,
        connection settings, conversation text, and file/config metadata. Chat history does not store
        file bytes or blob URLs in local storage. We do not use first-party advertising or marketing
        tracking cookies. Hosting, CDN, or security providers may use technical cookies or logs under
        their own policies.
      </>
    ),
  },
  {
    title: "Chat, signaling, and peer connections",
    body: (
      <>
        Chat uses PeerJS signaling at <code>0.peerjs.com</code> to help browsers find one another. Peer
        IDs, room and display-name metadata, connection events, and network information may be visible
        to that service or to the network providers involved. After a connection is established, chat
        messages, configs, and files are sent over a WebRTC data channel and are encrypted between the
        peers by the application. Encryption does not hide all connection metadata and is not a promise
        about the privacy practices of a peer or third-party infrastructure.
      </>
    ),
  },
  {
    title: "STUN, TURN, and sharing",
    body: (
      <>
        Chat defaults to local-network candidates and does not enable public STUN or TURN by default.
        If you add STUN or TURN servers, your browser may send them connection metadata; if a TURN relay
        is used, peer traffic may pass through that relay. You choose those providers and are responsible
        for reviewing their terms and privacy policies. The site may also link to third-party websites,
        package registries, CDNs, and release services that operate independently.
      </>
    ),
  },
  {
    title: "Retention and your choices",
    body: (
      <>
        Browser-local data remains until it expires, is replaced, or you clear it through your browser
        or the relevant feature. Session-only file objects are released when the chat session ends; the
        local history keeps message text and file/config metadata, not file contents. You can block
        storage, clear site data, disable optional STUN/TURN settings, or stop using Chat. Blocking
        storage may reset preferences or prevent some features from working.
      </>
    ),
  },
  {
    title: "Questions, requests, and updates",
    body: (
      <>
        For privacy questions or requests, use the project&apos;s public repository at{" "}
        <a href="https://github.com/sskycn/tcptun" target="_blank" rel="noreferrer">
          github.com/sskycn/tcptun
        </a>
        . Please do not publish passwords, private keys, personal documents, or other sensitive data in
        a public issue. We may update this notice when the site or its data practices change; the
        “Last updated” date below identifies the current version.
      </>
    ),
  },
] as const;

const androidPrivacyItems = [
  {
    title: "App role and operator backend",
    body: (
      <>
        The tcptun-kotlin Android client is a local VPN and transparent-proxy tool. It uses Android
        <code>VpnService</code> and connects to remote endpoints selected or provided by you. The
        project operator does not provide or operate VPN nodes, accounts, subscriptions, cloud sync,
        advertising, analytics, crash reporting, or a backend that receives app data.
      </>
    ),
  },
  {
    title: "Data kept on the Android device",
    body: (
      <>
        The app may process profiles and credentials, TLS and transport parameters, routing rules,
        runtime settings, app package names and labels, local network information, VPN/proxy status,
        diagnostic state, and logs. Profiles, routing rules, and some settings are stored in the app&apos;s
        private <code>SharedPreferences</code>. The current app does not separately encrypt credentials
        inside those local profile files, so protect the device and exported profiles.
      </>
    ),
  },
  {
    title: "Clipboard and QR scanning",
    body: (
      <>
        Clipboard text is read only after you explicitly choose to import a profile. After a successful
        import, the app attempts to clear clipboard text that still matches the imported value. Camera
        access is requested only when you open the QR scanner; preview frames are used on the device to
        recognize a profile QR code and are not uploaded to a tcptun operator server.
      </>
    ),
  },
  {
    title: "VPN traffic and remote endpoints",
    body: (
      <>
        When VPN mode is enabled, device traffic is forwarded according to the profile through the
        remote endpoint you selected. That endpoint operator may see or retain connection time, source
        IP, destination information, traffic metadata, and content not protected by end-to-end
        encryption. The endpoint operator controls its own logs and privacy policy; use only endpoints
        you trust. The tcptun operator does not receive that endpoint traffic through a project backend.
      </>
    ),
  },
  {
    title: "Connectivity diagnostics",
    body: (
      <>
        While a VPN session is active, the app may perform lightweight HTTPS <code>204</code> checks to
        <code>connectivitycheck.gstatic.com/generate_204</code> and
        <code>cp.cloudflare.com/generate_204</code>. A user-triggered TCPing diagnostic tests port 443
        on <code>google.com</code>, <code>github.com</code>, and <code>cloudflare.com</code>. Those sites
        may receive connection metadata under their own policies. These checks are for connectivity, not
        advertising or behavioral analytics.
      </>
    ),
  },
  {
    title: "Optional flow analysis",
    body: (
      <>
        If you explicitly enable traffic analysis for an app, the client may display destination
        domain/IP, port, protocol, route reason, app package name, and timestamps locally for diagnosis.
        The current Android client does not send this state to a tcptun operator server. When flow
        analysis is disabled, the client skips the related app-identity lookup where the runtime allows.
      </>
    ),
  },
  {
    title: "Permissions",
    body: (
      <>
        The Android client may request internet and network-state access, VPN and foreground-service
        operation, camera access for QR scanning, and notification permission for the VPN status
        notification. Android controls these permissions. Camera access is not required for ordinary
        profile editing or VPN use.
      </>
    ),
  },
  {
    title: "Android retention and deletion",
    body: (
      <>
        Local profiles, routing rules, and settings remain until you edit or delete them, clear the
        app&apos;s data in Android settings, or uninstall the app. Runtime logs and flow-analysis state are
        primarily held in memory and disappear when cleared or when the process ends. The project
        operator has no cloud copy; deletion requests for remote endpoint or diagnostic-site logs must
        go to those providers.
      </>
    ),
  },
  {
    title: "Android components and security boundary",
    body: (
      <>
        The client uses Android&apos;s VPN APIs, the tcptun-go bridge, CameraX, and Google ML Kit barcode
        scanning. No Firebase Analytics, Crashlytics, advertising SDK, or standalone telemetry SDK is
        part of the current Android project. App-private storage limits ordinary access by other apps,
        but it does not protect data if the device, profile, remote endpoint, or transport configuration
        is compromised.
      </>
    ),
  },
] as const;

const goPrivacyItems = [
  {
    title: "Core role and no automatic reporting",
    body: (
      <>
        tcptun-go is the local Go runtime and embeddable networking library behind the CLI, Android
        bridge, and other integrations. It has no account system, advertising system, analytics service,
        crash-reporting service, or developer-owned telemetry endpoint. It does not automatically send
        configurations, credentials, proxy traffic, logs, or usage reports to the tcptun project.
      </>
    ),
  },
  {
    title: "Traffic forwarding is configuration-driven",
    body: (
      <>
        The core accepts local TCP/UDP flows, SOCKS5 or mixed-proxy requests, TUN traffic, and tunnel
        protocol traffic according to the configuration supplied by the operator or embedding app. It
        may forward those flows to direct destinations, user-configured SOCKS5 or tunnel endpoints, or
        reverse-published services. The operators of those destinations and endpoints may see and retain
        connection metadata and any content not protected by the selected transport or application
        encryption.
      </>
    ),
  },
  {
    title: "Configuration and credentials",
    body: (
      <>
        JSON configuration, URI profiles, QR payloads, tokens, UUIDs, passwords, TLS/REALITY keys, and
        routing rules are read, validated, generated, or encoded locally by the Go process or its host.
        URI and QR artifacts can contain credentials and are written wherever the user or host requests;
        generated files should be protected and not shared through untrusted locations. The Go core does
        not create a cloud copy of these values.
      </>
    ),
  },
  {
    title: "DNS and name resolution",
    body: (
      <>
        A deployment can use the operating-system resolver or explicitly configured DNS servers. DNS
        queries may therefore be visible to the selected resolver, remote endpoint, or network provider,
        depending on the configuration and route. The optional DNS outbound pinning and fake-IP mapping
        are runtime features; fake-IP mappings are held in memory for that runtime and cleared when it
        stops. Review the privacy policy of every DNS provider you configure.
      </>
    ),
  },
  {
    title: "Logs and host callbacks",
    body: (
      <>
        Runtime logs are sent only to the output or callback supplied by the host, such as the CLI&apos;s
        local stderr or an embedding app&apos;s log callback. Depending on log level and configuration, logs
        and status events can contain local listeners, remote endpoints, connection errors, timestamps,
        and runtime state. The host controls whether those outputs are displayed, stored, or shared.
        Setting the runtime log level to <code>off</code> suppresses runtime logs.
      </>
    ),
  },
  {
    title: "Optional flow observation",
    body: (
      <>
        An embedding application can explicitly provide a flow observer or app-identity provider. If it
        does, the Go core can expose a flow&apos;s timestamp, TCP/UDP network, source, destination/domain or
        IP, port, original IP, outbound tag, route reason, and selected app identity. This is a local
        callback boundary, not automatic collection by tcptun-go; the embedding application decides
        whether to enable it and what to do with the events.
      </>
    ),
  },
  {
    title: "Status events are local callbacks",
    body: (
      <>
        The Android bridge can explicitly register status events such as remote-endpoint changes,
        reconnecting, and runtime connection issues. These events update the host&apos;s in-process status
        and may include remote endpoint summaries, state, errors, and timestamps. Registration controls
        callback delivery to the host; it does not send the events to a tcptun server. The current Android
        client keeps this state local for UI and diagnostics.
      </>
    ),
  },
  {
    title: "Discovery, probes, and reverse publishing",
    body: (
      <>
        In automatic no-config mode, the CLI can scan private IPv4 LAN addresses for a SOCKS5 service on
        port <code>1080</code> and stop after a successful handshake. Hosts or integrations can also run
        explicit outbound health or connectivity probes. Reverse publishing can make a selected local
        TCP/UDP service reachable through a tunnel. These operations create network connections visible
        to the contacted devices and service operators; they are not developer analytics.
      </>
    ),
  },
  {
    title: "Retention and responsibility",
    body: (
      <>
        The Go core keeps active sessions, route state, DNS fake-IP mappings, counters, and other runtime
        state in memory unless the host or operator writes it elsewhere. Stop or close ends the runtime and
        clears its in-memory state subject to normal process and OS behavior. Files, logs, endpoint records,
        DNS logs, and remote-server logs created by a particular deployment are controlled by that
        deployment&apos;s operator, not by the tcptun project.
      </>
    ),
  },
] as const;

export default function PrivacyPage() {
  return (
    <SiteChrome>
      <PageHero
        eyebrow="Privacy"
        title="Clear boundaries for your data."
        description="This notice explains what the tcptun website and its browser tools process, what stays on your device, and what changes when you use peer-to-peer Chat."
      />

      <section className="section privacy-section" id="privacy">
        <div className="section-heading">
          <p className="eyebrow">Privacy notice</p>
          <h2>What happens to information</h2>
          <p>
            Last updated August 4, 2026. This is a plain-language project notice, not legal advice. The
            rules that apply to a particular deployment depend on its operator, providers, and your
            jurisdiction.
          </p>
        </div>

        <div className="privacy-grid">
          {privacyItems.map((item, index) => (
            <article className="privacy-card" key={item.title}>
              <div className="privacy-meta">
                <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>

        <div className="privacy-footnote">
          <strong>Quick summary</strong>
          <p>
            Browser tools process pasted configuration locally. Chat uses a signaling service to find
            peers, then sends encrypted payloads between peers where possible. Local storage, hosting
            infrastructure, and any STUN/TURN provider remain separate privacy boundaries.
          </p>
          <p>
            See the <Link href="/legal/">disclaimer and cookie details</Link>, or open <Link href="/">the home page</Link>.
          </p>
        </div>
      </section>

      <section className="section privacy-section" id="android-client">
        <div className="section-heading">
          <p className="eyebrow">Android client</p>
          <h2>tcptun-kotlin privacy boundary</h2>
          <p>
            These additional disclosures apply to the tcptun-kotlin Android application. The app is a
            client for endpoints you choose, not an operator-owned VPN service.
          </p>
        </div>

        <div className="privacy-grid">
          {androidPrivacyItems.map((item, index) => (
            <article className="privacy-card" key={item.title}>
              <div className="privacy-meta">
                <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section privacy-section" id="go-core">
        <div className="section-heading">
          <p className="eyebrow">Go core</p>
          <h2>tcptun-go privacy boundary</h2>
          <p>
            These disclosures apply to the tcptun-go CLI, embeddable runtime, and gomobile bridge. The
            core is a data-plane component: it acts on the configuration and callbacks supplied by its
            host and does not operate a project-wide collection service.
          </p>
        </div>

        <div className="privacy-grid">
          {goPrivacyItems.map((item, index) => (
            <article className="privacy-card" key={item.title}>
              <div className="privacy-meta">
                <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}
