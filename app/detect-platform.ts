import { binaryDownloads } from "./site-data";

export type BinaryDownload = (typeof binaryDownloads)[number];

export type DetectedPlatform = {
  platform: BinaryDownload["platform"];
  arch: BinaryDownload["arch"];
  label: string;
};

type NavigatorWithUAData = Navigator & {
  userAgentData?: {
    platform?: string;
    getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string }>;
  };
};

export function detectPlatformSync(): DetectedPlatform {
  if (typeof navigator === "undefined") {
    return { platform: "linux", arch: "amd64", label: "Linux x64" };
  }

  const ua = navigator.userAgent.toLowerCase();
  const platformHint = (navigator.platform || "").toLowerCase();
  const uaPlatform = ((navigator as NavigatorWithUAData).userAgentData?.platform || "").toLowerCase();

  const platform = detectOs(ua, platformHint, uaPlatform);
  const arch = detectArch(ua, platform);

  return {
    platform,
    arch,
    label: formatPlatformLabel(platform, arch),
  };
}

export async function detectPlatform(): Promise<DetectedPlatform> {
  const base = detectPlatformSync();

  try {
    const uaData = (navigator as NavigatorWithUAData).userAgentData;
    if (!uaData?.getHighEntropyValues) return base;

    const { architecture } = await uaData.getHighEntropyValues(["architecture"]);
    const arch = mapUaArchitecture(architecture, base.arch);
    if (arch === base.arch) return base;

    return {
      platform: base.platform,
      arch,
      label: formatPlatformLabel(base.platform, arch),
    };
  } catch {
    return base;
  }
}

export function findRecommendedBinary(
  detected: DetectedPlatform,
  binaries: readonly BinaryDownload[] = binaryDownloads,
): BinaryDownload | null {
  const exact = binaries.find(
    (item) => item.platform === detected.platform && item.arch === detected.arch,
  );
  if (exact) return exact;

  const sameOsAmd64 = binaries.find(
    (item) => item.platform === detected.platform && item.arch === "amd64",
  );
  if (sameOsAmd64) return sameOsAmd64;

  return binaries.find((item) => item.platform === detected.platform) ?? null;
}

export function formatBytes(bytes: number) {
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function platformInitial(platform: string) {
  if (platform === "android") return "A";
  if (platform === "darwin") return "M";
  if (platform === "windows") return "W";
  return "L";
}

function detectOs(ua: string, platformHint: string, uaPlatform: string): BinaryDownload["platform"] {
  const haystack = `${ua} ${platformHint} ${uaPlatform}`;

  if (/android/.test(haystack)) {
    return "android";
  }
  if (/iphone|ipad|ipod|macintosh|mac os|macos|macintel|macarm/.test(haystack)) {
    return "darwin";
  }
  if (/windows|win32|win64|wow64/.test(haystack)) {
    return "windows";
  }
  if (/linux|cros|chromium os/.test(haystack)) {
    return "linux";
  }
  return "linux";
}

function detectArch(ua: string, platform: BinaryDownload["platform"]): BinaryDownload["arch"] {
  if (/\b(aarch64|arm64|armv8)\b/.test(ua)) return "arm64";
  if (/\barmv7\b/.test(ua)) return "armv7";
  if (/\b(x86_64|win64|wow64|amd64)\b/.test(ua)) return "amd64";

  // Safari on Apple Silicon usually does not expose arch; default to arm64 for macOS.
  if (platform === "darwin") {
    if (/\bintel\b/.test(ua)) return "amd64";
    return "arm64";
  }

  return "amd64";
}

function mapUaArchitecture(
  architecture: string | undefined,
  fallback: BinaryDownload["arch"],
): BinaryDownload["arch"] {
  if (!architecture) return fallback;
  const value = architecture.toLowerCase();
  if (value === "arm" || value === "arm64") return "arm64";
  if (value === "x86" || value === "x86_64") return "amd64";
  return fallback;
}

function formatPlatformLabel(
  platform: BinaryDownload["platform"],
  arch: BinaryDownload["arch"],
) {
  if (platform === "android") return "Android";
  const os =
    platform === "darwin" ? "macOS" : platform === "windows" ? "Windows" : "Linux";
  const archLabel = arch === "amd64" ? "x64" : arch === "arm64" ? "ARM64" : "ARMv7";
  return `${os} ${archLabel}`;
}
