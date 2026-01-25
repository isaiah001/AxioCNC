---
sidebar_position: 11
title: Macros
---

# Macros Settings

**Settings → Macros** defines **macros**: short G-code scripts you can run from the UI (e.g. preflight checks, homing, or custom sequences).

## Overview

- **Create** macros with a name, description, and G-code content.
- **Run** them from the UI when needed.
- **Edit** or **delete** existing macros.

A **Preflight check** macro is often provided by default (e.g. home, test axes, spin spindle briefly).

## Creating a macro

Click **Add** (or **Add macro**). Fill in:

- **Name** — e.g. “Preflight check”, “Home and move to safe”.
- **Description** — What it does (optional but helpful).
- **Content** — The G-code. One command per line. You can use `$H` for homing, `G0`/`G1` for moves, `M3`/`M5` for spindle, etc.

Save the macro.

## Editing a macro

Open the macro from the list, change **Name**, **Description**, or **Content**, then save.

## Deleting a macro

Use the delete control for that macro. It’s removed from the list and can’t be run anymore.

## Running macros

Macros are run from the main UI (e.g. a **Macros** panel or similar). Select the macro and run it. Ensure the controller is connected and the machine is in a safe state.

## Preflight check (default)

The default **Preflight check** macro typically homes, moves to a safe position, tests each axis, and briefly runs the spindle. Use it to verify the machine after connecting. You can edit or remove it.

## Next steps

- [Events](./events)
- [Setting home](../machine-control/setting-home)
- [Connecting to your machine](../getting-started/connecting-to-machine)
