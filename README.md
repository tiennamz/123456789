# Keycap Studio

A Windows desktop editor for designing keyboard layouts, per-key colors, and lighting effects. It automatically detects attached USB HID keyboards and shows their reported model and USB IDs. RGB control is currently implemented only for the AULA S75 Pro, subject to its lighting HID interface being available.

## Run

1. Install Node.js 22.12 or newer.
2. From this folder, run `npm.cmd install`.
3. Run `npm.cmd start`. Electron downloads its desktop runtime on first launch, so an internet connection is needed once.

## Use

- Plug in or unplug a USB keyboard; connected keyboard model names and USB IDs update automatically.
- Choose a 60%, 65%, TKL, full-size, or AULA S75 Pro layout.
- Select keys and apply a color, or use Key, Row, and All paint modes.
- Select the AULA S75 Pro layout, connect it by USB, and use **Apply to keyboard** to send custom per-key colors or one of its built-in lighting effects.
- Save and reopen `.keycap.json` project files.

Detection works for USB HID keyboards that expose a standard keyboard collection or identify themselves as a keyboard in their USB descriptors. Names are provided by the device and may be generic. Unknown models can still use the editor and layout templates, but their RGB cannot be changed until their device-specific protocol is implemented. The AULA S75 Pro lighting integration is USB-only; Bluetooth mode is not supported. Close AULA's other lighting software before applying changes because it can take control of the same HID interface. Saved projects contain the layout, key colors, palette, and selected lighting effect.

The S75 Pro protocol and LED slot mapping are based on [AulaToolkit](https://github.com/Livvaa/AulaToolkit), which is licensed under GPL-3.0-or-later. This project is distributed under the same license.
