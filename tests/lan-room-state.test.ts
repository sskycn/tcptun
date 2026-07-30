import assert from "node:assert/strict";
import test from "node:test";
import {
  base64LengthForBytes,
  fileChunkCount,
  fileChunkLength,
  shouldInitiateMesh,
} from "../app/lan-room-state.ts";

test("mesh dial ownership is deterministic and has exactly one initiator", () => {
  const pairs = [
    ["tcptu0001", "tcptu0002"],
    ["alice", "bob"],
    ["z-user", "a-user"],
  ] as const;

  for (const [a, b] of pairs) {
    assert.notEqual(shouldInitiateMesh(a, b), shouldInitiateMesh(b, a));
  }
  assert.equal(shouldInitiateMesh("same", "same"), false);
  assert.equal(shouldInitiateMesh("", "peer"), false);
});

test("file chunk layout exactly matches base64 boundaries", () => {
  const chunkChars = 12_000;
  assert.equal(base64LengthForBytes(0), 0);
  assert.equal(fileChunkCount(0, chunkChars), 0);
  assert.equal(base64LengthForBytes(1), 4);
  assert.equal(fileChunkCount(1, chunkChars), 1);
  assert.equal(fileChunkLength(1, chunkChars, 0), 4);

  // 9,000 bytes encode to exactly one 12,000-character chunk.
  assert.equal(base64LengthForBytes(9_000), 12_000);
  assert.equal(fileChunkCount(9_000, chunkChars), 1);
  assert.equal(fileChunkLength(9_000, chunkChars, 0), 12_000);

  assert.equal(base64LengthForBytes(9_001), 12_004);
  assert.equal(fileChunkCount(9_001, chunkChars), 2);
  assert.equal(fileChunkLength(9_001, chunkChars, 0), 12_000);
  assert.equal(fileChunkLength(9_001, chunkChars, 1), 4);
});

test("invalid file metadata is rejected by pure layout helpers", () => {
  assert.equal(base64LengthForBytes(-1), -1);
  assert.equal(fileChunkCount(1, 0), -1);
  assert.equal(fileChunkLength(1, 12_000, 1), -1);
  assert.equal(fileChunkLength(1.5, 12_000, 0), -1);
});
