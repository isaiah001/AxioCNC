---
sidebar_position: 3
title: Linux Headless
---

# Installing AxioCNC Server on Linux

Use this guide for **headless** Linux servers: no display or desktop environment. The server runs only AxioCNC. You open the web UI from another device (PC, tablet, phone) on your network.

For Linux **with** a desktop, use [Linux Desktop](./linux) instead.

## Quick Install

1. **Download and install the package**

   ```bash
   curl -L -o axiocnc-headless_0.0.88_amd64.deb https://github.com/rsteckler/AxioCNC/releases/download/v0.0.88/axiocnc-headless_0.0.88_amd64.deb
   sudo dpkg -i axiocnc-headless_0.0.88_amd64.deb
   sudo apt-get install -f
   ```

2. **Run the server**

   ```bash
   axiocnc
   ```

   The server listens on `http://0.0.0.0:8000`. Access it from any device on your network:

   - `http://<server-hostname>:8000`
   - `http://<server-ip-address>:8000`

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
