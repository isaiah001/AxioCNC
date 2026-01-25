---
sidebar_position: 3
title: Monitor Screen
---

# Monitor Screen

The **Monitor** screen is where you run and watch a job: start, pause, resume, stop, and follow progress in real time.

## What you’ll do

- Start a job (or continue from Setup)
- Watch position, progress, and console
- Pause (Feed Hold) and resume when needed
- Stop the job if you must abort
- Handle tool changes (M6) when they occur

## When to use it

Use Monitor whenever a job is running. You can start from Setup and switch to Monitor automatically (if **Settings → Machine → Auto-switch to Monitor** is on), or open Monitor yourself.

## Main elements

| Element | Purpose |
|--------|---------|
| **Visualizer** | Toolpath and current position as the job runs |
| **Progress** | Progress bar and/or percentage |
| **Job controls** | Start, **Feed Hold**, **Resume**, **Stop** |
| **DRO / position** | Live machine and work coordinates |
| **Console** | Controller messages and G-code activity |
| **Tool change** | Prompts and zeroing when M6 is executed |
| **Camera** | Live feed when a camera is configured |

## Running a job

1. **Start** — Start the job from Monitor (or from Setup; you may be switched to Monitor automatically).
2. **Watch** — Use the visualizer, progress, and console to follow the run.
3. **Pause** — Use **Feed Hold** to pause. The machine stops motion but stays powered; you can jog if your firmware allows.
4. **Resume** — Use **Resume** to continue from the same place.
5. **Stop** — Use **Stop** to abort. You’ll get a confirmation. The job will not continue from the same place.

:::tip
Prefer **Feed Hold** when you only need to pause (e.g. check something). Use **Stop** only when you intend to abort the run.
:::

## Tool changes (M6)

When the G-code hits an M6 tool change:

- Execution pauses.
- You’re prompted to change the tool and (if configured) to re-zero (e.g. Z with a touch plate).
- After you finish, you resume and the job continues.

Tool change behavior depends on **Settings → Zeroing Strategies** (e.g. “Mid-job tool change”).

## Next steps

- [Starting a job](../jobs/starting-a-job), [Pausing and resuming](../jobs/pausing-and-resuming), [Canceling a job](../jobs/canceling-a-job)
- [Stats screen](./stats-screen)
