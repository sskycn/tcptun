#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join, resolve } from "node:path";

const [packageRootArg, binaryArg, expectedVersionArg] = process.argv.slice(2);

if (!packageRootArg || !binaryArg || !expectedVersionArg) {
  throw new Error(
    "Usage: node scripts/sync-tcptun-release.mjs <package-root> <tcptun-binary> <expected-version>",
  );
}

const packageRoot = resolve(packageRootArg);
const binary = resolve(binaryArg);
const expectedVersion = expectedVersionArg.replace(/^v/, "");
const actualVersion = run(binary, ["version"]).trim().replace(/^v/, "");

if (actualVersion !== expectedVersion) {
  throw new Error(`tcptun binary version mismatch: expected ${expectedVersion}, received ${actualVersion}`);
}

const help = run(binary, ["config", "--help"]);
const docsDir = join(packageRoot, "docs");
const documentedProtocols = (existsSync(docsDir) ? readdirSync(docsDir) : [])
  .map((name) => name.match(/^protocol-(.+)\.zh-CN\.md$/)?.[1] || "")
  .filter(Boolean);
const protocols = unique([
  ...parseChoices(help, "protocol"),
  ...documentedProtocols,
]);
const transports = parseChoices(help, "transport");
const tunnelSecurities = parseChoices(help, "tunnel-security");
const securities = unique([
  "none",
  ...(help.includes("--tls ") ? ["tls"] : []),
  ...tunnelSecurities.filter((value) => value !== "none"),
]);

if (!protocols.length) throw new Error("No tunnel protocols found in the tcptun release");
if (!transports.length) throw new Error("No tunnel transports found in the tcptun release");

const workDir = mkdtempSync(join(tmpdir(), "tcptun-site-sync-"));
const presets = {};

try {
  for (const protocol of protocols) {
    const outputDir = join(workDir, protocol);
    mkdirSync(outputDir, { recursive: true });
    run(binary, ["config", protocol, "--out-dir", outputDir, "--force"]);

    const server = readJSON(join(outputDir, "server.json"));
    const client = readJSON(join(outputDir, "client.json"));
    const route = readJSON(join(outputDir, "route.json"));

    if (server.tunnel_protocol !== protocol || client.tunnel_protocol !== protocol) {
      throw new Error(`Generated ${protocol} presets do not identify the requested protocol`);
    }

    const tokenKind = isUUID(String(client.token || "")) ? "uuid" : "secret";
    normalizeGeneratedSecrets(protocol, tokenKind, server, client);
    presets[protocol] = { tokenKind, server, client, route };
  }
} finally {
  rmSync(workDir, { recursive: true, force: true });
}

const manifest = {
  package: "tcptun",
  version: expectedVersion,
  protocols: presets,
  transports,
  securities,
};

const outputPath = resolve("app/tcptun-release.json");
writeFileSync(outputPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`synced tcptun v${expectedVersion}: ${protocols.join(", ")} -> ${basename(outputPath)}`);

function run(command, args) {
  try {
    return execFileSync(command, args, {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 15_000,
    });
  } catch (error) {
    const stderr = error?.stderr ? String(error.stderr).trim() : "";
    throw new Error(`${command} ${args.join(" ")} failed${stderr ? `: ${stderr}` : ""}`, { cause: error });
  }
}

function parseChoices(helpText, flag) {
  const escapedFlag = flag.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = helpText.match(new RegExp(`--${escapedFlag} <string>\\s+[^\\n]*?: ([^\\n\\[]+)`));
  if (!match) return [];
  return match[1]
    .replace(/\bor\b/g, ",")
    .split(",")
    .map((value) => value.trim().replace(/[^a-zA-Z0-9_-].*$/, ""))
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values)];
}

function readJSON(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function isUUID(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeGeneratedSecrets(protocol, tokenKind, server, client) {
  const token = tokenKind === "uuid"
    ? "00000000-0000-4000-8000-000000000000"
    : protocol === "trojan"
      ? "CHANGE_ME_TROJAN_PASSWORD"
      : "CHANGE_ME_RANDOM_TOKEN";

  server.token = token;
  client.token = token;
  replaceIfPresent(server, "reality_private_key", "REALITY_PRIVATE_KEY");
  replaceIfPresent(client, "reality_public_key", "REALITY_PUBLIC_KEY");
}

function replaceIfPresent(target, key, value) {
  if (Object.hasOwn(target, key)) target[key] = value;
}
