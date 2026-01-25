---
sidebar_position: 1
title: Connection Issues
---

# Connection Issues

Use this page when AxioCNC won’t connect to your CNC controller, or the connection drops.

## Cannot connect to machine

**Symptoms:** Test Connection fails, or Connect never succeeds.

**Checks:**

1. **Port** — Correct port selected in **Settings → Connection**? On Windows, check **Device Manager → Ports**. On Linux/Pi, `ls /dev/ttyUSB* /dev/ttyACM*`. Use **Refresh** in settings.
2. **Baud rate** — Matches the controller (often **115200** for Grbl)? Wrong baud can cause immediate failure or garbage.
3. **Controller type** — **Grbl**, **Marlin**, **Smoothie**, or **TinyG** must match your firmware.
4. **Power and cable** — Controller powered on? USB cable firmly connected? Try another cable or USB port.
5. **Port in use** — Close other apps (other CNC software, serial terminals) that might have the port open. Restart AxioCNC if needed.
6. **Linux/Pi:** User in **dialout** group? Run `groups $USER`. Add with `sudo usermod -a -G dialout $USER`, then **log out and back in**.

## Connection drops

**Symptoms:** Connects, then disconnects after a while or during a job.

**Checks:**

- **USB** — Loose cable, bad port, or power-saving. Try a different port or cable. Disable USB power saving on the host if possible.
- **Baud / buffer** — High feed rates and long lines can overrun the serial buffer. Try 115200 if you’re higher, or simplify/slow the G-code.
- **Electrical noise** — Route USB away from motors and power. Use a ferrite or hub if available.

## Wrong controller type

**Symptoms:** G-code errors, weird behavior, or no response.

**Fix:** Set **Settings → Connection → Controller type** to match your firmware (**Grbl**, **Marlin**, **Smoothie**, **TinyG**). Restart the connection.

## Baud rate mismatch

**Symptoms:** Connect seems to work but you get garbage in the console, or the controller doesn’t respond.

**Fix:** Set baud in **Settings → Connection** to exactly what the controller uses (e.g. 115200 for Grbl). Check the controller’s config (e.g. Grbl `$` settings) or manual.

## Next steps

- [Serial port issues](./serial-port-issues)
- [Connecting to your machine](../getting-started/connecting-to-machine)
- [Connection settings](../settings/connection-settings)
