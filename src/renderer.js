const DEFAULT_PALETTE = [
  "#a78bfa", "#f472b6", "#fb7185", "#fb923c", "#facc15", "#a3e635",
  "#34d399", "#2dd4bf", "#38bdf8", "#60a5fa", "#818cf8", "#e879f9"
];

const KEY = (id, label, width = 1, secondary = "") => ({ id, label, width, secondary });
const rows = {
  function: [
    KEY("escape", "Esc"), KEY("f1", "F1"), KEY("f2", "F2"), KEY("f3", "F3"), KEY("f4", "F4"),
    KEY("f5", "F5"), KEY("f6", "F6"), KEY("f7", "F7"), KEY("f8", "F8"), KEY("f9", "F9"),
    KEY("f10", "F10"), KEY("f11", "F11"), KEY("f12", "F12")
  ],
  number: [
    KEY("backtick", "~\n`"), KEY("digit1", "!\n1"), KEY("digit2", "@\n2"), KEY("digit3", "#\n3"),
    KEY("digit4", "$\n4"), KEY("digit5", "%\n5"), KEY("digit6", "^\n6"), KEY("digit7", "&\n7"),
    KEY("digit8", "*\n8"), KEY("digit9", "(\n9"), KEY("digit0", ")\n0"), KEY("minus", "_\n-"),
    KEY("equal", "+\n="), KEY("backspace", "Backspace", 2)
  ],
  top: [
    KEY("tab", "Tab", 1.5), KEY("q", "Q"), KEY("w", "W"), KEY("e", "E"), KEY("r", "R"),
    KEY("t", "T"), KEY("y", "Y"), KEY("u", "U"), KEY("i", "I"), KEY("o", "O"), KEY("p", "P"),
    KEY("bracket-left", "{\n["), KEY("bracket-right", "}\n]"), KEY("backslash", "|\n\\", 1.5)
  ],
  home: [
    KEY("caps", "Caps", 1.75), KEY("a", "A"), KEY("s", "S"), KEY("d", "D"), KEY("f", "F"),
    KEY("g", "G"), KEY("h", "H"), KEY("j", "J"), KEY("k", "K"), KEY("l", "L"),
    KEY("semicolon", ":\n;"), KEY("quote", "\"\n'"), KEY("enter", "Enter", 2.25)
  ],
  bottom: [
    KEY("shift-left", "Shift", 2.25), KEY("z", "Z"), KEY("x", "X"), KEY("c", "C"), KEY("v", "V"),
    KEY("b", "B"), KEY("n", "N"), KEY("m", "M"), KEY("comma", "<\n,"), KEY("period", ">\n."),
    KEY("slash", "?\n/"), KEY("shift-right", "Shift", 2.75)
  ],
  modifiers: [
    KEY("ctrl-left", "Ctrl", 1.25), KEY("meta-left", "Win", 1.25), KEY("alt-left", "Alt", 1.25),
    KEY("space", "", 6.25), KEY("alt-right", "Alt", 1.25), KEY("fn", "Fn", 1.25),
    KEY("menu", "Menu", 1.25), KEY("ctrl-right", "Ctrl", 1.25)
  ]
};

const navRows = [
  [KEY("print-screen", "PrtSc"), KEY("scroll-lock", "ScrLk"), KEY("pause", "Pause")],
  [KEY("insert", "Ins"), KEY("home-nav", "Home"), KEY("page-up", "PgUp")],
  [KEY("delete", "Del"), KEY("end", "End"), KEY("page-down", "PgDn")]
];
const arrowKeys = [KEY("arrow-up", "↑"), KEY("arrow-left", "←"), KEY("arrow-down", "↓"), KEY("arrow-right", "→")];
const numpadRows = [
  [KEY("num-lock", "Num"), KEY("num-divide", "/"), KEY("num-multiply", "*"), KEY("num-subtract", "-")],
  [KEY("num7", "7"), KEY("num8", "8"), KEY("num9", "9"), KEY("num-add", "+")],
  [KEY("num4", "4"), KEY("num5", "5"), KEY("num6", "6")],
  [KEY("num1", "1"), KEY("num2", "2"), KEY("num3", "3"), KEY("num-enter", "Enter")],
  [KEY("num0", "0", 2), KEY("num-decimal", ".")]
];
const s75Rows = {
  function: [...rows.function, KEY("delete", "Del")],
  number: [...rows.number.slice(0, -1), KEY("backspace", "Backspace", 2), KEY("home-nav", "Home")],
  top: [...rows.top, KEY("end", "End")],
  home: rows.home,
  bottom: [...rows.bottom, KEY("arrow-up", "↑")],
  modifiers: rows.modifiers.filter((key) => key.id !== "menu"),
  arrows: arrowKeys.slice(1)
};
const s75Keys = [
  ...s75Rows.function,
  ...s75Rows.number,
  ...s75Rows.top,
  ...s75Rows.home,
  ...s75Rows.bottom,
  ...s75Rows.modifiers,
  ...s75Rows.arrows
];
const s75KeyIds = new Set(s75Keys.map((key) => key.id));

const layouts = {
  "60": { name: "60% Compact", caption: "60% · 61 keys · ANSI layout", compact: true, functionRow: false, nav: false, numpad: false, arrows: false },
  "65": { name: "65% Compact", caption: "65% · 65 keys · ANSI layout", compact: true, functionRow: false, nav: false, numpad: false, arrows: true },
  tkl: { name: "TKL", caption: "TKL · 87 keys · ANSI layout", compact: false, functionRow: true, nav: true, numpad: false, arrows: true },
  full: { name: "Full size", caption: "Full size · 104 keys · ANSI layout", compact: false, functionRow: true, nav: true, numpad: true, arrows: true },
  s75: { name: "AULA S75 Pro", caption: "AULA S75 Pro · 80 keys · USB lighting", compact: true, s75: true }
};

const state = {
  name: "Midnight Bloom",
  layout: "tkl",
  colors: {},
  palette: [...DEFAULT_PALETTE],
  selected: new Set(["enter"]),
  activeColor: "#a78bfa",
  mode: "select",
  effect: "static",
  zoom: 1
};

const board = document.getElementById("keyboard-board");
const paletteElement = document.getElementById("palette");
const quickColorsElement = document.getElementById("quick-colors");
const hexInput = document.getElementById("hex-color");
const colorPicker = document.getElementById("color-picker");
let toastTimer;
let keyboardAvailable = false;
let applyingLighting = false;
let detectedKeyboards = [];
let selectedKeyboardId = "";
let previousLayout = "tkl";

function allLayoutKeys(layoutId = state.layout) {
  const layout = layouts[layoutId];
  if (layout.s75) return s75Keys;
  const keys = [];
  if (layout.functionRow) keys.push(...rows.function);
  keys.push(...rows.number, ...rows.top, ...rows.home, ...rows.bottom, ...rows.modifiers);
  if (layout.nav) keys.push(...navRows.flat());
  if (layout.arrows) keys.push(...arrowKeys);
  if (layout.numpad) keys.push(...numpadRows.flat());
  return keys;
}

function countText(count) {
  return `${count} selected`;
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function markDirty() {
  setSaveStatus(false);
}

function markSaved() {
  setSaveStatus(true);
}

function setSaveStatus(saved) {
  const status = document.getElementById("save-status");
  status.textContent = saved ? "All changes saved" : "Unsaved changes";
  status.previousElementSibling.style.background = saved ? "#65cf9a" : "#f4b35e";
}

function createKeyButton(key, index) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "key";
  button.dataset.key = key.id;
  button.dataset.row = key.id.startsWith("num") ? "numpad" : getRowName(key.id);
  button.style.setProperty("--key-width", key.width);
  button.style.setProperty("--delay", `${(index % 25) * 0.045}s`);
  if (key.width > 1.5) button.classList.add("wide");
  button.setAttribute("aria-label", key.label.replace("\n", " ") || "Space");
  button.title = key.label.replace("\n", " ") || "Space";

  const label = document.createElement("span");
  label.className = "key-label";
  label.textContent = key.label;
  button.append(label);
  if (key.secondary) {
    const secondary = document.createElement("span");
    secondary.className = "key-secondary";
    secondary.textContent = key.secondary;
    button.append(secondary);
  }
  button.addEventListener("click", (event) => handleKeyClick(key, button, event));
  return button;
}

function getRowName(id) {
  if (["escape", "f1", "f2", "f3", "f4", "f5", "f6", "f7", "f8", "f9", "f10", "f11", "f12"].includes(id)) return "function";
  if (id === "delete") return state.layout === "s75" ? "function" : "navigation-bottom";
  if (["backtick", "digit1", "digit2", "digit3", "digit4", "digit5", "digit6", "digit7", "digit8", "digit9", "digit0", "minus", "equal", "backspace"].includes(id)) return "number";
  if (id === "home-nav") return state.layout === "s75" ? "number" : "navigation-middle";
  if (["tab", "q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "bracket-left", "bracket-right", "backslash"].includes(id)) return "top";
  if (id === "end") return state.layout === "s75" ? "top" : "navigation-bottom";
  if (["caps", "a", "s", "d", "f", "g", "h", "j", "k", "l", "semicolon", "quote", "enter"].includes(id)) return "home";
  if (id === "arrow-up" && state.layout === "s75") return "bottom";
  if (["shift-left", "z", "x", "c", "v", "b", "n", "m", "comma", "period", "slash", "shift-right"].includes(id)) return "bottom";
  if (["ctrl-left", "meta-left", "alt-left", "space", "alt-right", "fn", "menu", "ctrl-right", "arrow-up", "arrow-left", "arrow-down", "arrow-right"].includes(id)) return "modifiers";
  if (["print-screen", "scroll-lock", "pause"].includes(id)) return "navigation-top";
  if (["insert", "home-nav", "page-up"].includes(id)) return "navigation-middle";
  if (["delete", "end", "page-down"].includes(id)) return "navigation-bottom";
  return "numpad";
}

function appendRow(container, keys, indexOffset = 0) {
  const row = document.createElement("div");
  row.className = "key-row";
  for (const [index, key] of keys.entries()) {
    row.append(createKeyButton(key, index + indexOffset));
  }
  container.append(row);
  return row;
}

function renderS75Keyboard(layout) {
  const main = document.createElement("div");
  main.className = "keyboard-main";
  const functionRow = document.createElement("div");
  functionRow.className = "key-row";
  for (const [index, key] of s75Rows.function.entries()) {
    if (index === 5 || index === 9) {
      const spacer = document.createElement("span");
      spacer.className = "row-spacer";
      functionRow.append(spacer);
    }
    functionRow.append(createKeyButton(key, index));
  }
  main.append(functionRow);
  appendRow(main, s75Rows.number, 14);
  appendRow(main, s75Rows.top, 29);
  appendRow(main, s75Rows.home, 44);
  appendRow(main, s75Rows.bottom, 57);
  appendRow(main, [...s75Rows.modifiers, ...s75Rows.arrows], 70);
  board.append(main);

  updateKeyAppearance();
  document.getElementById("layout-caption").textContent = layout.caption;
  document.getElementById("total-count").textContent = allLayoutKeys().length;
  document.querySelectorAll(".layout-option").forEach((option) => {
    const selected = option.dataset.layout === state.layout;
    option.classList.toggle("active", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  requestAnimationFrame(fitKeyboard);
}

function renderKeyboard() {
  const layout = layouts[state.layout];
  board.replaceChildren();
  document.getElementById("back-layout").hidden = !layout.s75;
  const previewEffect = ["static", "breathing", "wave", "rainbow"].includes(state.effect) ? state.effect : "static";
  board.className = `keyboard-board${layout.compact ? " keyboard-compact" : ""} effect-${previewEffect}`;
  if (layout.s75) {
    renderS75Keyboard(layout);
    updateHardwareControls();
    return;
  }
  const main = document.createElement("div");
  main.className = "keyboard-main";

  if (layout.functionRow) {
    const functionRow = document.createElement("div");
    functionRow.className = "key-row";
    for (const [index, key] of rows.function.entries()) {
      if (index === 1 || index === 5 || index === 9) {
        const spacer = document.createElement("span");
        spacer.className = "row-spacer";
        functionRow.append(spacer);
      }
      functionRow.append(createKeyButton(key, index));
    }
    main.append(functionRow);
  }
  appendRow(main, rows.number, 13);
  appendRow(main, rows.top, 27);
  appendRow(main, rows.home, 41);
  appendRow(main, rows.bottom, 54);

  const modifierRow = document.createElement("div");
  modifierRow.className = "key-row";
  for (const [index, key] of rows.modifiers.entries()) {
    modifierRow.append(createKeyButton(key, index + 66));
  }
  main.append(modifierRow);
  board.append(main);

  if (layout.nav) {
    const nav = document.createElement("div");
    nav.className = "nav-cluster";
    navRows.forEach((row, rowIndex) => appendRow(nav, row, 75 + rowIndex * 3));
    const spacerRow = document.createElement("div");
    spacerRow.className = "nav-row";
    nav.append(spacerRow);
    const arrowUpRow = document.createElement("div");
    arrowUpRow.className = "nav-row";
    arrowUpRow.append(makeArrowSpacer(), createKeyButton(arrowKeys[0], 84), makeArrowSpacer());
    nav.append(arrowUpRow);
    const arrowRow = document.createElement("div");
    arrowRow.className = "nav-row";
    arrowKeys.slice(1).forEach((key, index) => arrowRow.append(createKeyButton(key, 85 + index)));
    nav.append(arrowRow);
    board.append(nav);
  } else if (layout.arrows) {
    const arrows = document.createElement("div");
    arrows.className = "arrow-keys";
    for (const [index, key] of arrowKeys.entries()) {
      arrows.append(createKeyButton(key, 81 + index));
    }
    board.append(arrows);
  }

  function makeArrowSpacer() {
    const spacer = document.createElement("span");
    spacer.className = "arrow-empty";
    return spacer;
  }

  if (layout.numpad) {
    const numpad = document.createElement("div");
    numpad.className = "numpad";
    numpadRows.forEach((row, rowIndex) => {
      const line = document.createElement("div");
      line.className = "numpad-row";
      row.forEach((key, index) => line.append(createKeyButton(key, 90 + rowIndex * 4 + index)));
      numpad.append(line);
    });
    board.append(numpad);
  }

  updateKeyAppearance();
  document.getElementById("layout-caption").textContent = layout.caption;
  document.getElementById("total-count").textContent = allLayoutKeys().length;
  updateHardwareControls();
  document.querySelectorAll(".layout-option").forEach((option) => {
    const selected = option.dataset.layout === state.layout;
    option.classList.toggle("active", selected);
    option.setAttribute("aria-pressed", String(selected));
  });
  requestAnimationFrame(fitKeyboard);
}

function fitKeyboard() {
  const viewport = document.getElementById("keyboard-viewport");
  const availableWidth = viewport.clientWidth - 32;
  const contentWidth = board.scrollWidth;
  if (availableWidth <= 0 || contentWidth <= 0) return;
  state.zoom = Math.max(.5, Math.min(1, availableWidth / contentWidth));
  board.style.setProperty("--zoom", state.zoom);
  document.getElementById("zoom-level").textContent = `${Math.round(state.zoom * 100)}%`;
}

function handleKeyClick(key, button, event) {
  if (event.shiftKey || state.mode === "select") {
    if (!event.shiftKey) {
      state.selected.clear();
    }
    if (state.selected.has(key.id) && event.shiftKey) {
      state.selected.delete(key.id);
    } else {
      state.selected.add(key.id);
    }
    updateSelection();
    return;
  }

  const affected = state.mode === "all"
    ? allLayoutKeys().map((entry) => entry.id)
    : state.mode === "row"
      ? [...document.querySelectorAll(`.key[data-row="${button.dataset.row}"]`)].map((entry) => entry.dataset.key)
      : [key.id];

  affected.forEach((id) => { state.colors[id] = state.activeColor; });
  state.selected.clear();
  state.selected.add(key.id);
  updateKeyAppearance();
  updateSelection();
  markDirty();
}

function updateKeyAppearance() {
  document.querySelectorAll(".key").forEach((button) => {
    const color = state.colors[button.dataset.key];
    button.style.background = color
      ? `linear-gradient(145deg, ${adjustColor(color, 18)}, ${adjustColor(color, -15)})`
      : "";
    button.style.borderColor = color ? `${adjustColor(color, 25)}` : "";
    button.style.color = color && lightness(color) > 160 ? "#211e28" : "";
    button.classList.toggle("selected", state.selected.has(button.dataset.key));
  });
  const colored = allLayoutKeys().filter((key) => state.colors[key.id]).length;
  document.getElementById("colored-count").textContent = colored;
}

function updateSelection() {
  const visibleKeys = allLayoutKeys();
  const selectedIds = [...state.selected].filter((id) => visibleKeys.some((key) => key.id === id));
  if (selectedIds.length !== state.selected.size) {
    state.selected = new Set(selectedIds);
  }
  const firstKey = visibleKeys.find((key) => key.id === selectedIds[0]);
  const keyName = firstKey ? firstKey.label.replace("\n", " ") || "Space" : "No key selected";
  document.getElementById("selected-key-name").textContent = selectedIds.length > 1 ? `${selectedIds.length} keys` : keyName;
  document.getElementById("selected-key-icon").textContent = firstKey ? displayKey(firstKey.label) : "—";
  document.getElementById("selection-count").textContent = countText(selectedIds.length);
  if (selectedIds.length === 1 && state.colors[selectedIds[0]]) {
    state.activeColor = state.colors[selectedIds[0]];
  }
  document.getElementById("selected-key-color").style.background = firstKey ? state.colors[firstKey.id] || state.activeColor : state.activeColor;
  document.getElementById("hex-swatch").style.background = state.activeColor;
  hexInput.value = state.activeColor.slice(1).toUpperCase();
  colorPicker.value = state.activeColor;
  renderPalette();
  renderQuickColors();
  updateKeyAppearance();
}

function displayKey(label) {
  const value = label.replace("\n", " ");
  if (value === "Enter") return "↵";
  if (value === "Backspace") return "⌫";
  if (value === "Shift") return "⇧";
  if (value === "Space") return "␣";
  return value.length > 3 ? value.slice(0, 3) : value;
}

function setActiveColor(color, applyToSelected = true) {
  if (!/^#[0-9a-f]{6}$/i.test(color)) return;
  state.activeColor = color.toLowerCase();
  if (applyToSelected) {
    state.selected.forEach((id) => { state.colors[id] = state.activeColor; });
  }
  updateSelection();
  if (applyToSelected && state.selected.size > 0) markDirty();
}

function renderPalette() {
  paletteElement.replaceChildren();
  state.palette.forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `palette-swatch${color.toLowerCase() === state.activeColor ? " active" : ""}`;
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    swatch.setAttribute("aria-label", `Use ${color}`);
    swatch.addEventListener("click", () => setActiveColor(color));
    paletteElement.append(swatch);
  });
}

function renderQuickColors() {
  quickColorsElement.replaceChildren();
  state.palette.slice(0, 8).forEach((color) => {
    const swatch = document.createElement("button");
    swatch.type = "button";
    swatch.className = `quick-swatch${color.toLowerCase() === state.activeColor ? " active" : ""}`;
    swatch.style.background = color;
    swatch.title = color.toUpperCase();
    swatch.setAttribute("aria-label", `Use ${color}`);
    swatch.addEventListener("click", () => setActiveColor(color));
    quickColorsElement.append(swatch);
  });
}

function adjustColor(hex, amount) {
  const value = Number.parseInt(hex.slice(1), 16);
  const channels = [value >> 16, (value >> 8) & 255, value & 255]
    .map((channel) => Math.min(255, Math.max(0, channel + amount)));
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`;
}

function lightness(hex) {
  const value = Number.parseInt(hex.slice(1), 16);
  return ((value >> 16) * 299 + ((value >> 8) & 255) * 587 + (value & 255) * 114) / 1000;
}

function serializeProject() {
  return {
    format: "keycap-studio",
    version: 1,
    name: document.getElementById("project-name").value.trim() || "Untitled keyboard",
    layout: state.layout,
    colors: state.colors,
    palette: state.palette,
    effect: state.effect
  };
}

function loadProject(project) {
  if (!project || project.format !== "keycap-studio" || project.version !== 1) {
    throw new Error("This file is not a supported Keycap Studio project.");
  }
  if (!layouts[project.layout]) {
    throw new Error("The project contains an unsupported keyboard layout.");
  }
  if (!project.colors || typeof project.colors !== "object" || Array.isArray(project.colors)) {
    throw new Error("The project does not contain a valid key color map.");
  }

  state.name = typeof project.name === "string" ? project.name : "Untitled keyboard";
  state.layout = project.layout;
  state.colors = Object.fromEntries(
    Object.entries(project.colors).filter(([, color]) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color))
  );
  state.palette = Array.isArray(project.palette) && project.palette.every((color) => typeof color === "string" && /^#[0-9a-f]{6}$/i.test(color))
    ? project.palette.slice(0, 24)
    : [...DEFAULT_PALETTE];
  const effectOptions = [...document.getElementById("effect-select").options];
  state.effect = effectOptions.some((option) => option.value === project.effect) ? project.effect : "static";
  state.activeColor = state.colors.enter || state.palette[0] || "#a78bfa";
  state.selected = new Set(["enter"]);
  document.getElementById("project-name").value = state.name;
  document.getElementById("effect-select").value = state.effect;
  renderKeyboard();
  updateSelection();
  markSaved();
}

document.getElementById("layout-options").addEventListener("click", (event) => {
  const option = event.target.closest("[data-layout]");
  if (!option || option.dataset.layout === state.layout) return;
  if (state.layout !== "s75") previousLayout = state.layout;
  state.layout = option.dataset.layout;
  state.selected = new Set(["enter"]);
  renderKeyboard();
  updateSelection();
  markDirty();
});

document.getElementById("back-layout").addEventListener("click", () => {
  state.layout = layouts[previousLayout] && previousLayout !== "s75" ? previousLayout : "tkl";
  state.selected = new Set(["enter"]);
  renderKeyboard();
  updateSelection();
  markDirty();
});

document.getElementById("brush-options").addEventListener("click", (event) => {
  const option = event.target.closest("[data-mode]");
  if (!option) return;
  state.mode = option.dataset.mode;
  document.querySelectorAll(".brush-option").forEach((button) => {
    const active = button === option;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });
});

document.getElementById("effect-select").addEventListener("change", (event) => {
  state.effect = event.target.value;
  const previewEffect = ["static", "breathing", "wave", "rainbow"].includes(state.effect) ? state.effect : "static";
  board.className = `keyboard-board${layouts[state.layout].compact ? " keyboard-compact" : ""} effect-${previewEffect}`;
  markDirty();
});

document.getElementById("custom-color").addEventListener("click", () => colorPicker.click());
document.getElementById("more-colors").addEventListener("click", () => colorPicker.click());
colorPicker.addEventListener("input", (event) => setActiveColor(event.target.value));
hexInput.addEventListener("input", () => {
  const value = hexInput.value.trim().replace(/^#/, "");
  if (/^[0-9a-f]{6}$/i.test(value)) setActiveColor(`#${value}`);
});
hexInput.addEventListener("blur", () => { hexInput.value = state.activeColor.slice(1).toUpperCase(); });

document.getElementById("add-color").addEventListener("click", () => {
  if (state.palette.some((color) => color.toLowerCase() === state.activeColor)) {
    showToast("That color is already in your palette.");
    return;
  }
  state.palette.push(state.activeColor);
  renderPalette();
  renderQuickColors();
  markDirty();
  showToast("Color added to your palette.");
});

document.getElementById("copy-color").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(state.activeColor.toUpperCase());
    showToast(`${state.activeColor.toUpperCase()} copied to clipboard.`);
  } catch (error) {
    console.error("Could not copy color to clipboard.", error);
    showToast("Could not copy color to clipboard.");
  }
});

document.getElementById("reset-design").addEventListener("click", () => {
  state.colors = {};
  updateSelection();
  markDirty();
  showToast("Key colors reset.");
});

document.getElementById("zoom-in").addEventListener("click", () => changeZoom(.1));
document.getElementById("zoom-out").addEventListener("click", () => changeZoom(-.1));

function changeZoom(amount) {
  state.zoom = Math.max(.5, Math.min(1.3, Math.round((state.zoom + amount) * 10) / 10));
  board.style.setProperty("--zoom", state.zoom);
  document.getElementById("zoom-level").textContent = `${Math.round(state.zoom * 100)}%`;
}

document.getElementById("project-name").addEventListener("input", markDirty);

document.getElementById("save-project").addEventListener("click", async () => {
  try {
    const result = await window.keycapStudio.saveProject(serializeProject());
    if (!result.canceled) {
      markSaved();
      showToast("Design saved successfully.");
    }
  } catch (error) {
    console.error("Could not save project.", error);
    showToast(`Could not save design: ${error.message}`);
  }
});

document.getElementById("open-project").addEventListener("click", async () => {
  try {
    const result = await window.keycapStudio.openProject();
    if (!result.canceled) {
      loadProject(result.project);
      showToast("Design opened successfully.");
    }
  } catch (error) {
    console.error("Could not open project.", error);
    showToast(`Could not open design: ${error.message}`);
  }
});

function updateHardwareControls() {
  const applyButton = document.getElementById("apply-lighting");
  if (!applyButton) return;
  const keyboard = detectedKeyboards.find((device) => device.deviceId === selectedKeyboardId);
  applyButton.disabled = state.layout !== "s75" || !keyboard?.lightingReady || applyingLighting;
}

function updateKeyboardStatus() {
  const status = document.getElementById("keyboard-status");
  const keyboard = detectedKeyboards.find((device) => device.deviceId === selectedKeyboardId);
  status.classList.remove("connected", "error");
  if (!keyboard) {
    status.textContent = "No USB keyboard detected. Plug one in to identify its model.";
    return;
  }
  if (keyboard.knownModel === "aula-s75-pro") {
    if (keyboard.lightingReady) {
      status.textContent = `${keyboard.name} detected · RGB control ready`;
      status.classList.add("connected");
    } else {
      status.textContent = `${keyboard.name} detected (${keyboard.vendorIdHex}:${keyboard.productIdHex}), but its RGB interface is unavailable. Close other AULA software, check USB mode, then refresh.`;
      status.classList.add("error");
    }
    return;
  }
  status.textContent = `${keyboard.name} detected via USB (${keyboard.vendorIdHex}:${keyboard.productIdHex}). RGB control is not yet supported for this model.`;
}

async function refreshKeyboard(showErrors = true) {
  const status = document.getElementById("keyboard-status");
  status.classList.remove("connected", "error");
  status.textContent = "Detecting USB keyboards…";
  document.getElementById("refresh-keyboard").disabled = true;
  try {
    const previousSelection = selectedKeyboardId;
    detectedKeyboards = await window.keycapStudio.scanKeyboard();
    const selectionStillConnected = detectedKeyboards.some((device) => device.deviceId === previousSelection);
    selectedKeyboardId = selectionStillConnected
      ? previousSelection
      : detectedKeyboards[0]?.deviceId || "";

    const deviceSelect = document.getElementById("keyboard-device");
    const deviceWrap = document.getElementById("keyboard-device-wrap");
    deviceSelect.replaceChildren();
    for (const device of detectedKeyboards) {
      const option = document.createElement("option");
      option.value = device.deviceId;
      option.textContent = `${device.name} (${device.vendorIdHex}:${device.productIdHex})`;
      deviceSelect.append(option);
    }
    deviceWrap.hidden = detectedKeyboards.length < 2;
    deviceSelect.value = selectedKeyboardId;

    const keyboard = detectedKeyboards.find((device) => device.deviceId === selectedKeyboardId);
    if (keyboard?.knownModel === "aula-s75-pro" && state.layout !== "s75") {
      state.layout = "s75";
      state.selected = new Set(["enter"]);
      renderKeyboard();
      updateSelection();
      markDirty();
    }
    updateKeyboardStatus();
    if (showErrors && detectedKeyboards.length === 0) showToast("No USB keyboard detected.");
  } catch (error) {
    detectedKeyboards = [];
    selectedKeyboardId = "";
    document.getElementById("keyboard-device").replaceChildren();
    document.getElementById("keyboard-device-wrap").hidden = true;
    status.textContent = "Could not detect USB keyboards";
    status.classList.add("error");
    console.error("Could not check the keyboard connection.", error);
    if (showErrors) showToast(`Connection check failed: ${error.message}`);
  } finally {
    document.getElementById("refresh-keyboard").disabled = false;
    keyboardAvailable = detectedKeyboards.some((device) =>
      device.deviceId === selectedKeyboardId && device.lightingReady
    );
    updateHardwareControls();
  }
}

document.getElementById("refresh-keyboard").addEventListener("click", () => refreshKeyboard());
document.getElementById("keyboard-device").addEventListener("change", (event) => {
  selectedKeyboardId = event.target.value;
  const keyboard = detectedKeyboards.find((device) => device.deviceId === selectedKeyboardId);
  if (keyboard?.knownModel === "aula-s75-pro" && state.layout !== "s75") {
    state.layout = "s75";
    state.selected = new Set(["enter"]);
    renderKeyboard();
    updateSelection();
    markDirty();
  }
  updateKeyboardStatus();
  keyboardAvailable = Boolean(keyboard?.lightingReady);
  updateHardwareControls();
});
document.getElementById("apply-lighting").addEventListener("click", async () => {
  if (state.layout !== "s75" || !keyboardAvailable || applyingLighting) return;
  applyingLighting = true;
  updateHardwareControls();
  const status = document.getElementById("keyboard-status");
  status.classList.remove("connected", "error");
  status.textContent = "Applying lighting…";
  try {
    await window.keycapStudio.applyLighting({
      deviceId: selectedKeyboardId,
      layout: state.layout,
      effect: state.effect,
      activeColor: state.activeColor,
      colors: Object.fromEntries(
        Object.entries(state.colors).filter(([key]) => s75KeyIds.has(key))
      )
    });
    status.textContent = "Lighting applied to AULA S75 Pro";
    status.classList.add("connected");
    showToast("Lighting applied to your keyboard.");
  } catch (error) {
    status.textContent = "Could not apply lighting; checking the device again…";
    status.classList.add("error");
    console.error("Could not apply lighting to the keyboard.", error);
    showToast(`Could not apply lighting: ${error.message}`);
    await refreshKeyboard(false);
  } finally {
    applyingLighting = false;
    updateHardwareControls();
  }
});

window.addEventListener("resize", fitKeyboard);
renderKeyboard();
updateSelection();
updateHardwareControls();
window.keycapStudio.onKeyboardsChanged(() => refreshKeyboard(false));
refreshKeyboard(false);
