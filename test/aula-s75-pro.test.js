const test = require("node:test");
const assert = require("node:assert/strict");
const {
  EFFECT_MODES,
  KEY_LED_SLOTS,
  buildEffectSequence,
  buildUserLightingSequence
} = require("../src/aula-s75-pro");

test("the S75 Pro layout maps 80 keys to unique LED slots", () => {
  const slots = Object.values(KEY_LED_SLOTS);
  assert.equal(slots.length, 80);
  assert.equal(new Set(slots).size, 80);
  assert.ok(slots.every((slot) => slot > 0 && slot < 128));
});

test("custom lighting builds a tagged nine-packet per-key color block", () => {
  const sequence = buildUserLightingSequence({ escape: "#123456", space: "#abcdef" });
  assert.equal(sequence.length, 18);
  assert.deepEqual([...sequence[0].data.subarray(0, 2)], [0x04, 0x18]);
  assert.deepEqual([...sequence[2].data.subarray(0, 4)], [0x80, 0xff, 0xff, 0xff]);
  assert.deepEqual([...sequence[7].data.subarray(4, 8)], [1, 0x12, 0x34, 0x56]);
  assert.deepEqual([...sequence[7].data.subarray(60, 64)], [0, 0, 0, 0]);
  assert.deepEqual([...sequence[12].data.subarray(56, 60)], [94, 0xab, 0xcd, 0xef]);
  assert.deepEqual([...sequence[15].data.subarray(62, 64)], [0xaa, 0x55]);
  assert.deepEqual([...sequence[17].data.subarray(0, 2)], [0x04, 0xf0]);
});

test("hardware effects use the S75 Pro effect mode and a tagged light payload", () => {
  const sequence = buildEffectSequence("breathing", "#a1b2c3");
  assert.equal(EFFECT_MODES.breathing, 7);
  assert.equal(sequence.length, 5);
  assert.deepEqual([...sequence[2].data.subarray(0, 4)], [7, 0xa1, 0xb2, 0xc3]);
  assert.deepEqual([...sequence[2].data.subarray(62)], [0xaa, 0x55]);
});

test("unsupported effects and keys are rejected", () => {
  assert.throws(() => buildEffectSequence("unknown", "#ffffff"), /unsupported/i);
  assert.throws(() => buildUserLightingSequence({ unknown: "#ffffff" }), /unsupported/i);
});
