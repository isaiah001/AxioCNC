---
sidebar_position: 0
title: Introduction
---

# Welcome to AxioCNC

AxioCNC is a stability-focused G-code sender built around real CNC workflows. Control your machine from any device on your network.

## What is AxioCNC?

AxioCNC is a web-based interface for CNC controllers that prioritizes **stability and predictability** during long cutting jobs. Built on the proven cncjs server foundation, it brings a modern interface and workflow improvements designed to prevent costly mistakes and crashes.

**Workflow:** Design on your computer → upload G-code → **Setup** (position, zero, visualize) → **Monitor** (run and watch) → **Stats** (review past jobs).

## Key Features

- **Stability-first design** — Predictable behavior during long jobs
- **Spaced controls** — Reduces accidental taps (e.g. Z-down next to X+)
- **Network accessible** — Control from any device on your network
- **Light and dark themes** — Comfortable for long sessions
- **Native joystick support** — Smooth analog jogging with USB gamepads or web-based joystick
- **Tool library** — Human-readable tool names link your CAM to your machine
- **Touch plate and edge finder support** — Built-in zeroing workflows

## Supported Controllers

AxioCNC works with:

- **Grbl**
- **Marlin**
- **Smoothie**
- **TinyG / g2core**

If your controller runs one of these firmwares, it will work. See [Supported Controllers](./reference/supported-controllers) for details.

## System Requirements

- **Server:** Node.js 18+
- **Desktop app:** Linux (x64), Windows (x64), or macOS (Intel & Apple Silicon)
- **Headless:** Raspberry Pi (ARMv7, ARM64), Linux .deb, or Docker
- **Browser:** Modern browser (Chrome, Firefox, Safari, Edge) for the web UI

## Getting Started

1. **[Install AxioCNC](./installation/overview)** — Choose your platform
2. **[First use](./getting-started/first-use)** — Launch, connect, and understand the interface
3. **[Connect to your machine](./getting-started/connecting-to-machine)** — Serial port, baud rate, controller type
4. **[Workflow overview](./workflow/overview)** — Setup → Monitor → Stats

## Need Help?

- [GitHub Discussions](https://github.com/rsteckler/AxioCNC/discussions) — Q&A, ideas, general discussion
- [GitHub Issues](https://github.com/rsteckler/AxioCNC/issues) — Bug reports
- [axiocnc.com](https://axiocnc.com) — Website and downloads
