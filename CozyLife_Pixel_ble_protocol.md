# CozyLife Pixel BLE Protocol

## 1. BLE Product DP Control Protocol

On the BLE platform, the `CozyLife_ble_v1` transport layer carries the protocol, while the device-template layer handles only DP IDs, types, and values.

### 1.1 DP Types

| Type | Code representation | Description |
| --- | --- | --- |
| Value | `DP_TP_VALUE` | Read and write as an integer |
| String | `DP_TP_STR` | Read and write as a hexadecimal ASCII string |
| JSON string | `DP_TP_JSON_STR` | Currently handled as a normal string |

### 1.2 DP List

| DPID | Macro | Type | Direction | Description / values |
| ---: | --- | --- | --- | --- |
| 1 | `PRODUCT_SWITCH_LED` | Value | Read/write | Power switch: `0` off, `1` on |
| 2 | `PRODUCT_WORK_MODE` | Value | Read/write | Operating mode; see section 1.3 |
| 4 | `PRODUCT_BRIGHT_VALUE` | Value | Read/write | Brightness: `0..1000` |
| 7 | `PRODUCT_SCENE_DATA` | - | Not handled | Defined only; current `get/set` does not handle it |
| 8 | `PRODUCT_SPEED_VALUE` | Value | Read/write | Speed: `0..1000` |
| 9 | `PRODUCT_POWER_MEMORY` | - | Not handled | Defined only; current `get/set` does not handle it |
| 10 | `PRODUCT_SENSITIVITY_VALUE` | Value | Read/write | Music sensitivity: `1..10`; music mode must be enabled |
| 11 | `PRODUCT_RGB_TURN` | Value | Read/write | LED color order: `0..5` |
| 12 | `PRODUCT_CHIP_POINT` | Value | Read/write | LED count; fixed to a `20 x 20` display when the template is initialized |
| 13 | `PRODUCT_COUNTDOWN` | Value | Read/write | Countdown in seconds: `0..86400`; reads return remaining seconds |
| 14 | `PRODUCT_NORMAL_TIMER` | String | Read/write | Timer-task string of exactly 50 hexadecimal characters; see section 1.5 |
| 15 | `PRODUCT_MUSIC_INDEX` | Value | Read/write | Music-mode index; music mode must be enabled |
| 16 | `PRODUCT_STAIC_COLOR` | String | Read/write | Static-color string; see section 1.4 |
| 17 | `PRODUCT_PIECE_COLOR` | String | Write | Single-row/panel color string; see section 1.4 |
| 18 | `PRODUCT_DIY_DYM` | String | Defined / partially received | Saved to a local variable on write, but not currently applied |
| 19 | `PRODUCT_SCENE_INDEX` | Value | Read/write | Scene index |
| 20 | `PRODUCT_STATIC_FADE` | Value | Partially received | Saved to a local variable on write, but does not currently call an effect API |
| 35 | `PRODUCT_DIR_INDEX` | Value | Read/write | Effect-direction index |
| 36 | `PRODUCT_TEXT_CHAR_NUM` | Value | Write | Text character count; maximum `55` |
| 37 | `PRODUCT_TEXT_CHAR_POINT` | String | Write | Text bitmap data; see section 1.6 |
| 38 | `PRODUCT_TEXT_CHAR_MODECOLOR` | String | Read/write | Text color/mode; see section 1.6 |
| 39 | `PRODUCT_TEXT_BORDER_COLOR` | String | Read/write | Text background/border color; see section 1.6 |
| 40 | `PRODUCT_2DDIY_POINT` | String | Write | 2D DIY point data; see section 1.7 |
| 42 | `PRODUCT_PICTURE_INDEX` | Value | Read/write | Gallery image index |
| 43 | `PRODUCT_SCREEN_DIR_INDEX` | Value | Write | Screen orientation |
| 45 | `PRODUCT_SCREEN_MIRROR` | Value | Write | Screen mirroring |
| 101 | `PRODUCT_TEXT_SCREE_INFO` | String | Write | Multi-screen MAC list; see section 1.8 |
| 102 | `PRODUCT_TEXT_SCREE_START` | Value | Write | Any received value triggers synchronized saving/start |

### 1.3 Operating Modes

| Value | Macro | Description |
| ---: | --- | --- |
| 0 | `STRIP_MODE_STATIC` / `PRODUCT_MODE_STATIC` | Static color |
| 1 | `STRIP_MODE_SENCE` / `PRODUCT_MODE_SCENE` | Scene |
| 2 | `STRIP_MODE_OUT_MUSIC` / `PRODUCT_OUT_MODE_MUSIC` | External music |
| 3 | `STRIP_MODE_DIY` / `PRODUCT_MODE_DIY` | Legacy DIY mode; not separately handled by the current main flow |
| 4 | `STRIP_MODE_INS_MUSIC` / `PRODUCT_INS_MODE_MUSIC` | Built-in music |
| 5 | `STRIP_MODE_2D_TEXT` / `PRODUCT_MODE_2D_TEXT` | 2D text |
| 6 | `STRIP_MODE_2D_DIT` / `PRODUCT_MODE_2D_DIY` | Static 2D DIY |
| 7 | `STRIP_MODE_PICTURE` / `PRODUCT_MODE_PICTURE` | Gallery |
| 8 | `STRIP_MODE_2D_DYNAMIC_DIT` | Dynamic 2D DIY |
| 9 | `STRIP_MODE_2D_TEXT_SHOW` | Defined only; not handled by the current set flow |

### 1.4 Color String Format

Colors use hexadecimal ASCII HST values:

```text
HHHHSSSSTTTT
```

| Field | Length | Description |
| --- | ---: | --- |
| `HHHH` | 4 hex | Hue (H), normally `0..360` |
| `SSSS` | 4 hex | Saturation (S), normally `0..1000` |
| `TTTT` | 4 hex | Color-temperature/brightness parameter (T), normally `0..1000`; some APIs allow `FFFF` as a reserved value |

`PRODUCT_STAIC_COLOR` supports two lengths:

| Length | Format | Description |
| ---: | --- | --- |
| 12 | `HHHHSSSSTTTT` | Apply one color to every row/panel |
| 144 | `12 * HHHHSSSSTTTT` | Apply 12 colors by row/panel |

`PRODUCT_PIECE_COLOR` is exactly 14 hexadecimal characters:

```text
YYHHHHSSSSTTTT
```

| Field | Length | Description |
| --- | ---: | --- |
| `YY` | 2 hex | Row/panel index, which must be less than `20`; `FF` represents a temporary global color |
| `HHHHSSSSTTTT` | 12 hex | HST color |

### 1.5 Timer Task String

`PRODUCT_NORMAL_TIMER` is exactly 50 hexadecimal characters and contains five timer items of 10 hexadecimal characters each:

```text
OTTTTTTTTT
```

Each item is split as follows:

```text
ON TYPE TIMESTAMP
```

| Field | Length | Description |
| --- | ---: | --- |
| `ON` | 1 hex | Enabled flag: `0` disabled, non-zero enabled |
| `TYPE` | 1 hex | Timer type; see the table below |
| `TIMESTAMP` | 8 hex | Unix timestamp; when `00000000`, subsequent timer items are not parsed |

Timer types:

| Value | Macro | Action |
| ---: | --- | --- |
| 0 | `DOIT_TIMER_ONE_CLOSE` | Turn off once |
| 1 | `DOIT_TIMER_ONE_OPEN` | Turn on once |
| 2 | `DOIT_TIMER_REPEAT_CLOSE` | Turn off daily |
| 3 | `DOIT_TIMER_REPEAT_OPEN` | Turn on daily |

Example:

```text
110000003C00000000000000000000000000000000000000
```

Meaning: item 1 is enabled, turns the light on once, and has timestamp `0x0000003C`; the other four items are empty.

### 1.6 Text-Related Strings

`PRODUCT_TEXT_CHAR_NUM` sets the text character count, up to `55`.

`PRODUCT_TEXT_CHAR_POINT` is exactly 78 hexadecimal characters:

```text
IIHHHHSSSSTTTTP0P1...P31
```

| Field | Length | Description |
| --- | ---: | --- |
| `II` | 2 hex | Character index |
| `HHHHSSSSTTTT` | 12 hex | Current character color |
| `P0..P31` | 64 hex | 32-byte character bitmap data, two hex characters per byte |

`PRODUCT_TEXT_CHAR_MODECOLOR` and `PRODUCT_TEXT_BORDER_COLOR` are both exactly 14 hexadecimal characters:

```text
MMHHHHSSSSTTTT
```

| Field | Length | Description |
| --- | ---: | --- |
| `MM` | 2 hex | Mode index |
| `HHHHSSSSTTTT` | 12 hex | HST color |

### 1.7 2D DIY Point Data

`PRODUCT_2DDIY_POINT` is exactly 122 hexadecimal characters:

```text
HH + 10 * PPPPHHHHSSSS
```

| Field | Length | Description |
| --- | ---: | --- |
| `HH` | 2 hex | Header: high 2 bits indicate fragment status; low 6 bits indicate dynamic frame/count |
| `PPPP` | 4 hex | Point index, `0..399`, converted as `x = index / 20`, `y = index % 20` |
| `HHHH` | 4 hex | Hue (H) |
| `SSSS` | 4 hex | Saturation (S) |

Header high-bit values:

| Value | Meaning |
| ---: | --- |
| `0x40` | Start packet |
| `0x80` | End packet |
| `0xC0` | Single start/end packet |

The implementation fixes T to `0xFFFF` for this interface. Each packet can carry at most 10 points.

### 1.8 Multi-Screen Text Synchronization Information

`PRODUCT_TEXT_SCREE_INFO` concatenates multiple MAC addresses:

```text
MAC1MAC2MAC3...
```

Each MAC address contains 12 hexadecimal characters. The device reads its own MAC address and searches for a match among the first five MAC addresses:

- `scree_number = strlen(str) / 12`
- `screen_index = index of the matching MAC`

Writing to `PRODUCT_TEXT_SCREE_START` triggers synchronized saving.

### 1.9 Full DP Report Sets

The device selects its report list based on the active mode:

| Current mode | Reported DPID values |
| --- | --- |
| Static | `1, 2, 4, 16` |
| Scene | `1, 2, 4, 8, 19` |
| 2D DIY / Dynamic 2D DIY | `1, 2, 4, 8, 35` |
| 2D text | `1, 2, 4, 8, 35, 38, 39` |
| Music | `1, 2, 4, 10, 15` |
| Gallery | `1, 2, 4, 8, 35, 42` |

## Contact

Email: lihonggang@doit.am

![Contact](a31fa5dfeae11ed49fca984fb5f73fd1.jpg)
