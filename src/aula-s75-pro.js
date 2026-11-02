const VENDOR_ID = 0x0c45;
const PRODUCT_ID = 0x800a;
const REPORT_ID = 0;
const REPORT_LENGTH = 65;
const PACKET_LENGTH = 64;
const COLOR_BLOCK_LENGTH = 0x240;
const PACKET_DELAY_MS = 35;

const OPS = {
  BEGIN: 0x18,
  END: 0x02,
  APPLY: 0xf0,
  LIGHT: 0x13,
  USER_LIGHT: 0x23
};

const EFFECT_MODES = {
  solid: 1,
  "single-on": 2,
  "single-off": 3,
  glittering: 4,
  fluttering: 5,
  colourful: 6,
  breathing: 7,
  rainbow: 8,
  outward: 9,
  wave: 10,
  rolling: 11,
  rotating: 12,
  explode: 13,
  launch: 14,
  ripples: 15,
  flowing: 16,
  pulsating: 17,
  tilt: 18,
  shuttle: 19,
  off: 0
};

const KEY_LED_SLOTS = {
  escape: 1,
  f1: 2,
  f2: 3,
  f3: 4,
  f4: 5,
  f5: 6,
  f6: 7,
  f7: 8,
  f8: 9,
  f9: 10,
  f10: 11,
  f11: 12,
  f12: 13,
  delete: 119,
  backtick: 19,
  digit1: 20,
  digit2: 21,
  digit3: 22,
  digit4: 23,
  digit5: 24,
  digit6: 25,
  digit7: 26,
  digit8: 27,
  digit9: 28,
  digit0: 29,
  minus: 30,
  equal: 31,
  backspace: 103,
  "home-nav": 117,
  tab: 37,
  q: 38,
  w: 39,
  e: 40,
  r: 41,
  t: 42,
  y: 43,
  u: 44,
  i: 45,
  o: 46,
  p: 47,
  "bracket-left": 48,
  "bracket-right": 49,
  backslash: 67,
  end: 120,
  caps: 55,
  a: 56,
  s: 57,
  d: 58,
  f: 59,
  g: 60,
  h: 61,
  j: 62,
  k: 63,
  l: 64,
  semicolon: 65,
  quote: 66,
  enter: 85,
  "shift-left": 73,
  z: 74,
  x: 75,
  c: 76,
  v: 77,
  b: 78,
  n: 79,
  m: 80,
  comma: 81,
  period: 82,
  slash: 83,
  "shift-right": 84,
  "arrow-up": 101,
  "ctrl-left": 91,
  "meta-left": 92,
  "alt-left": 93,
  space: 94,
  "alt-right": 95,
  fn: 96,
  "ctrl-right": 98,
  "arrow-left": 99,
  "arrow-down": 100,
  "arrow-right": 102
};

function command(op, count = 0) {
  const report = Buffer.alloc(PACKET_LENGTH);
  report[0] = 0x04;
  report[1] = op;
  report[8] = count & 0xff;
  report[9] = (count >> 8) & 0xff;
  return report;
}

function colorChannels(color) {
  const value = Number.parseInt(color.slice(1), 16);
  return [(value >> 16) & 0xff, (value >> 8) & 0xff, value & 0xff];
}

function lightPayload(mode, color) {
  const report = Buffer.alloc(PACKET_LENGTH);
  report.set([mode, ...colorChannels(color), 0, 0, 0, 0, 0, 5, 3, 0]);
  report[62] = 0xaa;
  report[63] = 0x55;
  return report;
}

function report(data, readback = true) {
  return { data, readback };
}

function buildUserLightingSequence(colors) {
  const block = Buffer.alloc(COLOR_BLOCK_LENGTH);
  for (const [key, color] of Object.entries(colors)) {
    const slot = KEY_LED_SLOTS[key];
    if (slot === undefined) {
      throw new Error(`Unsupported S75 Pro key: ${key}`);
    }
    block.set([slot, ...colorChannels(color)], slot * 4);
  }
  block[COLOR_BLOCK_LENGTH - 2] = 0xaa;
  block[COLOR_BLOCK_LENGTH - 1] = 0x55;

  const packets = [
    report(command(OPS.BEGIN)),
    report(command(OPS.LIGHT, 1)),
    report(lightPayload(0x80, "#ffffff"), false),
    report(command(OPS.END)),
    report(command(OPS.APPLY), false),
    report(command(OPS.BEGIN)),
    report(command(OPS.USER_LIGHT, COLOR_BLOCK_LENGTH / PACKET_LENGTH))
  ];
  for (let offset = 0; offset < block.length; offset += PACKET_LENGTH) {
    packets.push(report(block.subarray(offset, offset + PACKET_LENGTH), false));
  }
  packets.push(report(command(OPS.END)), report(command(OPS.APPLY)));
  return packets;
}

function buildEffectSequence(effect, color) {
  const mode = EFFECT_MODES[effect];
  if (mode === undefined) {
    throw new Error("Unsupported AULA S75 Pro lighting effect.");
  }
  return [
    report(command(OPS.BEGIN)),
    report(command(OPS.LIGHT, 1)),
    report(lightPayload(mode, color), false),
    report(command(OPS.END)),
    report(command(OPS.APPLY), false)
  ];
}

function sleep(milliseconds) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

async function sendSequence(device, packets) {
  for (const packet of packets) {
    await sleep(PACKET_DELAY_MS);
    const data = Buffer.concat([Buffer.from([REPORT_ID]), packet.data]);
    await device.sendFeatureReport(data);

    if (!packet.readback) {
      continue;
    }

    await sleep(PACKET_DELAY_MS);
    let response = await device.getFeatureReport(REPORT_ID, REPORT_LENGTH);
    if (response.length < REPORT_LENGTH) {
      throw new Error("The keyboard returned an incomplete lighting response.");
    }
    if (response[2] !== packet.data[1] || response[4] !== 0xff) {
      continue;
    }

    await sleep(PACKET_DELAY_MS);
    await device.sendFeatureReport(data);
    await sleep(PACKET_DELAY_MS);
    response = await device.getFeatureReport(REPORT_ID, REPORT_LENGTH);
    if (response.length < REPORT_LENGTH || (response[2] === packet.data[1] && response[4] === 0xff)) {
      throw new Error("The keyboard is busy and did not accept the lighting command.");
    }
  }
}

module.exports = {
  DEVICE: { vendorId: VENDOR_ID, productId: PRODUCT_ID },
  EFFECT_MODES,
  KEY_LED_SLOTS,
  REPORT_ID,
  REPORT_LENGTH,
  buildEffectSequence,
  buildUserLightingSequence,
  sendSequence
};
