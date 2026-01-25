---
sidebar_position: 1
title: Jogging
---

# Jogging the Machine

Jogging moves the machine manually from the AxioCNC UI. Use it to position the workpiece, set zero, or approach a spot before starting a job.

## What you’ll do

- Move X, Y, and Z with step buttons or an analog joystick
- Use the web-based joystick or a USB gamepad (when configured)
- Jog safely by using appropriate speeds and keeping clear of the workpiece when unsure

## When to use it

- Positioning for zeroing (touch plate, edge finder, manual)
- Moving to a safe position before or after a job
- Inspecting or setting up the fixture

:::warning
Jog with care. Use slow steps near the workpiece or when closing in on a reference. Ensure the spindle is off when jogging near the part.
:::

## Step jogging

On the **Setup** screen, the **Jog** panel has buttons for each axis and direction (e.g. X+, X−, Y+, Y−, Z+, Z−). Click to move one step; hold to repeat. Step size and speed are often configurable. Use smaller steps when positioning precisely.

## Analog joystick (USB gamepad)

1. Plug in a USB gamepad or joystick.
2. Go to **Settings → Joystick**. Enable gamepad support, choose **Server** or **Client**, and select your device.
3. Map the sticks (e.g. left stick XY → jog X/Y, right stick Y → jog Z). Set **Deadzone** and **Sensitivity** as needed.
4. On the Setup screen, use the sticks for continuous jogging. Buttons can map to actions (e.g. Home, Set Zero, Feed Hold).

See [Joystick settings](../settings/joystick-settings) for details.

## Web-based joystick

The Setup screen can show an on-screen joystick. Drag it to jog X/Y (and sometimes Z) without a physical gamepad. Handy on tablets or when no USB joystick is connected.

## Jog speed

- **Step jog:** Use the step increment and speed options in the Jog panel (if available). Prefer slow steps when close to the workpiece.
- **Analog:** **Settings → Joystick** has **Max XY Jog Speed** and **Max Z Jog Speed** (e.g. mm/min). Use lower Z speed for safer vertical moves.

## Safety

- Use slow steps or low analog speed when approaching the part or a reference.
- Keep hands clear of moving axes.
- Don’t jog with the spindle on into the workpiece.
- Ensure work zero and machine limits are set correctly before running a job.

## Next steps

- [Setting home](./setting-home)
- [Zeroing the workpiece](./zeroing-workpiece)
- [Joystick settings](../settings/joystick-settings)
