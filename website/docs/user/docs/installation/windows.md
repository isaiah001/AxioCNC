---
sidebar_position: 3
title: Windows
---

# Installing AxioCNC on Windows

Install AxioCNC using the Windows installer, then launch it from the Start menu.

## Prerequisites

- Windows 10 or 11 (x64)
- USB connection to your CNC controller

## Steps

1. **Download the installer**

   From [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases) or [axiocnc.com](https://axiocnc.com#download), download the Windows installer (e.g. `axiocnc Setup x.x.x.exe`).

2. **Run the installer**

   Double‑click the downloaded `.exe` and follow the wizard. You can accept the default install location.

3. **Launch AxioCNC**

   Open **Start → AxioCNC** (or search for “AxioCNC”). A browser window opens at `http://localhost:8000`.

## Finding Your COM Port

Before connecting to your machine:

1. Connect the controller via USB and ensure it’s powered on.
2. Open **Device Manager → Ports (COM & LPT)**.
3. Note the COM port (e.g. `COM3`, `COM4`).
4. In AxioCNC, go to **Settings → Connection**, choose that port, set baud rate (often **115200** for Grbl), and select your controller type.

## Troubleshooting

**COM port not listed**

- Reconnect the USB cable and check that the controller is on.
- Install any driver your board vendor provides (e.g. USB‑serial).
- Restart AxioCNC after connecting the controller.

**“Port already in use” or connection fails**

- Close other apps that might use the same COM port (other CNC software, serial terminals).
- Disconnect and reconnect the USB cable, then try again.

**Uninstall**

Use **Settings → Apps → AxioCNC → Uninstall**. See [Uninstall](./uninstall) for removing config data.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
