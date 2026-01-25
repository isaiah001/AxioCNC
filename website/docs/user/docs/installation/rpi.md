---
sidebar_position: 5
title: Raspberry Pi
---

# Installing AxioCNC on Raspberry Pi

Install AxioCNC on a Raspberry Pi with a desktop (display + keyboard). Use this when the Pi is your main control machine. For headless use, see [Raspberry Pi Server](./rpi-server).

## Choose Your Package

- **Raspberry Pi 3 / 4 (32‑bit):** `axiocnc_*_armv7l.deb`
- **Raspberry Pi 4 / 5 (64‑bit):** `axiocnc_*_arm64.deb`

Download from [GitHub Releases](https://github.com/rsteckler/AxioCNC/releases) or [axiocnc.com](https://axiocnc.com#download).

## Steps

1. **Transfer the .deb to the Pi**

   Use `scp`, a USB drive, or another method. Example:

   ```bash
   scp axiocnc_*_arm64.deb pi@raspberrypi.local:~/
   ```

2. **On the Pi, install the package**

   ```bash
   cd ~
   sudo dpkg -i axiocnc_*.deb
   sudo apt-get install -f   # if dependencies are missing
   ```

3. **Add your user to the `dialout` group**

   ```bash
   sudo usermod -a -G dialout $USER
   ```

   Log out and back in (or reboot) so the change applies.

4. **Run AxioCNC**

   ```bash
   axiocnc
   ```

   A browser opens at `http://localhost:8000`. From another device on the network, use `http://raspberrypi.local:8000` or `http://<pi-ip>:8000`.

## Verify Serial Access

```bash
groups $USER
ls -l /dev/ttyUSB* /dev/ttyACM*
```

You should see `dialout` in your groups and your controller’s device listed.

## Auto-Start on Boot (Optional)

The **desktop** .deb does not install a systemd unit. To auto-start on boot you must create one, then enable it.

**If you use the [headless server package](./rpi-server) instead**, the service is already installed. Just run:

```bash
sudo systemctl enable axiocnc
sudo systemctl start axiocnc
sudo systemctl status axiocnc
```

For **desktop** (this guide), create the service file:

1. Create `/etc/systemd/system/axiocnc.service`:

   ```bash
   sudo nano /etc/systemd/system/axiocnc.service
   ```

2. Add (replace `pi` with your username if different):

   ```ini
   [Unit]
   Description=AxioCNC CNC Controller
   After=network.target

   [Service]
   Type=simple
   User=pi
   ExecStart=/usr/bin/axiocnc
   Restart=always
   Environment="DISPLAY=:0"

   [Install]
   WantedBy=multi-user.target
   ```

3. Enable and start:

   ```bash
   sudo systemctl enable axiocnc
   sudo systemctl start axiocnc
   sudo systemctl status axiocnc
   ```

## Troubleshooting

**Serial port not found or permission denied**

- Confirm `dialout`: `groups $USER`. If missing, run `usermod` again and log out/in.
- Check devices: `ls -l /dev/ttyUSB* /dev/ttyACM*`.

**Application won’t start**

- Run `axiocnc` in a terminal to see errors.
- Check port 8000: `sudo lsof -i :8000`. Use `axiocnc --port 8001` if 8000 is in use.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
- [Uninstall](./uninstall)
