---
sidebar_position: 4
title: Connection
---

# Connection Settings

**Settings → Connection** configures how AxioCNC talks to your CNC controller over the serial port.

## Port

**Port** — Serial port for the controller.

- **Linux / Pi:** e.g. `/dev/ttyUSB0`, `/dev/ttyACM0`. Use **Refresh** to rescan.
- **Windows:** e.g. `COM3`, `COM4`.
- **macOS:** e.g. `/dev/cu.usbserial-*`, `/dev/cu.usbmodem*`.

If the port is missing, connect the controller, install drivers if needed, and click **Refresh**. On Linux/Pi, ensure your user is in the `dialout` group.

## Baud rate

**Baud rate** — Communication speed. **115200** is common for Grbl. Use the value your firmware expects (e.g. 9600, 115200, 250000).

## Controller type

**Controller type** — **Grbl**, **Marlin**, **Smoothie**, or **TinyG** / **g2core**. Must match your board’s firmware.

## Serial line controls

- **Set DTR line status upon opening** — Usually **on**. Turn off only if your board requires it.
- **Set RTS line status upon opening** — Usually **on**. Turn off only if your board requires it.
- **Use RTS/CTS flow control** — **Off** unless your controller and wiring use hardware flow control.

## Connect automatically

**Connect automatically** — When **on**, AxioCNC connects to the selected port on startup. When **off**, you connect manually from the main UI.

## Test connection

**Test connection** — Opens the port, checks communication, then closes it. Use this to verify port, baud, and controller type before connecting for real. The result (success or error message) is shown next to the button.

## Next steps

- [Connecting to your machine](../getting-started/connecting-to-machine)
- [Machine](./machine-settings)
- [Connection issues](../troubleshooting/connection-issues)
