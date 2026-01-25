---
sidebar_position: 8
title: Uninstall
---

# Uninstalling AxioCNC

How to remove AxioCNC and, optionally, your config and data.

## Linux (.deb)

**Desktop package:**

```bash
sudo apt-get remove axiocnc
# or
sudo dpkg -r axiocnc
```

**Server package (e.g. Pi headless):**

```bash
sudo apt-get remove axiocnc-server
```

**Remove systemd service (if you enabled it):**

```bash
sudo systemctl stop axiocnc
sudo systemctl disable axiocnc
sudo rm -f /etc/systemd/system/axiocnc.service
sudo systemctl daemon-reload
```

## Windows

Use **Settings → Apps → Installed apps**, find **AxioCNC**, and choose **Uninstall**.

## macOS

Drag **AxioCNC** from **Applications** to **Trash**.

## Docker

```bash
docker stop axiocnc
docker rm axiocnc
```

To remove the image: `docker rmi ghcr.io/rsteckler/axiocnc:latest`

## Removing Config and Data

Config and data are stored in a user directory. Removing them resets AxioCNC to a clean state (you will lose settings, macros, tools, watch folders, etc.).

**Linux / Raspberry Pi / macOS (if applicable):**

```bash
rm -rf ~/.axiocnc
```

**Windows:** Delete the `%USERPROFILE%\.axiocnc` folder (or the path shown in AxioCNC docs for your install).

**Docker:** If you used `-v ~/.axiocnc:/root/.axiocnc`, remove `~/.axiocnc` on the host to clear persisted data.

:::tip
Before deleting config, you can **Export** from **Settings → General** to keep a backup.
:::
