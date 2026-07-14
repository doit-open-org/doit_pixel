# CozyLife Pixel 蓝牙协议说明

## 1. BLE 产品 DP 控制协议

BLE 平台下，底层由 `CozyLife_ble_v1` 负责承载，设备模板层只处理 DP ID、类型和值。

### 1.1 DP 类型

| 类型 | 代码表现 | 说明 |
| --- | --- | --- |
| 数值 | `DP_TP_VALUE` | 以整数读写 |
| 字符串 | `DP_TP_STR` | 以十六进制 ASCII 字符串读写 |
| JSON 字符串 | `DP_TP_JSON_STR` | 当前使用普通字符串 |

### 1.2 DP 列表

| DPID | 宏名 | 类型 | 方向 | 说明/取值 |
| ---: | --- | --- | --- | --- |
| 1 | `PRODUCT_SWITCH_LED` | Value | 读写 | 开关，`0` 关，`1` 开 |
| 2 | `PRODUCT_WORK_MODE` | Value | 读写 | 工作模式，见 1.3 |
| 4 | `PRODUCT_BRIGHT_VALUE` | Value | 读写 | 亮度，`0..1000` |
| 7 | `PRODUCT_SCENE_DATA` | - | 未处理 | 仅定义，当前 `get/set` 未处理 |
| 8 | `PRODUCT_SPEED_VALUE` | Value | 读写 | 速度，`0..1000` |
| 9 | `PRODUCT_POWER_MEMORY` | - | 未处理 | 仅定义，当前 `get/set` 未处理 |
| 10 | `PRODUCT_SENSITIVITY_VALUE` | Value | 读写 | 音乐灵敏度，`1..10`，需启用音乐模式 |
| 11 | `PRODUCT_RGB_TURN` | Value | 读写 | 灯珠颜色顺序，`0..5` |
| 12 | `PRODUCT_CHIP_POINT` | Value | 读写 | 灯点数量；模板初始化时固定为 `20 x 20` 屏 |
| 13 | `PRODUCT_COUNTDOWN` | Value | 读写 | 倒计时秒数，`0..86400`；读取为剩余秒数 |
| 14 | `PRODUCT_NORMAL_TIMER` | String | 读写 | 定时任务字符串，固定 50 个 hex 字符，见 1.5 |
| 15 | `PRODUCT_MUSIC_INDEX` | Value | 读写 | 音乐模式序号，需启用音乐模式 |
| 16 | `PRODUCT_STAIC_COLOR` | String | 读写 | 静态颜色字符串，见 1.4 |
| 17 | `PRODUCT_PIECE_COLOR` | String | 写 | 单行/单片颜色字符串，见 1.4 |
| 18 | `PRODUCT_DIY_DYM` | String | 定义/部分接收 | 写入时保存到局部变量，但当前未继续应用 |
| 19 | `PRODUCT_SCENE_INDEX` | Value | 读写 | 场景序号 |
| 20 | `PRODUCT_STATIC_FADE` | Value | 部分接收 | 写入时保存到局部变量，但当前未调用效果接口 |
| 35 | `PRODUCT_DIR_INDEX` | Value | 读写 | 效果方向序号 |
| 36 | `PRODUCT_TEXT_CHAR_NUM` | Value | 写 | 文本字符数量，最大 `55` |
| 37 | `PRODUCT_TEXT_CHAR_POINT` | String | 写 | 文本点阵数据，见 1.6 |
| 38 | `PRODUCT_TEXT_CHAR_MODECOLOR` | String | 读写 | 文本颜色/模式，见 1.6 |
| 39 | `PRODUCT_TEXT_BORDER_COLOR` | String | 读写 | 文本背景/边框颜色，见 1.6 |
| 40 | `PRODUCT_2DDIY_POINT` | String | 写 | 2D DIY 点数据，见 1.7 |
| 42 | `PRODUCT_PICTURE_INDEX` | Value | 读写 | 图库序号 |
| 43 | `PRODUCT_SCREEN_DIR_INDEX` | Value | 写 | 屏幕方向 |
| 45 | `PRODUCT_SCREEN_MIRROR` | Value | 写 | 屏幕镜像 |
| 101 | `PRODUCT_TEXT_SCREE_INFO` | String | 写 | 多屏 MAC 列表，见 1.9 |
| 102 | `PRODUCT_TEXT_SCREE_START` | Value | 写 | 收到任意值后触发同步保存/开始 |

### 1.3 工作模式

| 值 | 宏名 | 说明 |
| ---: | --- | --- |
| 0 | `STRIP_MODE_STATIC` / `PRODUCT_MODE_STATIC` | 静态颜色 |
| 1 | `STRIP_MODE_SENCE` / `PRODUCT_MODE_SCENE` | 场景 |
| 2 | `STRIP_MODE_OUT_MUSIC` / `PRODUCT_OUT_MODE_MUSIC` | 外置音乐 |
| 3 | `STRIP_MODE_DIY` / `PRODUCT_MODE_DIY` | 旧 DIY 模式，当前主流程未单独处理 |
| 4 | `STRIP_MODE_INS_MUSIC` / `PRODUCT_INS_MODE_MUSIC` | 内置音乐 |
| 5 | `STRIP_MODE_2D_TEXT` / `PRODUCT_MODE_2D_TEXT` | 2D 文本 |
| 6 | `STRIP_MODE_2D_DIT` / `PRODUCT_MODE_2D_DIY` | 2D DIY 静态 |
| 7 | `STRIP_MODE_PICTURE` / `PRODUCT_MODE_PICTURE` | 图库 |
| 8 | `STRIP_MODE_2D_DYNAMIC_DIT` | 2D DIY 动态 |
| 9 | `STRIP_MODE_2D_TEXT_SHOW` | 仅定义，当前设置流程未处理 |

### 1.4 颜色字符串格式

颜色统一使用 HST 十六进制 ASCII：

```text
HHHHSSSSTTTT
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `HHHH` | 4 hex | 色相 H，正常范围 `0..360` |
| `SSSS` | 4 hex | 饱和度 S，正常范围 `0..1000` |
| `TTTT` | 4 hex | 色温/亮度参数 T，正常范围 `0..1000`；部分接口允许 `FFFF` 作为保留值 |

`PRODUCT_STAIC_COLOR` 支持两种长度：

| 长度 | 格式 | 说明 |
| ---: | --- | --- |
| 12 | `HHHHSSSSTTTT` | 一个颜色应用到所有行/片 |
| 144 | `12 * HHHHSSSSTTTT` | 12 组颜色，按行/片写入 |

`PRODUCT_PIECE_COLOR` 固定 14 个 hex 字符：

```text
YYHHHHSSSSTTTT
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `YY` | 2 hex | 行/片索引，必须小于 `20`；`FF` 表示临时全局颜色 |
| `HHHHSSSSTTTT` | 12 hex | HST 颜色 |

### 1.5 定时任务字符串

`PRODUCT_NORMAL_TIMER` 固定 50 个 hex 字符，包含 5 个定时项，每项 10 个 hex 字符：

```text
OTTTTTTTTT
```

实际拆分为：

```text
ON TYPE TIMESTAMP
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `ON` | 1 hex | 是否启用，`0` 关闭，非 0 启用 |
| `TYPE` | 1 hex | 定时类型，见下表 |
| `TIMESTAMP` | 8 hex | Unix 时间戳；为 `00000000` 时后续定时项不再解析 |

定时类型：

| 值 | 宏名 | 动作 |
| ---: | --- | --- |
| 0 | `DOIT_TIMER_ONE_CLOSE` | 单次关灯 |
| 1 | `DOIT_TIMER_ONE_OPEN` | 单次开灯 |
| 2 | `DOIT_TIMER_REPEAT_CLOSE` | 每日重复关灯 |
| 3 | `DOIT_TIMER_REPEAT_OPEN` | 每日重复开灯 |

示例：

```text
110000003C00000000000000000000000000000000000000
```

含义：第 1 项启用，单次开灯，时间戳 `0x0000003C`；其余 4 项为空。

### 1.6 文本相关字符串

`PRODUCT_TEXT_CHAR_NUM` 设置文本字符数量，最大 `55`。

`PRODUCT_TEXT_CHAR_POINT` 固定 78 个 hex 字符：

```text
IIHHHHSSSSTTTTP0P1...P31
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `II` | 2 hex | 字符索引 |
| `HHHHSSSSTTTT` | 12 hex | 当前字符颜色 |
| `P0..P31` | 64 hex | 32 字节点阵数据，每字节 2 个 hex |

`PRODUCT_TEXT_CHAR_MODECOLOR` 和 `PRODUCT_TEXT_BORDER_COLOR` 均固定 14 个 hex 字符：

```text
MMHHHHSSSSTTTT
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `MM` | 2 hex | 模式索引 |
| `HHHHSSSSTTTT` | 12 hex | HST 颜色 |

### 1.7 2D DIY 点数据

`PRODUCT_2DDIY_POINT` 固定 122 个 hex 字符：

```text
HH + 10 * PPPPHHHHSSSS
```

| 字段 | 长度 | 说明 |
| --- | ---: | --- |
| `HH` | 2 hex | 包头，高 2 bit 表示分包状态，低 6 bit 表示动态帧/计数 |
| `PPPP` | 4 hex | 点位索引，`0..399`，换算为 `x = index / 20`，`y = index % 20` |
| `HHHH` | 4 hex | 色相 H |
| `SSSS` | 4 hex | 饱和度 S |

包头高位含义：

| 值 | 含义 |
| ---: | --- |
| `0x40` | 起始包 |
| `0x80` | 结束包 |
| `0xC0` | 单包起止 |

源码中该接口将 T 固定为 `0xFFFF`，每包最多携带 10 个点。

### 1.8 多屏文本同步信息

`PRODUCT_TEXT_SCREE_INFO` 是多个 MAC 串联：

```text
MAC1MAC2MAC3...
```

每个 MAC 为 12 个 hex 字符。设备读取自身 MAC，在前 5 个 MAC 中查找匹配项：

- `scree_number = strlen(str) / 12`
- `screen_index = 匹配到的 MAC 下标`

`PRODUCT_TEXT_SCREE_START` 收到写入后同步保存。

### 1.9 全量上报 DP 集合

设备根据当前模式选择上报列表：

| 当前模式 | 上报 DPID |
| --- | --- |
| 静态 | `1, 2, 4, 16` |
| 场景 | `1, 2, 4, 8, 19` |
| 2D DIY / 2D 动态 DIY | `1, 2, 4, 8, 35` |
| 2D 文本 | `1, 2, 4, 8, 35, 38, 39` |
| 音乐 | `1, 2, 4, 10, 15` |
| 图库 | `1, 2, 4, 8, 35, 42` |

