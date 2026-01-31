---
sidebar_position: 2
title: Linux
---

# Installing AxioCNC on Linux

Install the .deb package on Debian/Ubuntu (x64), then run AxioCNC from the command line or your app launcher.

## Prerequisites

- Debian or Ubuntu (x64)
- Node.js 18+ (usually satisfied by the package)

## Steps

1. **Download and install the package**

   ```bash
   curl -L -o axiocnc-desktop_0.0.88_amd64.deb https://github.com/rsteckler/AxioCNC/releases/download/v0.0.88/axiocnc-desktop_0.0.88_amd64.deb
   sudo dpkg -i axiocnc-desktop_0.0.88_amd64.deb
   sudo apt-get install -f   # if dependencies are missing
   ```

3. **Add your user to the `dialout` group** (for serial port access)

   ```bash
   sudo usermod -a -G dialout $USER
   ```

   Log out and back in (or reboot) for this to take effect.

4. **Run AxioCNC**

   ```bash
   axiocnc
   ```

   A browser window opens at `http://localhost:8000`. You can also open that URL manually.

## Verify Serial Port Access

After logging back in:

```bash
groups $USER                    # should include "dialout"
ls -l /dev/ttyUSB* /dev/ttyACM* # list serial devices
```

## Troubleshooting

**Port not found or permission denied**

- Confirm you’re in `dialout`: `groups $USER`
- Log out and back in after `usermod`
- Ensure the controller is plugged in and powered: `ls -l /dev/ttyUSB* /dev/ttyACM*`

**Port 8000 already in use**

```bash
axiocnc --port 8001
```

**Uninstall**

```bash
sudo apt-get remove axiocnc
```

See [Uninstall](./uninstall) for removing config files.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
