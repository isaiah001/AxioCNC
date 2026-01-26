---
sidebar_position: 7
title: Docker
---

# Running AxioCNC in Docker

Run AxioCNC in a Docker container for a consistent, isolated setup. Suited to headless servers or environments where you already use Docker.

## Prerequisites

- Docker installed
- Serial device (e.g. `/dev/ttyUSB0`) for the CNC controller, when using real hardware

## Quick Start

**Using the pre-built image:**

```bash
docker pull ghcr.io/rsteckler/axiocnc:latest
docker run -d -p 8000:8000 --name axiocnc ghcr.io/rsteckler/axiocnc:latest
```

Open `http://localhost:8000` (or `http://<host-ip>:8000` from another machine).

## Serial Port Access

To talk to a CNC controller, pass the serial device into the container:

```bash
docker run -d -p 8000:8000 \
  --device=/dev/ttyUSB0 \
  --name axiocnc \
  ghcr.io/rsteckler/axiocnc:latest
```

Use `--device=/dev/ttyACM0` if your controller appears there. Find devices with `ls -l /dev/ttyUSB* /dev/ttyACM*`.

On the host, your user must have access to the serial port (e.g. in the `dialout` group on Linux).

## Persisting Settings and Data

Mount the user data directory so settings, job history, and uploaded files survive container restarts:

```bash
docker run -d -p 8000:8000 \
  -v ~/.axiocnc:/root/.axiocnc \
  --device=/dev/ttyUSB0 \
  --name axiocnc \
  ghcr.io/rsteckler/axiocnc:latest
```

## Custom Port

Map host port 8080 to container port 8000:

```bash
docker run -d -p 8080:8000 --name axiocnc ghcr.io/rsteckler/axiocnc:latest
```

Use `http://localhost:8080`.

## Troubleshooting

**Serial permission errors**

- Ensure the host user is in the `dialout` group and can open the device.
- Use `--device=/dev/ttyUSB0` (or the correct device); avoid `--privileged` unless required.

**Port already in use**

- Change the host port, e.g. `-p 8001:8000`.

**Settings not persisting**

- Use `-v ~/.axiocnc:/root/.axiocnc` (or another host path). Ensure the directory exists.

## Next Steps

- [First use](../getting-started/first-use)
- [Connecting to your machine](../getting-started/connecting-to-machine)
