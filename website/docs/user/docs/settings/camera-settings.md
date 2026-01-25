---
sidebar_position: 8
title: Camera
---

# Camera Settings

**Settings → Camera** configures an IP camera feed for the Setup and Monitor screens.

## Enable camera feed

**Enable camera feed** — Turn the camera **on** or **off** in the UI. When **off**, no feed is requested even if the rest is configured.

## Camera URL

**Camera URL** — The source URL for the stream.

- **RTSP:** e.g. `rtsp://192.168.1.100:554/stream`
- **HTTP/HTTPS (MJPEG):** e.g. `http://192.168.1.100:8080/?action=stream`

Supported formats: **RTSP**, **Motion JPEG (MJPEG)**, **HLS**.

## Authentication

**Username** and **Password** — Use these if the camera requires authentication. They are stored securely and not included in exports.

## Display options

- **Flip horizontal** — Mirror the image left–right.
- **Flip vertical** — Mirror the image top–bottom.
- **Rotation** — **0°**, **90°**, **180°**, or **270°**.
- **Show crosshair overlay** — Draw a crosshair on the feed. Useful for alignment.
- **Crosshair color** — Color picker (or hex) for the crosshair when the overlay is on.

## Next steps

- [Camera streaming](../features/camera-streaming)
- [Setup screen](../workflow/setup-screen) and [Monitor screen](../workflow/monitor-screen)
