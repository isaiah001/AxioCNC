---
sidebar_position: 3
title: Starting a Job
---

# Starting a Job

Start a G-code job from the Setup or Monitor screen after the file is loaded, the machine is connected, and work zero is set.

## What you’ll do

- Confirm the job is ready to run
- Start the job from Setup or Monitor
- Let AxioCNC switch to Monitor (if enabled) and begin execution

## Prerequisites

- **G-code loaded** — File uploaded and toolpath visible in the visualizer.
- **Controller connected** — **Settings → Connection** configured and **Connect** used.
- **Work zero set** — You’ve zeroed X, Y, Z (or the axes your job uses) at the intended origin.
- **Optional: Homed** — If your workflow uses homing, run **Home All** first. Grbl requires `$22=1` for homing. See [Setting home](../machine-control/setting-home).
- **Spindle/router** — Off during zeroing; you’ll typically turn it on via M3 in the G-code or manually as needed.

:::warning
Never start a job until you’ve verified position and work zero. Wrong zero can cause crashes or damaged parts.
:::

## Steps

1. **Complete Setup** — Upload file, check visualizer, jog to position, set work zero (and home if you use it).
2. **Go to Setup or Monitor** — You can start from either. If **Settings → Machine → Auto-switch to Monitor when jobs start** is on, starting from Setup will switch you to Monitor.
3. **Start** — Click **Start** (or the equivalent control). The job begins; the controller moves the machine according to the G-code.
4. **Watch** — Use the Monitor screen to follow progress, use **Feed Hold** to pause, **Resume** to continue, or **Stop** to abort.

## What happens when you start

- AxioCNC streams the G-code to the controller.
- The controller executes moves; position and progress update in the UI.
- If **Tool spinup delay** is enabled (Settings → Machine), AxioCNC waits the set number of seconds after start/resume before motion, so the spindle can reach speed.

## Tool changes (M6)

When the program hits an M6 tool change, execution pauses. You change the tool and, if configured, re-zero (e.g. Z with a touch plate). Then you resume. See **Settings → Zeroing Strategies → Mid-job tool change**.

## Next steps

- [Pausing and resuming](./pausing-and-resuming)
- [Canceling a job](./canceling-a-job)
- [Monitor screen](../workflow/monitor-screen)
