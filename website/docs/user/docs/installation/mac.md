---
sidebar_position: 4
title: macOS
---

# Installing AxioCNC on macOS

Install AxioCNC from the .dmg package on Intel or Apple Silicon Macs.

## Prerequisites

- macOS 10.15 or later
- Intel or Apple Silicon
- USB connection to your CNC controller

## Steps

1. **Download the .dmg**

   From [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases) or [axiocnc.com](https://axiocnc.com#download), download the macOS `.dmg` (universal or architecture‑specific).

2. **Install**

   Open the .dmg, drag AxioCNC to **Applications**, and eject the disk image.

3. **First launch**

   Open AxioCNC from **Applications**. If macOS blocks it as “from an unidentified developer,” go to **System Preferences → Security & Privacy → General** and choose **Open Anyway** for AxioCNC.

4. **Run**

   AxioCNC starts the server and opens a browser at `http://localhost:8000`.

## Serial Port Access

macOS usually exposes USB‑serial devices as `/dev/cu.usbserial-*` or `/dev/cu.usbmodem*`. In **Settings → Connection**, pick the port that matches your controller. Use baud rate **115200** for Grbl unless your firmware specifies otherwise.

## Troubleshooting

**No serial ports listed**

- Connect the controller via USB and power it on.
- Install the USB‑serial driver from your board’s vendor if required.
- Restart AxioCNC after connecting.

**Port 8000 in use**

Run from Terminal with a different port (if supported by the app), or quit other apps using port 8000.

**Uninstall**

Drag AxioCNC from **Applications** to Trash. See [Uninstall](./uninstall) for config cleanup.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
