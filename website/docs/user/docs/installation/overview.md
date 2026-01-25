---
sidebar_position: 1
title: Installation Overview
---

# Installation Overview

This page helps you choose the right way to install AxioCNC and points you to the correct guide.

## Installation Methods

### Headless

| Method | Best for | Access |
|--------|----------|--------|
| **Docker** | Servers, CI, or consistent environments | [Docker](./docker) |
| **Raspberry Pi Server** | Headless Pi (no display) | [Pi Server](./rpi-server) |
| **Linux Headless** | Headless Linux server | [Linux Headless](./linux-headless) |

### Desktop Apps

| Method | Best for | Access |
|--------|----------|--------|
| **Windows Desktop** | Daily use on a Windows PC | [Windows](./windows) |
| **macOS Desktop** | Daily use on a Mac | [Mac](./mac) |
| **Linux Desktop** | Daily use on a Linux PC | [Linux](./linux) |
| **Raspberry Pi** | Dedicated machine in the shop | [Raspberry Pi](./rpi) |

## Quick Comparison

### Headless Installations
- **Docker** — Use when you already run Docker, or want isolated, reproducible setups. Good for headless servers.
- **Raspberry Pi Server** — Use when you want a small, always-on headless machine in the shop (no display).
- **Linux Headless** — Use when you want to run AxioCNC on a headless Linux server.

### Desktop Installations
- **Desktop installers** (Windows .exe, Mac .dmg, Linux .deb) — Easiest. Install and run. Use when AxioCNC runs on the same machine you use to control the CNC.
- **Raspberry Pi** — Use when you want a small, always-on machine in the shop with a display.

## Downloads

All installers and packages are on [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases). You can also [download from axiocnc.com](https://axiocnc.com#download).

## After Installation

1. **Run AxioCNC** — Desktop apps open a browser at `http://localhost:8000`. Headless/server: open that URL from any device on your network.
2. **Serial port access** — On Linux and Raspberry Pi, add your user to the `dialout` group, then log out and back in. See your platform guide.
3. **Configure connection** — Go to **Settings → Connection**. Set port, baud rate (often 115200 for Grbl), and controller type.

## Next Steps

- [First use](../getting-started/first-use) — Launch and quick tour
- [Connecting to your machine](../getting-started/connecting-to-machine) — Port, baud, controller
