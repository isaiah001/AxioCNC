---
sidebar_position: 1
title: Supported Controllers
---

# Supported Controllers

AxioCNC works with controllers that run **Grbl**, **Marlin**, **Smoothie**, or **TinyG** / **g2core** firmware.

## Grbl

Widely used on Arduino-based CNC boards (e.g. many Chinese CNC kits). Serial typically at **115200** baud.

- Homing, limit switches, probe input.
- G54–G59 work offsets.
- `$` settings for steps/mm, max rates, etc.

## Marlin

Common on 3D printers and some CNC builds. Supports G-code, homing, and probes.

- Configurable via `Configuration.h` / platformio.
- Set correct **Controller type** in **Settings → Connection**.

## Smoothie

Runs on Smoothieboard and compatible hardware. G-code over serial.

- Powerful configuration; check Smoothie docs for serial and GPIO.

## TinyG / g2core

TinyG and g2core (successor) run on boards like the Carbide Motion controller. Multi-axis, JSON and G-code modes.

- AxioCNC uses G-code mode. Select **TinyG** (or **g2core** if listed) as controller type.

## Feature compatibility

| Feature | Grbl | Marlin | Smoothie | TinyG/g2core |
|---------|------|--------|----------|--------------|
| G-code streaming | ✓ | ✓ | ✓ | ✓ |
| Homing | ✓ | ✓ | ✓ | ✓ |
| Limit switches | ✓ | ✓ | ✓ | ✓ |
| Probe input | ✓ | ✓ | ✓ | ✓ |
| Work offsets (G54–G59) | ✓ | ✓ | ✓ | ✓ |
| Feed hold / resume | ✓ | ✓ | ✓ | ✓ |

Exact support depends on your firmware version and config. When in doubt, check the controller’s documentation.

## Next steps

- [Connecting to your machine](../getting-started/connecting-to-machine)
- [Connection settings](../settings/connection-settings)
- [G-code compatibility](./g-code-compatibility)
