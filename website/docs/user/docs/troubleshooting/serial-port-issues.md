---
sidebar_position: 2
title: Serial Port Issues
---

# Serial Port Issues

Use this page when the serial port is missing, access is denied, or the port disappears.

## Port not found

**Symptoms:** Your controller’s port doesn’t appear in **Settings → Connection**.

**Checks:**

1. **Connect and power** — Controller plugged in via USB and powered on.
2. **Drivers** — Install the USB‑serial driver for your board (e.g. CH340, CP2102, FTDI). manufacturer).
3. **Refresh** — Click **Refresh** in Connection settings. Unplug and replug the USB, then refresh again.
4. **OS-specific:**
   - **Windows:** **Device Manager → Ports (COM & LPT)**. Look for a new COM port when you plug in. Reinstall driver if it shows a yellow warning.
   - **Linux / Pi:** `ls -l /dev/ttyUSB* /dev/ttyACM*`. If nothing appears, check `dmesg` for USB attach errors.

## Permission denied

**Symptoms:** Port appears but connection fails with “access denied” or “permission denied”.

**Linux / Raspberry Pi:**

1. **dialout group:**  
   `sudo usermod -a -G dialout $USER`  
   Then **log out and log back in** (or reboot). Verify with `groups $USER`.
2. **Temporary fix (resets on reboot):**  
   `sudo chmod 666 /dev/ttyUSB0` (use your port name). Prefer fixing group membership instead.

**macOS:** Usually no extra step. If you see permission errors, check System Preferences → Security & Privacy → Privacy for any serial-access restrictions.

**Windows:** Run as a user with access to the port. Avoid “Run as administrator” unless required.

## Port already in use

**Symptoms:** “Port already in use” or “Cannot open port”.

**Fix:**

1. Close other apps using the port: other CNC software, serial monitors, Arduino IDE serial console, etc.
2. Disconnect and reconnect the USB cable, then try again.
3. Restart AxioCNC.
4. Reboot the computer if the port still appears stuck.

## Port disappears

**Symptoms:** Port works, then vanishes from the list or drops during use.

**Checks:**

- **USB** — Loose cable, bad port, or power issue. Try another cable/port.
- **Controller reset** — Some boards reset on connect. Give it a few seconds and refresh.
- **Power saving** — Disable USB selective suspend (Windows) or USB power management (Linux) for that port.
- **Linux:** `udev` rules can help keep the port name stable. See your distribution’s docs for USB‑serial.

## Next steps

- [Connection issues](./connection-issues)
- [Installation](../installation/overview) (e.g. Linux/Pi dialout)
