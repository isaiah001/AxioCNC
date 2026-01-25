---
sidebar_position: 1
title: Camera Streaming
---

# Camera Streaming

Use an IP camera to watch your machine from the Setup and Monitor screens. Configure the camera in **Settings → Camera**, then enable the feed to see it in the UI.

## What you’ll do

- Add a camera URL (RTSP or MJPEG)
- Optionally set username and password
- View the feed on Setup and Monitor
- Adjust display options (flip, rotate, crosshair)

## Prerequisites

- IP camera with RTSP or HTTP MJPEG stream
- Camera and AxioCNC server on the same network (or reachable)

## Steps

1. **Open Settings → Camera**
2. **Enable camera feed** — Turn the feed **on**.
3. **Enter the camera URL** — RTSP (e.g. `rtsp://192.168.1.100:554/stream`) or HTTP/HTTPS MJPEG (e.g. `http://192.168.1.100:8080/?action=stream`). Check your camera’s manual for the exact URL.
4. **Authentication** — If the camera requires login, set **Username** and **Password**.
5. **Display options** — Use **Flip horizontal**, **Flip vertical**, **Rotation**, **Crosshair**, and **Crosshair color** as needed.
6. **Save** — Settings auto-save. The feed appears in the **Camera** panel on Setup and Monitor.

## Where the feed appears

- **Setup** — Camera panel for positioning and zeroing.
- **Monitor** — Same feed while the job runs.

## Supported formats

- **RTSP**
- **Motion JPEG (MJPEG)** over HTTP/HTTPS
- **HLS** (via backend conversion where used)

## Troubleshooting

- **No image** — Verify URL, credentials, and that the camera is reachable from the AxioCNC server. Try the URL in VLC or another player.
- **Blank or frozen** — Check camera bandwidth and network. Restart the camera or try a lower-resolution stream if available.
- **Wrong orientation** — Use **Rotation**, **Flip horizontal**, or **Flip vertical** in Settings → Camera.

## Next steps

- [Camera settings](../settings/camera-settings)
- [Setup screen](../workflow/setup-screen) and [Monitor screen](../workflow/monitor-screen)
