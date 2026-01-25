---
sidebar_position: 6
title: Zeroing Methods
---

# Zeroing Methods Settings

**Settings → Zeroing Methods** configures which zeroing tools and procedures are available (e.g. touch plate, BitZero, BitSetter) and their parameters.

## Overview

Zeroing methods are used to set **work zero** (and sometimes tool length). You pick a method when zeroing in Setup or at tool change. Methods are shown as **cards** in this section.

## Adding a method

Click **Add** (or **Add zeroing method**). Choose a type:

- **Manual** — Jog to a reference, then Set Zero. No extra hardware. One Manual method exists by default; you can’t add another.
- **Touch plate** — Conductive plate wired to the probe input. Typically Z (or XYZ). Set **plate thickness** (mm), **probe feedrate**, **probe distance**, and **require check** (safety prompt).
- **BitZero** — Probe-based XYZ zeroing from a reference.
- **BitSetter** — Tool-length / Z probe, often used at **tool change**.
- **Custom** — User-defined procedure.

## Configuring a method

For each method you can set:

- **Name** — Label (e.g. “Touch Plate”, “BitZero”).
- **Enabled** — When **on**, the method appears in zeroing workflows; when **off**, it’s hidden.
- **Axes** — Which axes it sets: X, Y, Z, or combinations (e.g. **Z** only for touch plate, **XYZ** for BitZero).

**Touch plate** also has:

- **Plate thickness** (mm)
- **Probe feedrate** (mm/min)
- **Probe distance** (mm)
- **Require check** — Show a confirmation before probing.

## Editing and deleting

- **Edit** — Open the method card’s edit view to change name, enabled, axes, and type-specific options.
- **Delete** — Remove the method. Manual cannot be deleted. If a **Zeroing Strategy** uses this method, you’ll need to pick another method there.

## Next steps

- [Zeroing Strategies](./zeroing-strategies)
- [Zeroing methods](../machine-control/zeroing-methods) (using them in the UI)
- [Zeroing the workpiece](../machine-control/zeroing-workpiece)
