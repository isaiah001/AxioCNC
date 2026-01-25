---
sidebar_position: 4
title: Pausing and Resuming
---

# Pausing and Resuming a Job

Use **Feed Hold** to pause a running job and **Resume** to continue from the same place. Use this when you need to check something, clear chips, or adjust without aborting the run.

## What you’ll do

- Pause the job with Feed Hold
- Optional: jog or inspect (if your firmware allows)
- Resume and continue from where you paused

## When to use it

- Quick check (part, clamps, tool)
- Clearing chips or coolant
- Brief pause without losing position in the program

Use **Stop** only when you want to **abort** the job. See [Canceling a job](./canceling-a-job).

## Steps

1. **Pause** — Click **Feed Hold** (or equivalent) on the Monitor screen. The machine stops motion. The controller remains in a hold state; position is kept.
2. **Do what you need** — Inspect, clear chips, etc. Depending on firmware, you may be able to jog (often in a limited way). Don’t run the spindle into the part.
3. **Resume** — Click **Resume**. Execution continues from the same block; no re-zero needed unless you moved the workpiece or changed the tool.

## What happens during pause

- Motion stops.
- The controller holds the last position and waits.
- AxioCNC keeps the job “paused”; it does not send new motion until you Resume.
- Spindle state depends on your G-code and controller (often remains as before Hold).

## Position tracking

While in Feed Hold, the controller tracks position. When you **Resume**, it continues from the next command. You do **not** normally need to re-zero unless you physically changed something (workpiece, tool, fixture).

:::tip
If you had to move the machine manually (e.g. during an emergency), do **not** resume without understanding your controller’s state. You may need to reset, re-home, and re-zero, then restart the job from a safe place.
:::

## Next steps

- [Canceling a job](./canceling-a-job)
- [Monitor screen](../workflow/monitor-screen)
