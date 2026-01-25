---
sidebar_position: 2
title: Setup Screen
---

# Setup Screen

The **Setup** screen is where you prepare a job before cutting: load G-code, check the toolpath, position the workpiece, and set work zero.

## What you’ll do

- Upload or select a G-code file
- View the toolpath in the 3D visualizer
- Jog the machine to position the workpiece
- Set work zero (and optionally home)
- Confirm everything before starting

## When to use it

Use Setup whenever you:

- Load a new G-code file
- Change workpiece or fixture
- Need to re-zero (e.g. after a tool change or repositioning)

## Main panels

| Panel | Purpose |
|-------|---------|
| **File** | Upload, pick, or (with watch folders) use files from a folder |
| **Visualizer** | 3D toolpath, workpiece outline, zero markers; rotate/zoom to inspect |
| **Jog** | Step jog buttons and/or analog joystick for X, Y, Z |
| **Probe / Zeroing** | Touch plate, edge finder, manual zero, etc. |
| **DRO** | Machine and work coordinates |
| **Tools** | Tool list; used during tool changes |
| **Camera** | Live camera feed when configured |

## Basic workflow on Setup

1. **Upload G-code** — Use the file panel. Supported formats: `.nc`, `.gcode`, `.cnc`.
2. **Check the visualizer** — Confirm the toolpath looks right and fits your stock. See [Visualizing the toolpath](../jobs/visualizing-toolpath).
3. **Connect** — Ensure the controller is connected (Settings → Connection).
4. **Jog** — Move to your starting position. Use slow steps when close to the workpiece. See [Jogging](../machine-control/jogging).
5. **Set zero** — Use your chosen zeroing method (manual, touch plate, etc.). See [Zeroing the workpiece](../machine-control/zeroing-workpiece) and [Zeroing methods](../machine-control/zeroing-methods).
6. **Optional: Home** — If your machine supports homing, use **Home All** before zeroing when that’s your workflow. See [Setting home](../machine-control/setting-home).
7. **Start the job** — Use **Start**. You can stay on Setup or switch to Monitor (if auto-switch is enabled in Settings → Machine).

:::warning
Always verify position and zero before starting. A wrong zero can cause crashes or scrap parts.
:::

## Next steps

- [Uploading files](../jobs/uploading-files) and [Visualizing the toolpath](../jobs/visualizing-toolpath)
- [Jogging](../machine-control/jogging), [Setting home](../machine-control/setting-home), [Zeroing](../machine-control/zeroing-workpiece)
- [Monitor screen](./monitor-screen)
