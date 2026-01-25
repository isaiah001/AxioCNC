---
sidebar_position: 3
title: Job Execution Issues
---

# Job Execution Issues

Use this page when a job won’t start, stops unexpectedly, or you see position or feed-rate problems.

## Job won’t start

**Symptoms:** Start does nothing, or you get an error before motion.

**Checks:**

1. **Connected** — Controller connected? Check connection status in the UI.
2. **Not idle** — Controller must be **Idle** (not Hold, Alarm, etc.). Reset or clear any alarm first.
3. **File loaded** — G-code file loaded and visualizer shows a toolpath?
4. **Work zero** — Work zero set for the axes your job uses? Unset zero can block start or cause undefined behavior.
5. **Homing** — If your workflow requires homing, run **Home All** first. Grbl: homing enabled (`$22=1`).
6. **Spindle/router** — If the job expects the spindle on, ensure it’s ready (or that you’re not blocked by a “spindle not running” check, if any).

## Job stops unexpectedly

**Symptoms:** Job runs then stops partway; controller may be in Hold or Alarm.

**Checks:**

- **Console** — Read the console for **error**, **alarm**, or **limit** messages. Grbl errors often include a code (e.g. **Limit**).
- **Limit switch** — Hitting a limit stops the job. Jog off the limit, clear the alarm, re-home if you use homing, then re-zero and restart from a safe place.
- **Overheating / stall** — Motor or driver overheating can trigger a fault. Let it cool, check wiring and current, then retry.
- **G-code** — Odd or unsupported commands can cause a stop. Check the line number in the console and inspect the G-code around it. See [G-code compatibility](../reference/g-code-compatibility).

## Position errors

**Symptoms:** “Position lost”, “Homing required”, or clearly wrong positions.

**Checks:**

- **Homing** — If the controller requires homing after reset, run **Home All** and ensure it completes.
- **Work zero** — Correctly set for this job? Wrong zero causes wrong placement.
- **Units** — G-code in mm vs inch must match machine/config. Check CAM output and controller `$` settings.
- **Steps per mm** — Controller firmware (e.g. Grbl `$100`–`$102`) must match your machine. Wrong values cause wrong distances.

## Feed rate issues

**Symptoms:** Moves too fast, too slow, or feed override has no effect.

**Checks:**

- **G-code F values** — CAM sets feed rates. Check the G-code for `F` and that it’s in the expected units (mm/min or inch/min).
- **Controller feed override** — Some controllers support override. Ensure it’s not at 0% or 200% if you see unexpected speed.
- **Max feed in firmware** — Controller has max rate limits. Exceeding them can cap or fault.

## Next steps

- [Common errors](./common-errors)
- [Starting a job](../jobs/starting-a-job)
- [G-code compatibility](../reference/g-code-compatibility)
