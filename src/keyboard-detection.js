const { createHash } = require("node:crypto");

const AULA_S75_PRO = { vendorId: 0x0c45, productId: 0x800a };
const KEYBOARD_USAGE_PAGE = 0x01;
const KEYBOARD_USAGE = 0x06;

function isKeyboardCollection(device) {
  if (device.usagePage === KEYBOARD_USAGE_PAGE && device.usage === KEYBOARD_USAGE) {
    return true;
  }
  return /keyboard|keypad/i.test(`${device.product || ""} ${device.manufacturer || ""}`);
}

function deviceIdentity(device) {
  const hardwareId = `${device.vendorId}:${device.productId}`;
  const stableDescriptor = device.serialNumber || device.product || device.manufacturer || "keyboard";
  return createHash("sha256").update(`${hardwareId}:${stableDescriptor}`).digest("hex").slice(0, 16);
}

function detectKeyboards(devices) {
  const keyboards = new Map();
  for (const device of devices) {
    if (!device.path || !Number.isInteger(device.vendorId) || !Number.isInteger(device.productId) || !isKeyboardCollection(device)) {
      continue;
    }

    const deviceId = deviceIdentity(device);
    if (keyboards.has(deviceId)) continue;

    const knownModel = device.vendorId === AULA_S75_PRO.vendorId && device.productId === AULA_S75_PRO.productId
      ? "aula-s75-pro"
      : null;
    const vendorId = device.vendorId;
    const productId = device.productId;
    keyboards.set(deviceId, {
      deviceId,
      vendorId,
      productId,
      vendorIdHex: vendorId.toString(16).padStart(4, "0").toUpperCase(),
      productIdHex: productId.toString(16).padStart(4, "0").toUpperCase(),
      name: device.product || (knownModel === "aula-s75-pro" ? "AULA S75 Pro" : "USB HID keyboard"),
      manufacturer: device.manufacturer || "",
      knownModel,
      lightingSupported: knownModel !== null,
      lightingReady: false
    });
  }
  return [...keyboards.values()];
}

module.exports = { AULA_S75_PRO, detectKeyboards, deviceIdentity };
