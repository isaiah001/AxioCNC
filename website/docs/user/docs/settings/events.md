---
sidebar_position: 12
title: Events
---

# Events Settings

**Settings → Events** configures **event handlers**: actions that run when something happens (e.g. job start, job end, tool change). Each handler can send G-code or other commands.

## Overview

- **Create** handlers for specific **events** and **triggers**.
- **Assign commands** (e.g. G-code) to run when the event fires.
- **Enable** or **disable** each handler without deleting it.

## Creating an event handler

Click **Add** (or **Add event**). Set:

- **Event** — What to react to (e.g. **Job start**, **Job end**, **Tool change**). Exact options depend on the UI.
- **Trigger** — Optional extra condition (e.g. only when a certain state is true).
- **Commands** — The G-code or commands to run (one per line or as a block).
- **Enabled** — **On** to activate, **Off** to leave it defined but inactive.

Save the handler.

## Editing an event handler

Open the handler from the list, change **Event**, **Trigger**, **Commands**, or **Enabled**, then save.

## Deleting an event handler

Use the delete control for that handler. It’s removed and will no longer run.

## Toggling enabled state

You can turn a handler **on** or **off** via its **Enabled** toggle without editing the rest. Use this to temporarily disable a handler.

## Next steps

- [Macros](./macros)
- [Starting a job](../jobs/starting-a-job)
- [Tool change](../workflow/monitor-screen) (M6)
