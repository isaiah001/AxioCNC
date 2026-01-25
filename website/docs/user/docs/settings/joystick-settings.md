---
sidebar_position: 9
title: Joystick
---

# Joystick Settings

**Settings → Joystick** configures a USB gamepad or joystick for jogging and machine actions (Home, Set Zero, etc.).

## Enable gamepad support

**Enable gamepad support** — Turn joystick/gamepad control **on** or **off**. When **off**, the rest of the options have no effect.

## Gamepad connection location

**Gamepad connection location** — Where the gamepad is plugged in.

- **Server** — Gamepad is connected to the machine running the AxioCNC server. Best when the browser and server are on the same machine. Server-side gamepads are supported on **Linux** only.
- **Client** — Gamepad is connected to the machine running the browser. Use when you control AxioCNC from a different PC (e.g. tablet). You may need to press a button on the gamepad while the page is focused before it’s detected.

## Select gamepad

**Select gamepad** — Choose the device from the list. Use **Refresh** to rescan. The UI shows **Connected** or **Disconnected** for the selected device. **Test** opens a dialog to verify buttons and axes.

For **Client**, press a button on the gamepad while the Settings page is focused so the browser can detect it.

## Analog stick configuration

Maps each stick axis to an action:

- **Left stick X** — e.g. **Jog X axis**.
- **Left stick Y** — e.g. **Jog Y axis**.
- **Right stick X** — **None**, **Jog X**, **Jog Y**, **Jog Z**, or **Feed rate**.
- **Right stick Y** — e.g. **Jog Z axis**.

**None** disables that axis.

## Analog settings

- **Deadzone** — 0–50%. Inputs below this are ignored (reduces drift).
- **Sensitivity** — 0.5×–2.0×. Response curve for stick input.
- **Max XY jog speed** — 100–10000 mm/min. Speed at full stick deflection for X/Y.
- **Max Z jog speed** — 50–5000 mm/min. Speed at full stick deflection for Z. Often set lower than XY.

## Axis inversion

- **Invert X**, **Invert Y**, **Invert Z** — Flip stick direction for that axis when it feels reversed.

## Button mappings

**Button mappings** — Assign each gamepad button to a **CNC action**:

- **Jogging** — e.g. Jog X+/−, Y+/−, Z+/−.
- **Machine control** — Home all, Emergency stop, etc.
- **Zeroing** — Set zero (all or per axis).
- **Spindle** — Spindle on/off.
- **Speed** — Slow/fast jog.
- **Emergency** — E-stop.

**D-pad** buttons can be mapped separately (e.g. to jog directions). Use **Test** to identify button indices, then set each mapping in the table.

## Next steps

- [Jogging](../machine-control/jogging)
- [Setup screen](../workflow/setup-screen)
