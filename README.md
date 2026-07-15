# Pixel Dream Lattice

A WeChat Mini Program for connecting to and controlling Bluetooth LED matrix devices. It communicates with devices through the BLE protocol and provides matrix-display controls for color, scenes, text, images, DIY animations, music-reactive effects, and timers.

## Protocol Documentation

| Document | Description |
| --- | --- |
| [BLE Communication Protocol](CozyLife_ble_v1.md) | English specification for BLE advertising, GATT framing, commands, provisioning, and OTA. |
| [BLE Communication Protocol (Chinese)](CozyLife_ble_v1.cn.md) | Chinese translation of the BLE transport and device communication specification. |
| [CozyLife Pixel BLE Protocol](CozyLife_Pixel_ble_protocol.md) | English specification for Pixel device data points, modes, color formats, timers, text, and 2D DIY data. |
| [CozyLife Pixel BLE Protocol (Chinese)](CozyLife_Pixel_ble_protocol.cn.md) | Chinese translation of the Pixel data-point control protocol. |

For the Chinese project documentation, see [README.cn.md](README.cn.md).

## Features

- Scan for and connect to Bluetooth devices with a specified name; the default filter is `TT`.
- Automatically discover services and read/write characteristics, then complete local binding or authentication.
- Control power, brightness, speed, screen orientation, RGB ordering, and other basic device settings.
- Use preset solid-color and multicolor effect scenes.
- Edit text bitmaps with color, background, brightness, speed, and moving, blinking, or breathing playback effects.
- Use built-in static and animated pattern galleries.
- Draw static DIY content and send dynamic DIY frame data.
- Provide four music-reactive modes and sensitivity control.
- Support a countdown and up to five device timer tasks.

## Project Structure

```text
.
├── app.js                         # Mini Program entry point, global state, and dynamic DIY transmission
├── app.json                       # Page and subpackage configuration
├── pages/
│   ├── lattice/                   # Matrix control home page
│   └── device/                    # BLE scanning, connection, authentication, and logs
├── pkg_lattice/                   # Matrix feature subpackage
│   └── pages/
│       ├── colorset/              # Color settings
│       ├── effect/                # Multicolor effects
│       ├── music/                 # Music-reactive effects
│       ├── txt/, editTxt/         # Text matrix and editing
│       ├── diy/, editDiy/         # Static DIY and editing
│       ├── dynamicDiy/            # Dynamic DIY
│       ├── picture/               # Pattern gallery
│       ├── time/                  # Timers and countdowns
│       └── publicModule/          # Shared pages for adding and editing timer tasks
├── components/                    # Color wheel, countdown, orientation calibration, and other components
├── utils/
│   ├── bleProtocol.js             # BLE framing, CRC, authentication, and application protocol
│   ├── bleSession.js              # BLE session state and write queue
│   ├── control.js                 # Device data-point control wrapper
│   ├── light.js                   # LED matrix data-point definitions
│   ├── comm.js                    # Page data synchronization and timer-task cache
│   └── myCompat.js                # WeChat runtime compatibility layer
├── img/, imgData/                 # Built-in image and matrix-data resources
└── scripts/                       # Font and gallery preview generation scripts
```

## Development and Running

### Requirements

- WeChat DevTools with a base library version that supports BLE APIs.
- A physical test device with Bluetooth enabled and Mini Program Bluetooth permission granted.
- A compatible LED matrix device. Its default advertised name must be `TT`; the filter can be changed on the device connection page.

### Start

1. Open WeChat DevTools and choose **Import Project**.
2. Select the `pixel_dream_lattice_wx` directory at the repository root.
3. Use the AppID in `project.config.json`, or replace it with a team-approved test AppID.
4. Compile in DevTools. BLE scanning, connection, and control must be verified on a physical device.

This project uses the native WeChat Mini Program framework and has no third-party package-management configuration, so dependency installation is normally unnecessary.

## Device Communication

The device connection page performs the following steps:

1. Initialize the Bluetooth adapter and scan nearby devices.
2. Connect to the selected device and enumerate services and characteristics.
3. Find the notification characteristic with short UUID `2B10` and the write characteristic with short UUID `2B11`.
4. Enable notifications, then bind or authenticate based on advertising data and the local binding record.
5. Retrieve device information, timer tasks, and data-point state. The control page can operate only after the session is ready.

The transport layer uses fixed 20-byte frames: byte 1 is the protocol version (supports `pv=1` and `pv=3`), byte 2 contains the fragment sequence number and end flag, the following 17 bytes contain payload data, and the final byte is a CRC-8 checksum. Longer application data is fragmented and reassembled automatically.

The primary data-point definitions are in `utils/light.js`, including power, operating mode, brightness, speed, music sensitivity, timers, text, DIY, images, and screen orientation.

## Local Data

- Authentication data for bound devices is stored in WeChat local storage by device identifier, with the key prefix `dream_ble_bind_`.
- Timer-task tables are stored by device with the key prefix `lattice_timer_table_`.
- Editing state for text, colors, DIY content, and other data is also cached by device identifier.

After Mini Program local storage is cleared, the device must complete local binding or authentication again.

## Resource Scripts

- `scripts/generate-hzk16s-font.js`: generates HZK16S bitmap-font data.
- `scripts/generate-gallery-previews.js`: generates gallery preview resources.

These scripts maintain built-in resources and are not required for normal Mini Program compilation or physical-device debugging.

## Notes

- The WeChat DevTools simulator cannot fully simulate BLE scanning, connections, or characteristic notifications. Use physical-device results as the source of truth.
- The BLE UUIDs, advertising format, authentication rules, and data-point IDs are coupled to the target firmware. When changing hardware or firmware, update `utils/bleProtocol.js` and `utils/light.js` first.
- The Bluetooth connection page provides communication logs for troubleshooting scanning, characteristic discovery, authentication, CRC validation, and data-point traffic.

## Contact

Email: lihonggang@doit.am

![Contact](a31fa5dfeae11ed49fca984fb5f73fd1.jpg)
