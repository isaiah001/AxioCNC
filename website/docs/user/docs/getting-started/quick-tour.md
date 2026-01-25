---
sidebar_position: 3
title: Quick Tour
---

# Quick Tour

A short overview of the AxioCNC UI: main screens, key elements, and where to find common actions.

## Main screens

Three tabs at the top:

| Tab | Purpose |
|-----|---------|
| **Setup** | Load G-code, visualize toolpath, jog, zero, prepare the job |
| **Monitor** | Run the job, watch progress, pause/resume/stop, console, camera |
| **Stats** | Job history, statistics, tool usage |

You typically **Setup** → run from **Monitor** → review in **Stats**.

## Setup screen

- **File** — Upload or pick G-code; use watch folders if configured.
- **Visualizer** — 3D toolpath and workpiece; rotate/zoom to inspect.
- **Jog** — Step jog buttons and/or analog joystick (if enabled) for X, Y, Z.
- **Probe / zeroing** — Touch plate, edge finder, manual zero, etc.
- **DRO** — Machine and work position.
- **Tools** — Tool list; tool change and zeroing during a job.
- **Camera** — Live feed when a camera is configured.

## Monitor screen

- **Visualizer** — Toolpath and current position as the job runs.
- **Progress** — Bar and/or percentage.
- **Job controls** — Start, **Feed Hold** (pause), **Resume**, **Stop**.
- **Console** — Controller messages and G-code activity.
- **Tool change** — Prompts and zeroing when M6 is used.
- **Camera** — Same feed as Setup, if configured.

## Stats screen

- **Job history** — Past jobs, duration, result.
- **Statistics** — Aggregate runtime, job counts, etc.
- **Tool usage** — Per‑tool use across jobs.

## Common actions

| Goal | Where |
|------|--------|
| Change port, baud, controller | **Settings → Connection** |
| Machine limits, presets, homing corner | **Settings → Machine** |
| Joystick/gamepad | **Settings → Joystick** |
| Theme, accent | **Settings → Appearance** |
| Macros, events, tools, cameras | **Settings** (respective sections) |
| Connect / disconnect | Main UI **Connect** control |
| Jog | **Setup** — Jog panel or joystick |
| Set work zero | **Setup** — Zeroing / probe |
| Start job | **Setup** or **Monitor** — Start |
| Pause / resume | **Monitor** — Feed Hold / Resume |
| Stop job | **Monitor** — Stop |

## Next steps

- [Workflow overview](../workflow/overview)
- [Setup screen](../workflow/setup-screen) and [Monitor screen](../workflow/monitor-screen)
