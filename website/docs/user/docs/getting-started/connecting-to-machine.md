---
sidebar_position: 2
title: Connecting to Your Machine
---

# Connecting to Your Machine

Configure the serial connection so AxioCNC can talk to your CNC controller, then connect from the main UI.

## What you’ll do

- Set serial port, baud rate, and controller type
- Test the connection
- Connect and confirm status

## Prerequisites

- CNC controller powered on and connected via USB (or serial)
- Correct driver installed (e.g. USB‑serial) so the port appears in the OS
- On Linux/Pi: user in `dialout` group, then logged out and back in

## Steps

1. **Open Settings → Connection**

   Click the **Settings** (gear) icon, then select **Connection** in the sidebar.

2. **Choose the serial port**

   - **Linux / Pi:** Often `/dev/ttyUSB0` or `/dev/ttyACM0`. Check with `ls /dev/ttyUSB* /dev/ttyACM*`.
   - **Windows:** e.g. `COM3`, `COM4`. Check **Device Manager → Ports (COM & LPT)**.
   - **macOS:** Often `/dev/cu.usbserial-*` or `/dev/cu.usbmodem*`.

   Use **Refresh** if your port doesn’t appear. Select it from the dropdown.

3. **Set baud rate**

   **115200** is typical for Grbl. Use the value your firmware expects.

4. **Select controller type**

   Choose **Grbl**, **Marlin**, **Smoothie**, or **TinyG** to match your controller.

5. **Test the connection (optional)**

   Click **Test Connection**. AxioCNC opens the port, checks communication, then closes it. If it fails, double‑check port, baud, power, and cable.

6. **Connect from the main UI**

   Leave Settings and use the **Connect** control in the main workspace (Setup or Monitor). When connected, the status reflects the controller state (e.g. Idle, Run, Hold).

## Connection options

- **Set DTR / Set RTS** — Leave on unless your board needs otherwise.
- **Use RTS/CTS flow control** — Enable only if your firmware and wiring support it.
- **Connect automatically** — Connects on startup when enabled.

## What good looks like

- Test Connection reports success.
- After **Connect**, status shows **Connected** and controller state (e.g. **Idle**).
- DRO and machine position update when you move axes (if homed).

## Troubleshooting

- **Port missing:** Reconnect USB, install driver, refresh the list. On Linux, check `dialout` and log out/in.
- **Test fails:** Wrong port, baud, or controller type; controller off or unplugged; port in use by another app.
- **Drops or errors:** Try a different USB port or cable; ensure baud rate matches firmware.

See [Connection issues](../troubleshooting/connection-issues) and [Serial port issues](../troubleshooting/serial-port-issues) for more.

## Next steps

- [Quick tour](./quick-tour)
- [Workflow overview](../workflow/overview)
- [Jogging](../machine-control/jogging) and [Setting home](../machine-control/setting-home)
