import assert from "node:assert/strict";
import test from "node:test";
import {
  COMPATIBILITY_STUN_URLS,
  buildIceServers,
  iceMode,
  sanitizeIceConfig,
} from "../app/lan-ice.ts";

test("compatibility preset contains valid deduplicated STUN URLs", () => {
  const config = sanitizeIceConfig({ stunUrls: [...COMPATIBILITY_STUN_URLS] });
  assert.deepEqual(config.stunUrls, [...COMPATIBILITY_STUN_URLS]);
  assert.equal(new Set(config.stunUrls).size, config.stunUrls.length);
  assert.equal(iceMode(config), "stun");
});

test("compatibility preset builds one WebRTC STUN server entry", () => {
  const config = sanitizeIceConfig({ stunUrls: [...COMPATIBILITY_STUN_URLS] });
  assert.deepEqual(buildIceServers(config), [{ urls: [...COMPATIBILITY_STUN_URLS] }]);
});
