---
sidebar_position: 4
title: Common Errors
---

# Common Errors

Quick reference for frequent controller messages and how to fix them.

## Grbl error codes

Grbl reports errors as **error:X**. Common ones:

| Code | Meaning | What to do |
|------|---------|------------|
| **error:1** | Expected command letter | G-code syntax problem. Check the reported line. |
| **error:2** | Bad number format | Invalid number in G-code (e.g. missing decimal). Fix in CAM or the file. |
| **error:3** | Invalid statement | Unsupported or malformed command. Check [G-code compatibility](../reference/g-code-compatibility). |
| **error:4** | Value &lt; 0 | Negative value where none allowed. Fix the G-code. |
| **error:5** | Setting disabled | Homing cycle disabled. Send `$22=1` to enable (Grbl). |
| **error:6** | Minimum step pulse | Step pulse too short. Adjust Grbl `$0` if needed. |
| **error:7** | EEPROM read | EEPROM read failed. Reset Grbl settings or reflash. |
| **error:8** | Not idle | Command rejected (e.g. jog while running). Wait for Idle. |
| **error:9** | G-code lock | G-code lock (e.g. `$X`) is on. Send `$X` to unlock. |
| **error:10** | Homing not enabled | Homing required but disabled. Set `$22=1`. |
| **error:11** | Line overflow | Line too long. Shorten lines in G-code. |
| **error:15** | Homing fail | Homing didn’t complete. Check limit switches, wiring, and homing direction. |
| **error:20** | Unsupported command | Grbl doesn’t support that G/M code. Change CAM or strip the command. |
| **error:22** | Feed rate undefined | Motion command with no F. Add feed rate in CAM. |

Full list: [Grbl documentation](https://github.com/grbl/grbl/wiki).

## Other common messages

- **Alarm: hard limit** — Limit switch hit. Jog off, clear alarm, re-home if used, then re-zero.
- **Alarm: soft limit** — Motion exceeded configured travel. Check work zero and machine limits.
- **Alarm: abort** — E-stop or abort. Reset, then re-home/re-zero if needed.
- **Homing required** — Controller was reset and needs homing before motion. Run **Home All**.
- **Probe fail** — Probing (e.g. touch plate) didn’t trigger. Check wiring, plate connection, and probe input config.

## When to check firmware

- Persistent **error** or **alarm** that doesn’t match G-code or setup.
- Homing or limits never work despite correct wiring.
- Machine config (steps/mm, max rate) wrong and not fixable via `$` settings.

Update or reflash the controller firmware only if you’re sure and have a backup. Prefer fixing G-code, work zero, and AxioCNC settings first.

## Next steps

- [Connection issues](./connection-issues)
- [Serial port issues](./serial-port-issues)
- [Job execution issues](./job-execution-issues)
- [G-code compatibility](../reference/g-code-compatibility)
