---
sidebar_position: 2
title: G-code Compatibility
---

# G-code Compatibility

AxioCNC streams standard G-code to your controller. The **controller’s firmware** (Grbl, Marlin, etc.) decides which commands it supports.

## Supported file formats

- **.nc**
- **.gcode**
- **.cnc**

Use UTF-8 or ASCII. Standard G-code from CAM software is typical.

## Common G-code commands

Most CAM output uses a subset of **G** and **M** codes. Examples:

- **G0** / **G1** — Rapid / linear move
- **G2** / **G3** — Arc move
- **G17** / **G18** / **G19** — Plane selection (XY, XZ, YZ)
- **G20** / **G21** — Inch / mm
- **G28** — Return to machine zero
- **G54–G59** — Work offsets
- **G90** / **G91** — Absolute / incremental
- **M3** / **M4** / **M5** — Spindle on (CW/CCW) / off
- **M6** — Tool change (AxioCNC can pause for manual change and zeroing)
- **M8** / **M9** — Flood coolant on / off

Support depends on your **controller**, not AxioCNC. Unsupported codes can cause **error** or **alarm**.

## CAM software compatibility

AxioCNC works with G-code exported from:

- **Fusion 360**
- **Carbide Create**
- **VCarve** / **Aspire**
- **Estlcam**
- **FreeCAD**
- **Other** CAM that outputs standard G-code

Use **mm** or **inch** consistently. Match **Settings → Machine** (and controller) units to the G-code.

## Common issues

- **Unsupported G-code** — Controller reports **error** on a line. Check the console for the code. Remove or replace it in CAM, or use a controller that supports it.
- **Wrong units** — G-code in mm but machine in inch (or vice versa). Align CAM, machine config, and controller.
- **Huge numbers** — Some CAM tools output very large coordinates. Validate in the visualizer and fix in CAM if needed.
- **Line length** — Grbl has a line length limit. Split long lines or simplify the toolpath in CAM.
- **Comments** — Parentheses `( )` and semicolon `;` comments are usually stripped or ignored. Ensure no critical data is only in comments.

## Next steps

- [Supported controllers](./supported-controllers)
- [Visualizing the toolpath](../jobs/visualizing-toolpath)
- [Uploading files](../jobs/uploading-files)
