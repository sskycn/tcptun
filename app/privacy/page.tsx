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
    </SiteChrome>
  );
}
