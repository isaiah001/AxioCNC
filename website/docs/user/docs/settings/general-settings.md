---
sidebar_position: 2
title: General
---

# General Settings

**Settings → General** covers language, watch folders, and settings backup (import, export, reset).

## Language

**Language** — Choose the UI language. Affects menus, labels, and messages.

## Watch folders

Watch folders are directories AxioCNC monitors for G-code files. Files added there can show up in the file browser.

- **Add Watch Folder** — Click to add one. Choose **Local** (folder on disk) or **Google Drive** (planned). Enter the **folder path** and an optional **display name**.
- **Remove** — Use the remove control next to a folder to stop watching it. Files on disk are not deleted.

**Folder path** — Full path to the directory (e.g. `/home/user/gcode-files` on Linux, `C:\Users\You\Gcode` on Windows).

**Display name** — Optional label for the folder in the UI.

Google Drive watch folders are not yet implemented.

## Settings backup

- **Import** — Load a previously exported settings file (JSON). Replaces current settings, macros, events, tools, cameras, watch folders. You’ll confirm before apply. Re-enter camera passwords after import.
- **Export** — Save all settings (and related data) to a JSON file. Use this before **Reset** or before **Import** if you want a backup.
- **Reset to Defaults** — Restore factory defaults. Type **reset** when prompted to confirm. Consider **Export** first.

## Next steps

- [Connection](./connection-settings)
- [Appearance](./appearance-settings)
