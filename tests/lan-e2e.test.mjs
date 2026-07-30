import assert from "node:assert/strict";
import test from "node:test";
import {
  decryptPayload,
  deriveAesKey,
  encryptPayload,
  exportPublicJwk,
  generateE2eKeyPair,
  importPublicJwk,
  isPublicJwk,
} from "../app/lan-e2e.ts";

test("both peers derive the same encrypted session", async () => {
  const alice = await generateE2eKeyPair();
  const bob = await generateE2eKeyPair();
  const alicePublic = await exportPublicJwk(alice.publicKey);
  const bobPublic = await exportPublicJwk(bob.publicKey);
  assert.equal(isPublicJwk(alicePublic), true);

  const aliceKey = await deriveAesKey(
    alice.privateKey,
    await importPublicJwk(bobPublic),
    "alice",
    "bob",
  );
  const bobKey = await deriveAesKey(
    bob.privateKey,
    await importPublicJwk(alicePublic),
    "bob",
    "alice",
  );
  const payload = { v: 2, t: "chat", text: "hello" };
  const sealed = await encryptPayload(aliceKey, payload);
  assert.deepEqual(await decryptPayload(bobKey, sealed.iv, sealed.ct), payload);
});

test("malformed public keys and ciphertext are rejected", async () => {
  assert.equal(isPublicJwk({ kty: "EC", crv: "P-256", x: "x", y: "y" }), false);
  const pair = await generateE2eKeyPair();
  const publicKey = await importPublicJwk(await exportPublicJwk(pair.publicKey));
  const key = await deriveAesKey(pair.privateKey, publicKey, "self-a", "self-a");
  await assert.rejects(() => decryptPayload(key, "not-base64!", "bad"));
});
