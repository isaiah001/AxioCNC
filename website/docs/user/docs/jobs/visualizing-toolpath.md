---
sidebar_position: 2
title: Visualizing the Toolpath
---

# Visualizing the Toolpath

The 3D visualizer shows the loaded G-code as a toolpath. Use it to check that the job looks correct before you run it.

## What you’ll do

- View the toolpath in 3D
- Rotate and zoom to inspect details
- Spot potential issues (toolpath outside stock, odd moves, etc.)
- Use workpiece outline and zero markers when shown

## When to use it

Use the visualizer:

- After uploading a file, before starting the job
- When changing work zero or fixture
- Occasionally during a run (on the Monitor screen) to see progress

## Understanding the view

- **Toolpath** — Lines (and arcs) representing tool motion. Color often indicates rapid vs feed moves.
- **Workpiece** — Outline of the stock when machine limits (or job bounds) are defined in **Settings → Machine**.
- **Zero / origin** — Markers for work zero (and sometimes machine zero) when available.

## Basic controls

- **Rotate** — Drag to rotate the view.
- **Zoom** — Scroll or pinch to zoom in and out.
- **Pan** — Use the controls provided (e.g. shift+drag or a pan button) if available.

Exact gestures depend on the UI.

## What to check

1. **Fit and direction** — Toolpath stays within your workpiece and machine limits. Motion direction matches what you expect.
2. **Rapid vs feed** — Rapids clear the part; feed moves match your cutting strategy.
3. **Z moves** — Plunges and retracts look safe; no unexpected deep plunges into the stock.
4. **Zero** — Origin matches where you’ll set work zero on the machine.

:::tip
If the toolpath looks wrong, fix it in CAM and re-export. Don’t run questionable G-code on the machine.
:::

## Next steps

- [Uploading files](./uploading-files)
- [Starting a job](./starting-a-job)
- [Zeroing the workpiece](../machine-control/zeroing-workpiece)
