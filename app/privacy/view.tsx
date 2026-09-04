import Link from "next/link";
import type { ReactNode } from "react";
import PageHero from "../page-hero";
import SiteChrome from "../site-chrome";
import { getDictionary, interpolate, type Locale } from "../i18n";
import { androidAppLinks, releaseVersion } from "../site-data";

type PrivacyCard = { title: string; body: ReactNode };

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

const androidPrivacyEn: PrivacyCard[] = [
  {
    title: "App role and operator backend",
    body: (
      <>
        The tcptun-kotlin Android client is a local VPN and transparent-proxy tool. It uses Android{" "}
        <code>VpnService</code> to create a device-level VPN interface and connects to remote endpoints
        you provide or select. The operator does not provide, sell, rent, or manage VPN nodes, proxy
        servers, subscriptions, or cloud configuration, and has no operator-owned backend for accounts,
        sync, advertising, analytics, or crash reporting.
      </>
    ),
  },
  {
    title: "What the operator does not collect",
    body: (
      <>
        “We do not collect” means the operator does not receive or retain data from the app. It does
        not mean a user-configured endpoint or a connectivity-test target cannot observe network
        metadata. The current app does not upload names, emails, phone numbers, accounts, contacts,
        SMS, call logs, location, advertising identifiers, crash reports, profiles, VPN traffic,
        traffic-analysis events, runtime logs, or QR images to an operator server, and includes no
        account, advertising, analytics, or crash-reporting SDK.
      </>
    ),
  },
  {
    title: "Data kept on the Android device",
    body: (
      <>
        The app may process profiles and credentials, TLS/transport parameters, routing rules, runtime
        settings, installed app package names and labels, local network-interface information,
        VPN/proxy status, diagnostic state, and logs. Non-secret profile fields, routing rules, and
        some settings are stored in app-private <code>SharedPreferences</code>. Profile credentials and
        local proxy account passwords are stored separately with AES-256-GCM, using a key protected by
        Android Keystore. Protect the device and any exported or shared profile data. Runtime logs and
        traffic-analysis events are held mainly in memory; sensitive fields are redacted before they
        are shown in the app or written to visible Logcat.
      </>
    ),
  },
  {
    title: "Clipboard, QR, and A1 sharing",
    body: (
      <>
        Clipboard text is read only after you explicitly import a profile. After a successful import,
        the app attempts to clear clipboard text that still matches the imported value. Camera access
        is requested only when you open the QR scanner; preview frames are used on-device to recognize
        a profile or local-proxy QR code and are not uploaded to an operator server. An{" "}
        <code>A1:</code> payload shares one local SOCKS5/mixed username and password. A1 is not
        encrypted: treat the payload, password, and QR image as a bearer secret. Do not persist them in
        logs, diagnostics, SavedState, or public storage.
      </>
    ),
  },
  {
    title: "VPN traffic and remote endpoints",
    body: (
      <>
        When VPN mode is enabled, device traffic is forwarded according to the selected profile. The
        endpoint operator may see or retain connection time, source IP (which can reveal approximate
        location), destination information (including websites visited), traffic metadata, and content
        not protected by end-to-end encryption. Use only endpoints you
        trust and review their policies. The tcptun operator does not receive that traffic through a
        project backend. v0.5.0 and later require an encrypted TLS or REALITY tunnel for Android VPN profiles;{" "}
        <code>security=none</code>, ECH profiles, and arbitrary FileConfig JSON are rejected. Overall
        security still depends on the profile, device, and remote endpoint.
      </>
    ),
  },
  {
    title: "Connectivity diagnostics",
    body: (
      <>
        While a VPN session is active, the app may send lightweight HTTPS <code>204</code> probes
        through the current outbound to <code>connectivitycheck.gstatic.com/generate_204</code> and{" "}
        <code>cp.cloudflare.com/generate_204</code>. A user-triggered TCPing diagnostic tests port 443
        on <code>google.com</code>, <code>github.com</code>, and <code>cloudflare.com</code>. Those
        sites may process connection metadata under their own policies. These checks are for
        connectivity, not advertising or behavioral analytics.
      </>
    ),
  },
  {
    title: "Optional flow analysis",
    body: (
      <>
        If you explicitly enable traffic analysis for one app, the client may display destination
        domain/IP, port, protocol, route reason, app package name, and timestamps locally. This state
        is not sent to an operator server. Stopping the feature or changing the target clears the
        related analysis state.
      </>
    ),
  },
  {
    title: "Permissions",
    body: (
      <>
        The app may request network-state and network-access, VPN and foreground-service operation,
        camera access for QR scanning, and notification permission for the VPN status notification.
        Camera access is used only after you open the scanner and grant permission, and is not required
        for ordinary profile editing or VPN use.
      </>
    ),
  },
  {
    title: "VPN disclosure and consent",
    body: (
      <>
        Starting in app v0.5.1, the first VPN start shows an in-app disclosure and requires
        affirmative consent before Android VPN permission is requested. Declining, going Back, or
        dismissing the dialog cancels the start. Versioned consent is stored in app-private{" "}
        <code>SharedPreferences</code> on the device and is not sent to an operator server. The
        disclosure and Settings can open this privacy page at <code>https://tcptun.com/privacy/</code>.
      </>
    ),
  },
  {
    title: "Android retention and deletion",
    body: (
      <>
        Local profiles, routing rules, and settings remain until you edit or delete them, clear the
        app&apos;s data in Android settings, or uninstall the app. Runtime logs and flow-analysis state
        are primarily in memory and disappear when cleared or when the process ends. The operator has
        no cloud copy; deletion requests for remote-endpoint or diagnostic-site logs must go to those
        providers.
      </>
    ),
  },
  {
    title: "Android components and security boundary",
    body: (
      <>
        The client uses Android VPN APIs, the tcptun-go gomobile bridge, CameraX, and Google ML Kit
        barcode scanning. The current project has no Firebase Analytics, Crashlytics, advertising SDK,
        or standalone telemetry SDK. Android VPN routing is dual-stack Full Tunnel only. Reverse Subnet
        / P2P topology is a tcptun-go capability and is not exposed in the Android product. App-private
        storage and Keystore-backed credential encryption limit ordinary access by other apps, but they
        do not protect data if the device, shared profile, remote endpoint, or transport configuration
        is compromised.
      </>
    ),
  },
  {
    title: "Children’s privacy",
    body: (
      <>
        TcpTun is a general-purpose network tool and is not directed to children. The operator does not
        knowingly collect children’s personal information. Because the app has no operator backend, the
        project does not receive such information from the app.
      </>
    ),
  },
];

const androidPrivacyZh: PrivacyCard[] = [
  {
    title: "应用角色与运营方后端",
    body: (
      <>
        tcptun-kotlin Android 客户端是在设备本地运行的 VPN 与透明代理工具。它使用 Android{" "}
        <code>VpnService</code> 建立设备级 VPN 接口，并连接到你提供或选择的远端节点。运营者不提供、销售、出租或管理
        VPN 节点、代理服务器、订阅或云端配置，也没有用于账号、同步、广告、分析或崩溃上报的自有后端。
      </>
    ),
  },
  {
    title: "运营者不收集什么",
    body: (
      <>
        「我们不收集」是指运营者不会从应用接收或留存数据，并不等于用户配置的远端节点或连通性测试目标看不到网络元数据。当前应用不会把姓名、邮箱、电话、账号、联系人、短信、通话记录、位置、广告标识符、崩溃报告、配置、VPN
        流量、流量分析事件、运行日志或二维码图像上传到运营者服务器，也没有账号、广告、分析或崩溃上报 SDK。
      </>
    ),
  },
  {
    title: "保留在 Android 设备上的数据",
    body: (
      <>
        应用可能在设备上处理配置与凭据、TLS/传输参数、路由规则、运行设置、已安装应用的包名和标签、本地网卡信息、VPN/代理状态、诊断状态和日志。非秘密配置字段、路由规则和部分设置保存在应用私有的{" "}
        <code>SharedPreferences</code>{" "}
        中。配置凭据和本地代理账号密码单独使用 AES-256-GCM 加密保存，密钥由 Android Keystore
        保护。请仍妥善保护设备以及导出或分享的配置。运行日志和流量分析事件主要留在内存中；在应用内显示或写入可见
        Logcat 前会脱敏敏感字段。
      </>
    ),
  },
  {
    title: "剪贴板、二维码与 A1 分享",
    body: (
      <>
        只有在你明确选择导入配置后才会读取剪贴板。导入成功后，应用会尝试清除仍与导入内容一致的剪贴板文本。相机权限只在打开二维码扫描时申请；预览帧用于在设备上识别配置或本地代理二维码，不会上传到运营者服务器。
        <code>A1:</code>{" "}
        payload 只分享一组本地 SOCKS5/mixed 的用户名和密码。A1
        未加密：应把 payload、密码和二维码图像当作持有即有效的秘密，不要写入日志、诊断、SavedState 或公共存储。
      </>
    ),
  },
  {
    title: "VPN 流量与远端端点",
    body: (
      <>
        启用 VPN 后，设备流量会按所选配置转发到远端节点。该节点运营者可能看到或保留连接时间、来源 IP（可用于推断近似位置）、目标信息（包括访问的网站）、流量元数据，以及未被端到端加密保护的内容。请只使用你信任的节点，并查阅其政策。tcptun
        运营者不会通过项目后端接收这些流量。v0.5.0 及更高版本要求 Android VPN 配置使用加密的 TLS 或 REALITY 隧道；
        <code>security=none</code>、ECH 配置和任意 FileConfig JSON 会被拒绝。整体安全性仍取决于配置、设备和远端节点。
      </>
    ),
  },
  {
    title: "连通性诊断",
    body: (
      <>
        VPN 运行期间，应用可能通过当前出站对 <code>connectivitycheck.gstatic.com/generate_204</code> 和{" "}
        <code>cp.cloudflare.com/generate_204</code> 发起轻量 HTTPS <code>204</code>{" "}
        探测。用户触发的 TCPing 会测试 <code>google.com</code>、<code>github.com</code> 和{" "}
        <code>cloudflare.com</code> 的 443 端口。这些站点可能按其政策处理连接元数据。探测用于连通性，不是广告或行为分析。
      </>
    ),
  },
  {
    title: "可选流量分析",
    body: (
      <>
        若你明确为某个应用开启流量分析，客户端可能在本地显示目标域名/IP、端口、协议、路由原因、应用包名和时间。这些状态不会发送到运营者服务器。停止该功能或更换分析对象时，相关分析状态会被清除。
      </>
    ),
  },
  {
    title: "权限",
    body: (
      <>
        应用可能申请网络状态与网络访问、VPN 与前台服务、用于扫码的相机，以及 VPN
        状态通知权限。相机只在你打开扫描并授权后使用，普通编辑配置或使用 VPN 不需要相机。
      </>
    ),
  },
  {
    title: "VPN 披露与同意",
    body: (
      <>
        从应用 v0.5.1 起，首次启动 VPN 会先显示应用内披露，并需要明确同意后才会申请 Android VPN
        权限。选择暂不、返回或关闭对话框都会取消启动。版本化的同意记录保存在设备上应用私有的{" "}
        <code>SharedPreferences</code>{" "}
        中，不会发送到运营者服务器。披露对话框和设置可以打开本隐私页{" "}
        <code>https://tcptun.com/privacy/</code>。
      </>
    ),
  },
  {
    title: "Android 保留与删除",
    body: (
      <>
        本地配置、路由规则和设置会一直保留，直到你在应用中修改或删除、在 Android
        设置中清除应用数据，或卸载应用。运行日志和流量分析状态主要在内存中，清除或进程结束后消失。运营者没有云端副本；远端节点或诊断站点日志的删除请求需向相应提供方提出。
      </>
    ),
  },
  {
    title: "Android 组件与安全边界",
    body: (
      <>
        客户端使用 Android VPN API、tcptun-go gomobile bridge、CameraX 和 Google ML Kit
        条码扫描。当前项目没有 Firebase Analytics、Crashlytics、广告 SDK 或独立遥测 SDK。Android
        路由仅为双栈 Full Tunnel。Reverse Subnet / P2P 是 tcptun-go 能力，未在 Android
        产品中暴露。应用私有存储和 Keystore 保护的凭据加密可限制其他应用的常规访问，但不能在设备、分享出的配置、远端节点或传输配置被攻破时保证数据安全。
      </>
    ),
  },
  {
    title: "儿童隐私",
    body: (
      <>
        TcpTun 是通用网络工具，不以儿童为目标用户，也不会明知收集儿童个人信息。由于应用没有运营者后端，项目不会从应用侧接收这类信息。
      </>
    ),
  },
];

const goPrivacyEn: PrivacyCard[] = [
  {
    title: "Core role and no automatic reporting",
    body: (
      <>
        tcptun-go is the local Go runtime and embeddable networking library behind the CLI, Android
        bridge, and other integrations. It has no account system, advertising, analytics,
        crash-reporting, or developer-owned telemetry endpoint. It does not automatically send
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
        may forward those flows to direct destinations, user-configured SOCKS5 or tunnel endpoints,
        reverse-published services, or Reverse Subnet Home Connectors. Destination and endpoint
        operators may see and retain connection metadata and any content not protected by the selected
        transport or application encryption. SOCKS5 <code>auth_mode=secure</code> authenticates a
        shared secret; it does not encrypt the SOCKS5 connection.
      </>
    ),
  },
  {
    title: "Configuration and credentials",
    body: (
      <>
        JSON configuration, URI profiles, T2/T3 QR payloads, A1 local-proxy payloads, tokens,
        passwords, TLS/REALITY keys, and routing rules are read, validated, generated, or encoded
        locally by the Go process or its host. URI, T3, and A1 artifacts can contain credentials. A1
        is not encrypted. Generated files should be protected and not shared through untrusted
        locations. The Go core does not create a cloud copy of these values.
      </>
    ),
  },
  {
    title: "DNS and name resolution",
    body: (
      <>
        A deployment can use the operating-system resolver or explicitly configured DNS servers. DNS
        queries may therefore be visible to the selected resolver, remote endpoint, or network
        provider, depending on the configuration and route. Optional DNS outbound pinning and fake-IP
        mapping are runtime features; fake-IP mappings are held in memory for that runtime and cleared
        when it stops. Review the privacy policy of every DNS provider you configure.
      </>
    ),
  },
  {
    title: "Logs and host callbacks",
    body: (
      <>
        Runtime logs are sent only to the output or callback supplied by the host, such as the
        CLI&apos;s local stderr or an embedding app&apos;s log callback. Depending on log level and
        configuration, logs and status events can contain local listeners, remote endpoints,
        connection errors, timestamps, and runtime state. The host controls whether those outputs are
        displayed, stored, or shared. Setting the runtime log level to <code>off</code> suppresses
        runtime logs.
      </>
    ),
  },
  {
    title: "Optional flow observation",
    body: (
      <>
        An embedding application can explicitly provide a flow observer or app-identity provider. If
        it does, the Go core can expose a flow&apos;s timestamp, TCP/UDP network, source,
        destination/domain or IP, port, original IP, outbound tag, route reason, and selected app
        identity. This is a local callback boundary, not automatic collection by tcptun-go.
      </>
    ),
  },
  {
    title: "Status events are local callbacks",
    body: (
      <>
        The Android bridge can register status events such as remote-endpoint changes, reconnecting,
        and runtime connection issues. These events update the host&apos;s in-process status and may
        include remote endpoint summaries, state, errors, and timestamps. Registration does not send
        events to a tcptun server. The current Android client keeps this state local for UI and
        diagnostics.
      </>
    ),
  },
  {
    title: "Discovery, Reverse Subnet, and probes",
    body: (
      <>
        In automatic no-config mode, the CLI can scan private IPv4 LAN addresses for a SOCKS5 service
        on port <code>1080</code> and stop after a successful handshake. Reverse publishing can make a
        selected local TCP/UDP service reachable through a tunnel. Reverse Subnet can proxy IPv4/IPv6
        TCP/UDP to a Home Connector; optional direct QUIC (<code>p2p.enabled</code>) may exchange
        host, Edge-reflexive, STUN-reflexive, and peer-reflexive candidates with the authorized peer.
        Opt-in host candidates disclose selected private interface addresses. Direct-path failure
        falls back to relay. These operations create network connections visible to contacted devices
        and service operators; they are not developer analytics.
      </>
    ),
  },
  {
    title: "Retention and responsibility",
    body: (
      <>
        The Go core keeps active sessions, route state, DNS fake-IP mappings, counters, and other
        runtime state in memory unless the host or operator writes it elsewhere. Stop or close ends
        the runtime and clears its in-memory state subject to normal process and OS behavior. Files,
        logs, endpoint records, DNS logs, and remote-server logs created by a particular deployment
        are controlled by that deployment&apos;s operator, not by the tcptun project.
      </>
    ),
  },
];

const goPrivacyZh: PrivacyCard[] = [
  {
    title: "核心角色且无自动上报",
    body: (
      <>
        tcptun-go 是 CLI、Android bridge 及其他集成背后的本地 Go 运行时和可嵌入网络库。它没有账号、广告、分析、崩溃上报或开发者自有遥测端点，也不会自动把配置、凭据、代理流量、日志或使用报告发送给 tcptun 项目。
      </>
    ),
  },
  {
    title: "流量转发由配置驱动",
    body: (
      <>
        核心按运营者或嵌入应用提供的配置，接受本地 TCP/UDP 流、SOCKS5 或 mixed 代理请求、TUN 流量和隧道协议流量，并可能转发到直连目标、用户配置的 SOCKS5 或隧道端点、反向发布服务，或 Reverse Subnet 的 Home Connector。目标与端点运营者可能看到并保留连接元数据，以及未被所选传输或应用层加密保护的内容。SOCKS5{" "}
        <code>auth_mode=secure</code> 只认证共享密钥，并不加密 SOCKS5 连接。
      </>
    ),
  },
  {
    title: "配置与凭证",
    body: (
      <>
        JSON 配置、URI、T2/T3 二维码 payload、A1 本地代理 payload、token、密码、TLS/REALITY 密钥和路由规则由 Go 进程或其宿主在本地读取、校验、生成或编码。URI、T3 和 A1 可能包含凭据。A1 未加密。生成的文件应受保护，不要通过不信任的位置分享。Go 核心不会为这些值创建云端副本。
      </>
    ),
  },
  {
    title: "DNS 与名称解析",
    body: (
      <>
        部署可以使用操作系统解析器或显式配置的 DNS 服务器。因此 DNS 查询可能对所选解析器、远端节点或网络提供方可见，具体取决于配置和路由。可选的 DNS 出站固定与 fake-IP 映射是运行时功能；fake-IP 映射保存在该运行时内存中，停止时清除。请查阅你配置的每个 DNS 提供方的隐私政策。
      </>
    ),
  },
  {
    title: "日志与宿主回调",
    body: (
      <>
        运行日志只发送到宿主提供的输出或回调，例如 CLI 的本地 stderr 或嵌入应用的日志回调。按日志级别和配置，日志与状态事件可能包含本地监听、远端端点、连接错误、时间和运行状态。是否展示、存储或分享由宿主决定。将运行日志级别设为 <code>off</code> 可抑制运行日志。
      </>
    ),
  },
  {
    title: "可选流量观测",
    body: (
      <>
        嵌入应用可以显式提供 flow observer 或应用身份 provider。若启用，Go 核心可以暴露流的时间、TCP/UDP 网络、源、目标域名或 IP、端口、原始 IP、出站标签、路由原因和所选应用身份。这是本地回调边界，不是 tcptun-go 的自动采集。
      </>
    ),
  },
  {
    title: "状态事件是本地回调",
    body: (
      <>
        Android bridge 可以注册远端端点变化、重连和运行时连接问题等状态事件。这些事件更新宿主进程内状态，可能包含远端端点摘要、状态、错误和时间。注册不会把事件发送到 tcptun 服务器。当前 Android 客户端把这些状态留在本地用于界面和诊断。
      </>
    ),
  },
  {
    title: "发现、Reverse Subnet 与探测",
    body: (
      <>
        无配置自动模式下，CLI 可以扫描私有 IPv4 局域网中端口 <code>1080</code> 的 SOCKS5 服务，并在首次握手成功后停止。反向发布可以通过隧道暴露选定的本地 TCP/UDP 服务。Reverse Subnet 可以把 IPv4/IPv6 TCP/UDP 代理到 Home Connector；可选的直连 QUIC（<code>p2p.enabled</code>）可能与已授权对端交换 host、Edge-reflexive、STUN-reflexive 和 peer-reflexive 候选。选择启用 host 候选会向对端披露所选私有接口地址。直连失败会回退到中继。这些操作会与被联系的设备和运营者产生网络连接，不是开发者分析。
      </>
    ),
  },
  {
    title: "保留与责任",
    body: (
      <>
        除非宿主或运营者另行写入，Go 核心把活动会话、路由状态、DNS fake-IP 映射、计数器和其他运行状态保存在内存中。停止或关闭会结束运行时，并按正常进程与操作系统行为清除内存状态。某次部署产生的文件、日志、端点记录、DNS 日志和远端服务器日志由该部署的运营者控制，而不是 tcptun 项目。
      </>
    ),
  },
];

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
              ? "最近更新于 2026 年 9 月 5 日。这是项目的通俗说明，不是法律建议。具体部署适用的规则取决于运营者、服务提供方和你所在的司法辖区。"
              : "Last updated September 5, 2026. This is a plain-language project notice, not legal advice. The rules that apply to a particular deployment depend on its operator, providers, and your jurisdiction."}
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
          {(locale === "zh" ? androidPrivacyZh : androidPrivacyEn).map((item, index) => (
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
          <p className="eyebrow">{locale === "zh" ? "Go 核心" : "Go core"}</p>
          <h2>{locale === "zh" ? "tcptun-go 隐私边界" : "tcptun-go privacy boundary"}</h2>
          <p>
            {locale === "zh"
              ? "以下披露适用于 tcptun-go CLI、可嵌入运行时和 gomobile bridge。核心是数据面组件：它按宿主提供的配置和回调工作，并不运营面向全项目的采集服务。"
              : "These disclosures apply to the tcptun-go CLI, embeddable runtime, and gomobile bridge. The core is a data-plane component: it acts on the configuration and callbacks supplied by its host and does not operate a project-wide collection service."}
          </p>
        </div>

        <div className="privacy-grid">
          {(locale === "zh" ? goPrivacyZh : goPrivacyEn).map((item, index) => (
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
