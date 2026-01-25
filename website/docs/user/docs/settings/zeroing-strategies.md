---
sidebar_position: 7
title: Zeroing Strategies
---

# Zeroing Strategies Settings

**Settings → Zeroing Strategies** chooses **which** zeroing method to use for **initial job setup**, **mid-job tool change**, and **after pause**.

## Initial job setup

**Initial job setup** — Used when you first set up a job (before running).

Options:

- **Ask each time** — Prompt you to pick a method whenever you start a new setup.
- **Skip** — No zeroing step.
- **A specific method** — Always use that method (e.g. Manual, Touch Plate, BitZero). Only **enabled** methods from **Zeroing Methods** are listed.

## Mid-job tool change

**Mid-job tool change** — Used when the program hits **M6** (tool change).

Options:

- **Ask each time** — Prompt you to pick a method at each tool change.
- **Skip** — No zeroing. M6 is passed through to the controller. Use only if you have fully automated tool changes; otherwise skipping can cause position errors.
- **A specific method** — Always use that method (e.g. Touch Plate or BitSetter for Z).

:::warning
**Skip** at tool change means AxioCNC won’t pause for you to change the tool or re-zero. Only use with automated tool changers.
:::

## After pause

**After pause** — Used when you **Resume** after **Feed Hold**.

Options:

- **Ask each time** — Prompt to choose a method (or skip) when resuming.
- **Skip** — No zeroing after pause. Usually fine if you didn’t move the workpiece or change the tool.
- **A specific method** — Always run that method after resume.

## Tips

- **Initial setup:** Often a full XYZ method (BitZero, manual) or XYZ + touch plate.
- **Tool change:** Often Z-only (touch plate, BitSetter) to set the new tool’s length.
- **After pause:** Often **Skip** unless you changed something.

## Next steps

- [Zeroing Methods](./zeroing-methods)
- [Zeroing methods](../machine-control/zeroing-methods)
