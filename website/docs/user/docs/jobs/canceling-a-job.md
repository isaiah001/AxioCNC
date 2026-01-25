---
sidebar_position: 5
title: Canceling a Job
---

# Canceling a Job

Use **Stop** to abort the current job. The run ends immediately; it does not continue from the same place. Use this only when you intend to cancel the run.

## What you’ll do

- Abort the running job with Stop
- Confirm in the dialog
- Understand that the job will not resume from that point

## When to use it

- Wrong part, wrong zero, or wrong file
- Tool or machine problem
- You need to halt the job and not continue

For a **temporary** pause (check part, clear chips, etc.), use **Feed Hold** and **Resume** instead. See [Pausing and resuming](./pausing-and-resuming).

## Steps

1. **Stop** — On the Monitor screen, click **Stop** (or equivalent).
2. **Confirm** — A confirmation dialog appears. Confirm that you want to abort.
3. **Result** — AxioCNC stops sending G-code. The controller stops motion. The job is ended.

## What happens when you cancel

- **Execution stops** — No further G-code is sent for that job.
- **Position** — The machine remains where it was when you stopped. You may need to retract, re-home, or re-zero before running again.
- **Spindle** — Typically you should turn off the spindle yourself if it’s still running.
- **State** — The controller may be in an alarm or hold state. Reset it if required before the next run.

## After canceling

- Move the machine to a safe position (e.g. retract Z, move off the part) if needed.
- Reset the controller if it’s in alarm.
- Fix whatever caused the abort (zero, file, fixture, tool).
- Reload the file, re-zero if necessary, and start a **new** run. You cannot “resume” a stopped job.

:::warning
Stop is final for that run. Always confirm you mean to abort before clicking.
:::

## Next steps

- [Pausing and resuming](./pausing-and-resuming)
- [Starting a job](./starting-a-job)
- [Monitor screen](../workflow/monitor-screen)
