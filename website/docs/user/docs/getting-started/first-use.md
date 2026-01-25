---
sidebar_position: 1
title: First Use
---

# First Use

Get AxioCNC running, open the web interface, and learn where the main screens are.

## What you’ll do

- Launch AxioCNC
- Open the web UI
- See the three main screens: **Setup**, **Monitor**, **Stats**
- Know where to go next

## Prerequisites

- AxioCNC installed ([Installation](../installation/overview))
- CNC controller connected via USB (optional for a first look)

## Steps

1. **Start AxioCNC**

   - **Desktop (Linux / Windows / Mac):** Run the AxioCNC app. It starts the server and opens a browser.
   - **Raspberry Pi / headless:** Run `axiocnc` (or use the systemd service). On another device, open the URL below.

2. **Open the web interface**

   Go to **`http://localhost:8000`** (or `http://<server-ip>:8000` when using a remote server).

   The app loads the React frontend. You’ll see the main workspace with a **Setup** tab selected by default.

3. **Check the three main screens**

   Use the top tabs to switch between:

   - **Setup** — Load G-code, visualize the toolpath, jog, set work zero, prepare the job.
   - **Monitor** — Run the job, watch progress, pause/resume/stop, view console and (if configured) camera.
   - **Stats** — View job history, run statistics, and tool usage.

4. **Connect (when ready)**

   If your controller is connected, go to **Settings** (gear icon) → **Connection**. Choose the serial port, baud rate (often **115200** for Grbl), and controller type, then connect from the main UI. See [Connecting to your machine](./connecting-to-machine).

## What good looks like

- Browser shows the AxioCNC UI (Setup by default).
- Tabs **Setup | Monitor | Stats** are visible.
- **Settings** is available via the gear icon.
- If you connect, the connection status updates when the link to the controller is established.

## Next steps

- [Connecting to your machine](./connecting-to-machine) — Port, baud rate, controller
- [Quick tour](./quick-tour) — UI overview and where to find actions
- [Workflow overview](../workflow/overview) — Setup → Monitor → Stats
