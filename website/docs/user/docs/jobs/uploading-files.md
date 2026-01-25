---
sidebar_position: 1
title: Uploading Files
---

# Uploading G-code Files

Load G-code into AxioCNC via the file picker, drag-and-drop, or watch folders. Use this when you’re ready to run a job from the Setup or Monitor screen.

## What you’ll do

- Add a G-code file to the workspace
- Use drag-and-drop or the file picker
- Optionally use watch folders so new files appear automatically

## Supported formats

- **.nc**
- **.gcode**
- **.cnc**

Standard G-code from CAM software (Fusion 360, Carbide Create, VCarve, etc.) is supported.

## Steps

1. **Open the File panel** — On the Setup screen, use the **File** panel (or equivalent).
2. **Choose how to add the file:**
   - **File picker:** Click **Upload** or **Open**, then select a `.nc`, `.gcode`, or `.cnc` file.
   - **Drag-and-drop:** Drag a file from your file manager into the file / upload area.
3. **Confirm** — The file loads. The visualizer updates with the toolpath when parsing completes.

## Watch folders

If you use **Settings → General → Watch folders**:

- Add a **local** folder that contains your G-code files.
- New or updated files in that folder can appear in the file browser (depending on configuration).
- Use a display name to identify each watched folder.

Google Drive watch folders are planned for a future release.

## What good looks like

- The file appears in the file list.
- The 3D visualizer shows the toolpath.
- You can start the job (after connection, zeroing, etc.).

## Troubleshooting

- **File doesn’t load:** Check format (.nc, .gcode, .cnc) and that the file isn’t corrupted.
- **Toolpath empty or wrong:** The G-code may use unsupported commands or units. Check [G-code compatibility](../reference/g-code-compatibility).
- **Watch folder not updating:** Ensure the path is correct and AxioCNC has read access.

## Next steps

- [Visualizing the toolpath](./visualizing-toolpath)
- [Starting a job](./starting-a-job)
- [Watch folders](../settings/general-settings) (configure in Settings)
