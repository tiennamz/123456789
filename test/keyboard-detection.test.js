const test = require("node:test");
const assert = require("node:assert/strict");
const { detectKeyboards } = require("../src/keyboard-detection");

test("detects and identifies a standard HID keyboard collection", () => {
  const [keyboard] = detectKeyboards([{
    path: "hid-path",
    vendorId: 0x1234,
    productId: 0x5678,
    product: "Example Keyboard",
    manufacturer: "Example",
    usagePage: 0x01,
    usage: 0x06
  }]);

  assert.equal(keyboard.name, "Example Keyboard");
  assert.equal(keyboard.vendorIdHex, "1234");
  assert.equal(keyboard.productIdHex, "5678");
  assert.equal(keyboard.knownModel, null);
  assert.equal(keyboard.lightingSupported, false);
});

test("recognizes the AULA S75 Pro without claiming its lighting interface is ready", () => {
  const [keyboard] = detectKeyboards([{
    path: "hid-path",
    vendorId: 0x0c45,
    productId: 0x800a,
    product: "AULA-S75Pro",
    manufacturer: "SONiX",
    usagePage: 0x01,
    usage: 0x06
  }]);

  assert.equal(keyboard.knownModel, "aula-s75-pro");
  assert.equal(keyboard.lightingSupported, true);
  assert.equal(keyboard.lightingReady, false);
});

test("deduplicates multiple HID collections for one keyboard", () => {
  const collections = [
    { path: "first", vendorId: 0x0c45, productId: 0x800a, product: "AULA-S75Pro", usagePage: 1, usage: 6 },
    { path: "second", vendorId: 0x0c45, productId: 0x800a, product: "AULA-S75Pro", usagePage: 1, usage: 6 }
  ];
  assert.equal(detectKeyboards(collections).length, 1);
});

test("ignores non-keyboard HID devices without keyboard descriptors", () => {
  assert.deepEqual(detectKeyboards([{
    path: "hid-path",
    vendorId: 1,
    productId: 2,
    product: "Generic HID device",
    usagePage: 0x0c,
    usage: 0x01
  }]), []);
});
