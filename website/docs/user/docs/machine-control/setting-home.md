---
sidebar_position: 2
title: Setting Home
---

# Setting Home

**Homing** sends the machine to a known position (home) using limit switches or similar sensors. Use it to establish machine coordinates before setting work zero or running a job, when your workflow requires it.

## What you’ll do

- Run **Home All** (or per-axis home if your firmware supports it)
- Let the machine move to the home position
- Use that reference for work zero and limits

## When to use it

- At the start of a session, if your workflow uses machine coordinates
- After a power cycle or reset, when the controller has lost position
- Before setting work zero, when you always home first

Not all machines support homing. If yours doesn’t have limit switches, skip homing and use only work zero.

## Steps

1. **Enable homing (Grbl)** — Grbl requires homing to be enabled. Send `$22=1` (or set it in Grbl config). If you skip this, **Home All** can report an error.
2. **Ensure clear travel** — The machine must be able to move to the limit switches. Clear obstructions and ensure the work area is safe.
3. **Home** — In the Setup screen (or wherever **Home All** is shown), click **Home All**. The machine moves to the home position; each axis typically moves until its limit is triggered.
4. **Confirm** — When homing completes, the controller reports the home position (often 0,0,0 or the configured home offsets). The UI may show “Homed” or similar.

## After homing

- Machine coordinates are established. You can set work zero (G54 or similar) from a known reference.
- **Go to Zero** (work zero) and other moves use this reference when applicable.

## Grbl: `$22=1`

For Grbl, `$22=1` enables the homing cycle. Without it, **Home All** may fail with “Setting disabled” or similar. Use the console or a macro to send `$22=1` if needed.

## Troubleshooting

- **Homing disabled** — Enable homing in firmware (e.g. `$22=1` for Grbl).
- **Axis doesn’t move or keeps moving** — Check limit switch wiring and configuration. Ensure the homing direction and feedrate are correct in firmware.
- **False triggers** — Noisy wiring or incorrect switch setup can cause bad homing. Check connections and grounding.

## Next steps

- [Zeroing the workpiece](./zeroing-workpiece)
- [Zeroing methods](./zeroing-methods)
- [Jogging](./jogging)
