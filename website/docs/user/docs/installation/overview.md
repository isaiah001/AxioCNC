---
sidebar_position: 1
title: Installation Overview
---

# Installation Overview

This page helps you choose the right way to install AxioCNC and points you to the correct guide.

## Installation Methods

| Method | Best for | Access |
|--------|----------|--------|
| **Linux Desktop** | Daily use on a Linux PC | [Linux](./linux) |
| **Windows Desktop** | Daily use on a Windows PC | [Windows](./windows) |
| **macOS Desktop** | Daily use on a Mac | [Mac](./mac) |
| **Raspberry Pi** | Dedicated machine in the shop | [Raspberry Pi](./rpi) |
| **Raspberry Pi Server** | Headless Pi (no display) | [Pi Server](./rpi-server) |
| **Docker** | Servers, CI, or consistent environments | [Docker](./docker) |

## Quick Comparison

- **Desktop installers** (Linux .deb, Windows .exe, Mac .dmg) — Easiest. Install and run. Use when AxioCNC runs on the same machine you use to control the CNC.
- **Raspberry Pi** — Use when you want a small, always-on machine in the shop. Choose **rpi** if you use a display; **rpi-server** if the Pi is headless.
- **Docker** — Use when you already run Docker, or want isolated, reproducible setups. Good for headless servers.

## Downloads

All installers and packages are on [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases). You can also [download from axiocnc.com](https://axiocnc.com#download).

## After Installation

1. **Run AxioCNC** — Desktop apps open a browser at `http://localhost:8000`. Headless/server: open that URL from any device on your network.
2. **Serial port access** — On Linux and Raspberry Pi, add your user to the `dialout` group, then log out and back in. See your platform guide.
3. **Configure connection** — Go to **Settings → Connection**. Set port, baud rate (often 115200 for Grbl), and controller type.

## Next Steps

- [First use](../getting-started/first-use) — Launch and quick tour
- [Connecting to your machine](../getting-started/connecting-to-machine) — Port, baud, controller
