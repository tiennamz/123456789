const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("keycapStudio", {
  saveProject: (project) => ipcRenderer.invoke("project:save", project),
  openProject: () => ipcRenderer.invoke("project:open"),
  scanKeyboard: () => ipcRenderer.invoke("keyboard:scan"),
  applyLighting: (lighting) => ipcRenderer.invoke("keyboard:apply", lighting),
  onKeyboardsChanged: (callback) => {
    const listener = () => callback();
    ipcRenderer.on("keyboard:devices-changed", listener);
    return () => ipcRenderer.removeListener("keyboard:devices-changed", listener);
  }
});
