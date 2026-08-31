import Link from "next/link";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, interpolate, type Locale } from "../i18n";
import { androidAppLinks, releaseVersion } from "../site-data";

const androidTitlesZh: Record<string, string> = {
  "App role and operator backend": "应用角色与运营方后端",
  "Data kept on the Android device": "保留在 Android 设备上的数据",
  "Clipboard and QR scanning": "剪贴板与二维码扫描",
  "VPN traffic and remote endpoints": "VPN 流量与远端端点",
  "Connectivity diagnostics": "连通性诊断",
  "Optional flow analysis": "可选流量分析",
  Permissions: "权限",
  "Android retention and deletion": "Android 保留与删除",
  "Android components and security boundary": "Android 组件与安全边界",
};

const goTitlesZh: Record<string, string> = {
  "Core role and no automatic reporting": "核心角色且无自动上报",
  "Traffic forwarding is configuration-driven": "流量转发由配置驱动",
  "Configuration and credentials": "配置与凭证",
  "DNS and name resolution": "DNS 与名称解析",
  "Logs and host callbacks": "日志与宿主回调",
  "Optional flow observation": "可选流量观测",
  "Status events are local callbacks": "状态事件是本地回调",
  "Discovery, probes, and reverse publishing": "发现、探测与反向发布",
  "Retention and responsibility": "保留与责任",
};

const websitePrivacyZh = [
  {
    title: "本说明覆盖什么",
    body: "本说明覆盖 tcptun 网站及其浏览器工具。它不替代托管、CDN、软件包仓库或其他你选择与 tcptun 一起使用的服务的隐私政策。命令行运行时以及你自己运营的服务器会按你的配置处理网络流量；本页不描述那些部署。",
  },
  {
    title: "网站处理的信息",
    body: "浏览器请求页面或资源时，托管、CDN 和安全基础设施可能收到 IP 地址、浏览器与设备信息、请求时间、来源页和请求资源等普通技术信息。这些提供方自行控制日志和保留期限。本站不提供账号、联系表单、邮件列表或第一方广告分析。",
  },
  {
    title: "浏览器本地工具",
    body: "配置生成和 URI 转换设计为在浏览器内运行。你粘贴进这些工具的值，包括密钥、token、密码和配置文本，不会被 tcptun 应用有意上传。与任何 Web 应用一样，浏览器扩展、网络检查软件和浏览器本身也可能有自己的访问。",
  },
  {
    title: "本地存储与 Cookie",
    body: "本站使用浏览器存储保存运行与偏好，例如主题和 Cookie 同意选择。我们不使用第一方广告或营销跟踪 Cookie。托管、CDN 或安全提供方可能按其政策使用技术 Cookie 或日志。",
  },
  {
    title: "第三方链接与基础设施",
    body: "本站可能链接到独立运营的第三方网站、软件包仓库、CDN 和发布服务。你自行选择这些提供方，并有责任查阅其条款和隐私政策。",
  },
  {
    title: "保留期限与你的选择",
    body: "浏览器本地数据会保留到过期、被替换，或你通过浏览器或站点设置清除为止。你可以阻止存储或清除站点数据。阻止存储可能重置偏好，或导致部分功能无法使用。",
  },
  {
    title: "问题、请求与更新",
    body: "隐私问题或请求请通过项目的公开网站仓库提出。请不要在公开 issue 中发布密码、私钥、个人文件或其他敏感数据。站点或其数据处理方式变化时，我们可能更新本说明。",
  },
] as const;

const privacyItems = [
  {
    title: "What this notice covers",
    body: (
      <>
        This notice covers the tcptun website and its browser-based tools. It does not replace the
        privacy policies of hosting, CDN, package registries, or other services that you choose to use
        with tcptun. The tcptun command-line runtime and any server you operate can process network
        traffic according to your own configuration; this page does not describe those deployments.
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
        Config generation and URI conversion are designed to run in your browser.
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
        The site uses browser storage for operations and preferences, such as theme and cookie-consent
        choice. We do not use first-party advertising or marketing tracking cookies. Hosting, CDN, or
        security providers may use technical cookies or logs under their own policies.
      </>
    ),
  },
  {
    title: "Third-party links and infrastructure",
    body: (
      <>
        The site may link to third-party websites, package registries, CDNs, and release services that
        operate independently. You choose those providers and are responsible for reviewing their terms
        and privacy policies.
      </>
    ),
  },
  {
    title: "Retention and your choices",
    body: (
      <>
        Browser-local data remains until it expires, is replaced, or you clear it through your browser
        or site settings. You can block storage or clear site data. Blocking storage may reset
        preferences or prevent some features from working.
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

export function PrivacyView({ locale = "en" }: { locale?: Locale }) {
  const t = getDictionary(locale);
  return (
    <SiteChrome locale={locale}>
      <PageHero
        eyebrow={t.privacy.title}
        title={t.privacy.heroTitle}
        description={t.privacy.heroTitle}
      />

      <section className="section privacy-section" id="privacy">
        <div className="section-heading">
          <p className="eyebrow">{locale === "zh" ? "隐私说明" : "Privacy notice"}</p>
          <h2>{locale === "zh" ? "信息如何被处理" : "What happens to information"}</h2>
          <p>
            {locale === "zh"
              ? "最近更新于 2026 年 8 月 4 日。这是项目的通俗说明，不是法律建议。具体部署适用的规则取决于运营者、服务提供方和你所在的司法辖区。"
              : "Last updated August 4, 2026. This is a plain-language project notice, not legal advice. The rules that apply to a particular deployment depend on its operator, providers, and your jurisdiction."}
          </p>
        </div>

        <div className="privacy-grid">
          {(locale === "zh" ? websitePrivacyZh : privacyItems).map((item, index) => (
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
          <strong>{locale === "zh" ? "摘要" : "Quick summary"}</strong>
          <p>
            {locale === "zh"
              ? "浏览器工具在本地处理粘贴的配置。本地存储与托管/CDN 基础设施是分开的隐私边界。"
              : "Browser tools process pasted configuration locally. Local storage and hosting/CDN infrastructure remain separate privacy boundaries."}
          </p>
          <p>
            {locale === "zh" ? (
              <>
                见 <Link href="/zh/legal/">免责声明与 Cookie 详情</Link>，或打开{" "}
                <Link href="/zh/">首页</Link>。
              </>
            ) : (
              <>
                See the <Link href="/legal/">disclaimer and cookie details</Link>, or open{" "}
                <Link href="/">the home page</Link>.
              </>
            )}
          </p>
        </div>
      </section>

      <section className="section privacy-section" id="android-client">
        <div className="section-heading">
          <p className="eyebrow">{t.privacy.androidEyebrow}</p>
          <h2>{t.privacy.androidTitle}</h2>
          <p>
            {interpolate(t.privacy.androidLead, {
              packageId: androidAppLinks.packageId,
              appVersion: androidAppLinks.appVersion,
              runtimeVersion: androidAppLinks.runtimeVersion,
              cliVersion: releaseVersion,
            })}
          </p>
        </div>

        <div className="privacy-grid">
          {androidPrivacyItems.map((item, index) => (
            <article className="privacy-card" key={item.title}>
              <div className="privacy-meta">
                <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{locale === "zh" ? androidTitlesZh[item.title] ?? item.title : item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section privacy-section" id="go-core">
        <div className="section-heading">
          <p className="eyebrow">{locale === "zh" ? "Go 核心" : "Go core"}</p>
          <h2>{locale === "zh" ? "tcptun-go 隐私边界" : "tcptun-go privacy boundary"}</h2>
          <p>
            {locale === "zh"
              ? "以下披露适用于 tcptun-go CLI、可嵌入运行时和 gomobile bridge。核心是数据面组件：它按宿主提供的配置和回调工作，并不运营面向全项目的采集服务。"
              : "These disclosures apply to the tcptun-go CLI, embeddable runtime, and gomobile bridge. The core is a data-plane component: it acts on the configuration and callbacks supplied by its host and does not operate a project-wide collection service."}
          </p>
        </div>

        <div className="privacy-grid">
          {goPrivacyItems.map((item, index) => (
            <article className="privacy-card" key={item.title}>
              <div className="privacy-meta">
                <span className="privacy-index">{String(index + 1).padStart(2, "0")}</span>
                <h3>{locale === "zh" ? goTitlesZh[item.title] ?? item.title : item.title}</h3>
              </div>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>
    </SiteChrome>
  );
}

