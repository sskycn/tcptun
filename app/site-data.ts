export const releaseVersion = "0.1.8";

export const npmLinks = {
  package: "https://www.npmjs.com/package/tcptun",
  tarball: `https://registry.npmjs.org/tcptun/-/tcptun-${releaseVersion}.tgz`,
};

export const binaryDownloads = [
  binary("tcptun-darwin-amd64", "darwin", "macOS", "amd64", "x64", 14_536_864),
  binary("tcptun-darwin-arm64", "darwin", "macOS", "arm64", "ARM64", 13_436_578),
  binary("tcptun-linux-amd64", "linux", "Linux", "amd64", "x64", 14_184_610),
  binary("tcptun-linux-arm64", "linux", "Linux", "arm64", "ARM64", 13_041_826),
  binary("tcptun-linux-armv7", "linux", "Linux", "armv7", "ARMv7", 13_435_042),
  binary("tcptun-windows-amd64.exe", "windows", "Windows", "amd64", "x64", 14_562_816),
  binary("tcptun-windows-arm64.exe", "windows", "Windows", "arm64", "ARM64", 13_203_968),
] as const;

export const inboundTypes = ["mixed", "socks5", "native", "vless", "vmess", "trojan"] as const;
export const outboundTypes = [
  "direct",
  "direct-first",
  "blackhole",
  "socks5",
  "mixed",
  "native",
  "vless",
  "vmess",
  "trojan",
] as const;

export const tunnelProtocols = [
  {
    name: "native",
    credential: "Token",
    interoperability: "tcptun ↔ tcptun",
    generatedSecurity: "raw + REALITY",
    mux: "同版本两端推荐开启",
    command: "tcptun config native --server proxy.example.com --port 9443",
    description: "私有低开销协议。吞吐优先部署推荐 raw + mux；大帧 wire 格式升级时需要两端版本一致。",
  },
  {
    name: "vless",
    credential: "UUID",
    interoperability: "Xray wire protocol",
    generatedSecurity: "raw + REALITY + Vision",
    mux: "生成器默认关闭",
    command: "tcptun config vless --server proxy.example.com --port 9443",
    description: "支持 TCP/UDP；生成配置使用 xtls-rprx-vision，并由双向 Xray REALITY 互操作测试覆盖。",
  },
  {
    name: "vmess",
    credential: "UUID",
    interoperability: "Xray VMess AEAD",
    generatedSecurity: "raw + REALITY",
    mux: "生成器默认关闭",
    command: "tcptun config vmess --server proxy.example.com --port 9443",
    description: "使用 VMess AEAD 与 security: none wire mode，支持 TCP/UDP 与 Xray 双向互操作测试。",
  },
  {
    name: "trojan",
    credential: "Password",
    interoperability: "Xray Trojan wire protocol",
    generatedSecurity: "raw + REALITY",
    mux: "生成器默认关闭",
    command: "tcptun config trojan --server proxy.example.com --port 9443",
    description: "标准 Trojan 认证与请求封装，支持 TCP/UDP；生成器创建相互匹配的 REALITY 配置。",
  },
] as const;

export const topologyExample = `{
  "log": { "level": "info" },
  "inbounds": [
    {
      "tag": "local",
      "type": "mixed",
      "listen": "127.0.0.1",
      "port": 1080,
      "network": ["tcp", "udp"],
      "outbound": "proxy"
    }
  ],
  "outbounds": [
    {
      "tag": "proxy",
      "type": "native",
      "server": "proxy.example.com",
      "port": 9443,
      "token": "change-me",
      "transport": { "type": "raw" },
      "mux": { "enabled": true }
    }
  ],
  "route": { "default_outbound": "proxy", "rules": [] },
  "dns": {},
  "discovery": {}
}`;

function binary(
  filename: string,
  platform: string,
  platformLabel: string,
  arch: string,
  archLabel: string,
  size: number,
) {
  return {
    filename,
    platform,
    platformLabel,
    arch,
    archLabel,
    size,
    url: `https://unpkg.com/tcptun@${releaseVersion}/dist/${filename}`,
  };
}
