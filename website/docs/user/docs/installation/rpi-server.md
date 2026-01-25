---
sidebar_position: 6
title: Raspberry Pi Server
---

# Installing AxioCNC Server on Raspberry Pi

Use this guide for **headless** Raspberry Pi: no display or keyboard. The Pi runs only the AxioCNC server. You open the web UI from another device (PC, tablet, phone) on your network.

For a Pi **with** a desktop, use [Raspberry Pi](./rpi) instead.

## Quick Install

1. **Install the package**

   Download the server .deb for your Pi (ARMv7 or ARM64) from [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases), then:

   ```bash
   sudo dpkg -i axiocnc-server_*_arm64.deb   # or armv7l
   sudo apt-get install -f
   ```

2. **Run the server**

   ```bash
   axiocnc
   ```

   The server listens on `http://0.0.0.0:8000`. Access it from any device on your network:

   - `http://raspberrypi.local:8000`
   - `http://<pi-ip-address>:8000`

## What You Get

- **Command:** `axiocnc` (from any directory)
- **Port:** 8000, reachable from your network
- **Headless:** No GUI; use a browser on another device
- **Serial:** Installer adds your user to the `dialout` group

## Serial Port Access

Log out and log back in (or reboot) after install so `dialout` applies. Verify:

```bash
groups   # should include "dialout"
```

## Run as a Service (Auto-Start on Boot)

```bash
sudo systemctl enable axiocnc
sudo systemctl start axiocnc
sudo systemctl status axiocnc
sudo journalctl -u axiocnc -f   # view logs
```

## Command Options

```bash
axiocnc                          # default: port 8000, all interfaces
axiocnc --port 9000              # custom port
axiocnc --host 127.0.0.1         # localhost only
axiocnc --help                   # all options
```

## Troubleshooting

**Command not found**

- Check install: `dpkg -l | grep axiocnc-server`
- Try full path: `/usr/bin/axiocnc`

**Port already in use**

- `sudo lsof -i :8000`
- Run on another port: `axiocnc --port 8001`

**Serial port not accessible**

- `sudo usermod -a -G dialout $USER`
- Log out and back in

## Uninstall

```bash
sudo apt-get remove axiocnc-server
```

See [Uninstall](./uninstall) for config cleanup.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
