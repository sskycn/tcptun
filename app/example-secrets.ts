import {
  generateX25519Pair,
  randomBase64Url,
  randomHex,
} from "./crypto-credentials";

/** Fresh secrets for one /examples (or native guide) page load. */
export type ExampleSecrets = {
  privateKey: string;
  publicKey: string;
  /** Reality short ID: 8 random bytes → 16 hex chars (matches `tcptun config`). */
  shortId: string;
  /** Native token / reverse publish token. */
  token: string;
  /** Second native token for relay hops that need distinct credentials. */
  tokenAlt: string;
};

export async function generateExampleSecrets(): Promise<ExampleSecrets> {
  const { privateKey, publicKey } = await generateX25519Pair();
  return {
    privateKey,
    publicKey,
    shortId: randomHex(8),
    token: randomBase64Url(24),
    tokenAlt: randomBase64Url(24),
  };
}

/**
 * Replace catalog placeholders with freshly generated credentials.
 * Server/client templates stay paired because they share the same secrets bag.
 */
export function applyExampleSecrets(source: string, secrets: ExampleSecrets): string {
  return source
    .split("REPLACE_WITH_SERVER_PRIVATE_KEY")
    .join(secrets.privateKey)
    .split("REPLACE_WITH_SERVER_PUBLIC_KEY")
    .join(secrets.publicKey)
    .split("replace-with-a-long-random-token")
    .join(secrets.token)
    .split("inbound-secret")
    .join(secrets.token)
    .split("outbound-secret")
    .join(secrets.tokenAlt)
    .split("abcd1234")
    .join(secrets.shortId)
    .split('"short_ids": ["00"]')
    .join(`"short_ids": ["${secrets.shortId}"]`)
    .split('"short_id": "00"')
    .join(`"short_id": "${secrets.shortId}"`)
    .split("change-me")
    .join(secrets.token);
}

export function secretsSummary(secrets: ExampleSecrets): string {
  return `pbk ${secrets.publicKey.slice(0, 8)}… · sid ${secrets.shortId.slice(0, 8)}… · token ${secrets.token.slice(0, 6)}…`;
}
