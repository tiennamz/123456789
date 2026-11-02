const { app, BrowserWindow, dialog, ipcMain } = require("electron");
const fs = require("node:fs/promises");
const path = require("node:path");
const HID = require("node-hid");
const { AULA_S75_PRO, detectKeyboards, deviceIdentity } = require("./keyboard-detection");
const { EFFECT_MODES, KEY_LED_SLOTS, REPORT_ID, REPORT_LENGTH, buildEffectSequence, buildUserLightingSequence, sendSequence } = require("./aula-s75-pro");

let keyboardQueue = Promise.resolve();

function runKeyboardOperation(operation) {
  const result = keyboardQueue.then(operation, operation);
  keyboardQueue = result.catch(() => undefined);
  return result;
}

function findS75ProDevice(deviceId) {
  return HID.devices().find((device) =>
    device.vendorId === AULA_S75_PRO.vendorId
      && device.productId === AULA_S75_PRO.productId
      && device.path
      && deviceIdentity(device) === deviceId
      && (device.interface === 0 || /&mi_00(?:&|#)/i.test(device.path))
  );
}

async function scanKeyboards() {
  const keyboards = detectKeyboards(HID.devices());
  for (const keyboard of keyboards) {
    if (keyboard.knownModel !== "aula-s75-pro") continue;
    let device;
    try {
      const info = findS75ProDevice(keyboard.deviceId);
      if (!info) continue;
      device = await HID.HIDAsync.open(info.path, { nonExclusive: true });
      const response = await device.getFeatureReport(REPORT_ID, REPORT_LENGTH);
      keyboard.lightingReady = response.length >= REPORT_LENGTH;
    } catch (error) {
      keyboard.lightingError = error.message;
    } finally {
      await device?.close();
    }
  }
  return keyboards;
}

async function withS75Pro(operation) {
  const { device, info } = await openS75Pro();
  try {
    return await operation(device, info);
  } finally {
    await device.close();
  }
}

function validateLightingRequest(request) {
  if (!request || request.layout !== "s75" || typeof request.deviceId !== "string") {
    throw new Error("Select the connected AULA S75 Pro before applying lighting.");
  }
  if (typeof request.activeColor !== "string" || !/^#[0-9a-f]{6}$/i.test(request.activeColor)) {
    throw new Error("Choose a valid active color before applying lighting.");
  }
  if (request.effect !== "static" && !Object.hasOwn(EFFECT_MODES, request.effect)) {
    throw new Error("Choose a supported AULA S75 Pro lighting effect.");
  }
  if (!request.colors || typeof request.colors !== "object" || Array.isArray(request.colors)) {
    throw new Error("The design does not contain a valid key color map.");
  }

  const colors = {};
  for (const [key, color] of Object.entries(request.colors)) {
    if (!Object.hasOwn(KEY_LED_SLOTS, key) || typeof color !== "string" || !/^#[0-9a-f]{6}$/i.test(color)) {
      throw new Error("The design contains an unsupported key or invalid color.");
    }
    colors[key] = color;
  }
  return { effect: request.effect, activeColor: request.activeColor, colors };
}

function createWindow() {
  const window = new BrowserWindow({
    width: 1440,
    height: 960,
    minWidth: 1050,
    minHeight: 720,
    backgroundColor: "#0c0e14",
    title: "Keycap Studio",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.loadFile(path.join(__dirname, "index.html"));
}

ipcMain.handle("project:save", async (_event, project) => {
  const projectName = typeof project?.name === "string" ? project.name : "Untitled keyboard";
  const safeName = projectName.replace(/[<>:"/\\|?*\x00-\x1f]/g, "-").trim() || "Untitled keyboard";
  const { canceled, filePath } = await dialog.showSaveDialog({
    title: "Save keyboard design",
    defaultPath: `${safeName}.keycap.json`,
    filters: [{ name: "Keycap Studio project", extensions: ["json"] }]
  });

  if (canceled || !filePath) {
    return { canceled: true };
  }

  await fs.writeFile(filePath, JSON.stringify(project, null, 2), "utf8");
  return { canceled: false, filePath };
});

ipcMain.handle("project:open", async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    title: "Open keyboard design",
    properties: ["openFile"],
    filters: [{ name: "Keycap Studio project", extensions: ["json"] }]
  });

  if (canceled || filePaths.length === 0) {
    return { canceled: true };
  }

  const content = await fs.readFile(filePaths[0], "utf8");
  return { canceled: false, project: JSON.parse(content) };
});

ipcMain.handle("keyboard:scan", () => runKeyboardOperation(scanKeyboards));

ipcMain.handle("keyboard:apply", (_event, request) => runKeyboardOperation(async () => {
  const lighting = validateLightingRequest(request);
  const info = findS75ProDevice(request.deviceId);
  if (!info) {
    throw new Error("The selected AULA S75 Pro is no longer connected.");
  }
  const device = await HID.HIDAsync.open(info.path, { nonExclusive: true });
  try {
    const response = await device.getFeatureReport(REPORT_ID, REPORT_LENGTH);
    if (response.length < REPORT_LENGTH) {
      throw new Error("The AULA S75 Pro lighting interface did not respond.");
    }
    const packets = lighting.effect === "static"
      ? buildUserLightingSequence(lighting.colors)
      : buildEffectSequence(lighting.effect, lighting.activeColor);
    await sendSequence(device, packets);
    return { applied: true };
  } finally {
    await device.close();
  }
}));

let keyboardSnapshot = "";
let keyboardWatcher;

function publishKeyboardChanges() {
  const keyboards = detectKeyboards(HID.devices());
  const snapshot = JSON.stringify(keyboards.map(({ deviceId, name, vendorId, productId }) => ({
    deviceId, name, vendorId, productId
  })));
  if (snapshot === keyboardSnapshot) return;
  keyboardSnapshot = snapshot;
  for (const window of BrowserWindow.getAllWindows()) {
    if (!window.isDestroyed()) window.webContents.send("keyboard:devices-changed");
  }
}

app.whenReady().then(() => {
  createWindow();
  publishKeyboardChanges();
  keyboardWatcher = setInterval(() => {
    try {
      publishKeyboardChanges();
    } catch (error) {
      console.error("Could not check connected USB keyboards.", error);
    }
  }, 1200);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  clearInterval(keyboardWatcher);
  if (process.platform !== "darwin") {
    app.quit();
  }
});
