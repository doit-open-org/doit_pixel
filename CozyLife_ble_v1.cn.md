# 设备与控制端通信协议-BLE类

设备与控制端的通信主要完成了以下几个部分：

-   用于在连接云端通信之前的发现和控制；

-   用于加速云端通信，当网络环境较差时，可以快速响应用户操作；

-   用于当路由器断网但不断电时的控制；

-   用于不支持云端连接的设备进行本地通信；

## 通信模型

`注意：WiFi类产品的局域网通信仅做为辅助通信，不需要做心跳处理，有连接且发送成功即认为OK，无链接或发送失败则认为断开；`

## 通信流程

设备端：

​	配网、连接到手机、注册到服务器、等待数据通信

控制端：

​	引导用户进入配对状态，发现设备、绑定设备、操作设备

## 通信约定

### gap广播格式

**广播包（adv data）**

|    广播数据段描述    | 类型 | 说明                                                         |
| :------------------: | :--: | :----------------------------------------------------------- |
| 设备 LE 物理连接标识 | 0x01 | 长度：0x02  类型：0x01  数据：0x06                           |
|     Service UUID     | 0X02 | 长度：0x03  类型：0x02  数据：0x01A2                         |
|     Service Data     | 0x16 | 长度：0x11  类型：0x16  &lt;br/&gt;数据：&lt;br/&gt;  服务名：01 A2&lt;br/&gt;  protocol_ver：协议版本&lt;br/&gt;  dev_type：设备连接类型  &lt;br/&gt;  pid：唯一标识&lt;br/&gt;  mac： |

广播内容示例（10 字节 设备ID）:02 01 06 03 02 01 A2 11 16 01 A2 08 01 01**00 00 00 00 00 00** *00 00 00 00 00 00*

```
// 小端字节序
typedef struct {
    unsigned int8 link_flag_l;
    unsigned int8 link_flag_t;
    unsigned int8 link_flag_d;

    unsigned int8 service_uuid_l;
    unsigned int8 service_uuid_t;
    unsigned int8 service_uuid_dh;
    unsigned int8 service_uuid_dl;

    unsigned int8 service_data_l;
    unsigned int8 service_data_t;
    unsigned int8 service_name_h;
    unsigned int8 service_name_l;

    unsigned int8 protocol _ver;
    unsigned int8 dev_type;
    unsigned int8 pid[6];
    unsigned int8 dev_mac[6];

}doit_protocol01_adv_t;
```

**扫描包（scan response data）**

| 广播数据段描述                             | 类型 | 说明                                                         |
| ------------------------------------------ | ---- | ------------------------------------------------------------ |
| Complete Local Name&lt;br/&gt;（完整的本地名称） | 0x09 | 长度：0x03  类型：0x09  数据：0x54，0x54                     |
| 厂商自定义数据                             | 0xff | 长度：0x19&lt;br/&gt;类型：0xff&lt;br/&gt;数据 ：&lt;br/&gt;  绑定标志：0x00（bit1绑定标志，其他位保留）&lt;br/&gt;  设备key：(10字节)由app生成，存储在服务器端的dev_id，用于app与蓝牙通讯之间的暗号&lt;br/&gt; pid : 由平台生成   &lt;br/&gt;mac : 设备mac地址 &lt;br/&gt; end : 保留位 oat相关|

广播内容示例（未绑定）：03 09 54 54 19 FF 00 00 00 ***00 00 00 00 00 00 00 00 00 00*** 00 00 00 00 00 00 00 00 00 00 00 00
```
// 小端字节序
typedef struct {
    unsigned int8 dev_name_len;// 03
    unsigned int8 dev_name_t; // 09
    unsigned int8 dev_name_h;// ascii &#39;T&#39;(54)
    unsigned int8 dev_name_l;// ascii&#39;T&#39;(54)
	
    unsigned int8 data_len; // 19
    unsigned int8 data_t; // FF
    unsigned int8 binded_flag; // 0:未绑定 1:已绑定
    unsigned int8 dev_id[10]; // 设备id
	unsigned int8 pid[6];//17 18 19 20 21 22
    unsigned int8 dev_mac[6];//23 24 25 26 27 28
	
    unsigned int8 end[2]; //保留 ota相关
}doit_protocol01_rsp_data_t;
```
### gatt通讯格式

由于蓝牙 4.0 每帧只能发送 20 字节数据，为了兼容 4.0 的蓝牙芯片，目前采用 20 字节一帧的方式通信，而每
个指令包的数据长度很容易大于 20 个字节，故而采用分包的传输方式，注意:

 - 只有将一个大包发送完才可继续发送下一包;
 - 包总的数据长度不超过 256 字节
 - 如果需要传输的数据长度大于256个字节，请在数据内部自己实现序号等标志实现分包。


## 请求包(所有write)
| 偏移&lt;br/&gt;(Byte) | 长度&lt;br/&gt;（Byte) |     内容&lt;br/&gt;(HEX)      |                          说明                          |
| :-------------: | :--------------: | :---------------------: | :----------------------------------------------------: |
|        0        |        1         |           01            |                        协议版本号                     |
|        1        |        1         | pkg_sn |                        包序号                         |
|        2        |        17        |      data      |           数据           |
|        19       |        1         |          CRC8           | CRC8（除校验外所有字节）                            |

## 回复包(所有read)
| 偏移&lt;br/&gt;(Byte) | 长度&lt;br/&gt;（Byte) |     内容&lt;br/&gt;(HEX)      |                          说明                          |
| :-------------: | :--------------: | :---------------------: | :----------------------------------------------------: |
|        0        |        1         |           01            |                        协议版本号                     |
|        1        |        1         | pkg_sn |                        包序号                         |
|        2        |        17        |          res，data    |                        数据                       |
|        19       |        1         |          CRC8           |                 CRC8（除校验外所有字节）               |

```
// 小端字节序  请求帧
typedef struct {
    unsigned int8 protocol_ver;
    unsigned int8 pkg_sn;
    void          data[17];
    unsigned int8 crc8;
}doit_protocol01_req_data_t;
```

```
// 小端字节序  回复帧
typedef struct {
    unsigned int8 protocol_ver;
    unsigned int8 pkg_sn;
    void          data[17];
    unsigned int8 crc8;
}doit_protocol01_rsp_data_t;
```

`pkg_sn 的最高位用于判断后面是否还有字节存在。若为1则代表后续无字节存在，请判断前面的数据是否完整，并执行超时和重置序号计数处理。`

## 设备通信(Cloud &amp; LAN)

### CMD:0, 查询设备信息

```
// 小端字节序  发送设备信息请求
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 4;
    unsigned int8 timestamp[4];
}doit_protocol01_devinfo_req_t;

// 小端字节序  回复设备信息
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 31;
    unsigned int8 dev_id[10]; //4(timestamp)+6(mac) 
    unsigned int8 dev_type; //wifi = 0x00/ble = 0x01/wifi+ble = 0x02
    unsigned int8 software_ver[4];
    unsigned int8 hardware_ver[4];
    unsigned int8 dev_mac[6];
    unsigned int8 pid[6];
}doit_protocol01_devinfo_rsp_t;
```

### CMD:1, 发送配网信息

**发送（控制端 -&gt; 设备端）：**
```
// 小端字节序  发送配网信息请求
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 163;
    unsigned int8 ssid[32];   //ssid有具体名称为支持wifi连接设备的绑定包； 32位每位数据都是02为支持ble的绑定包;  32位每位数据都是01为ble连接校验（key）
    unsigned int8 passwd[64];
    unsigned int8 bssid[6];
    unsigned int8 dev_key[10]; // app 分配
    unsigned int8 open_id[33];
    unsigned int8 lat[4];
    unsigned int8 lng[4];
	unsigned int8 domain[10];
}doit_protocol01_wifiinfo_req_t;

// 小端字节序  回复配网信息请求
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 1;
    unsigned int8 res;
}doit_protocol01_wifiinfo_rsp_t;

```
**res回复说明**

|  res  |                          说明                          |
| :---: | :----------------------------------------------------: |
|	0	|		成功|
|	1	|		数据错误,或key错误|
|	2	|		已绑定得到设备，设备配网中，拒绝验证|
|	3	|		设备没有绑定，拒绝验证|

### CMD:2, 查询设备属性

```
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len;
    unsigned int8 buff[len];
}doit_protocol01_power_t;
```

```
同设置设备属性的数据包定义
buff[0] =dpid_number; //查询dpid个数
buff[1] =dpid_index0; //那些dpid
buff[2] =dpid_index1;
......
buff[len-1] = dpid_indexn

```

### CMD:3, 设置设备属性

```
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len;
    unsigned int8 buff[len];
}doit_protocol01_power_t;
```

```
buff[0] =dpid;  
buff[1] =data;  
	*
	*
	*
buff[len-1] =data;
```

### CMD:4, 恢复出厂设置

**发送（控制端 -&gt; 设备端）：**

设备收到指令后，需要向服务器发送解绑请求，之后删除保存的wifi信息或者BLE信息以及用户信息，重启进入配网模式；

```
typedef struct {
	unsigned int8 cmd;
	unsigned int8 len = 1;
	unsigned int8 set;
}doit_protocl01_factory_t;
//回复
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 1;
    unsigned int8 res; //0:清除成功
}doit_protocol01_res_t;
```

### CMD:5, OTA升级

**发送（控制端 -&gt; 设备端）：**

```
//发送ota命令，直接进入ota状态，
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len;
    unsigned int8  pkg_index_h;//ota包序号高字节 ((pkg_index_h&lt;&lt;8)|pkg_index_l)
    unsigned int8  pkg_index_l;//ota包序号低字节
    unsigned int8  data[len-2];
}doit_protocol01_ota_t;
//接收完17个小包后，回复
typedef struct {
    unsigned int8 cmd;
    unsigned int8 len = 1;
    unsigned int8 res;
}doit_protocol01_res_t;
```

`如果回复res=0，代表设备可以继续进行ota`
`如果回复res为1，则需要重新开始ota`

### CMD:6 中途取消OTA（暂时不处理）


### CMD:8 心跳包

**发送（控制端 -&gt; 设备端）：**

```
typedef struct {
	 unsigned int8 cmd;
	 unsigned int8 len = 4;
	 unsigned int8 timestamp[4];
}doit_protocol01_heart_t;

```
设备端回复控制端将心跳包直接原包返回即可，如无回复，则代表设备掉线；

### CMD:12 配网状态

**发送（控制端 -&gt; 设备端）：**

```
typedef struct {
	uint8 cmd;
	uint8 len = 5;
	uint8 status;
	uint8 data[4];   //泛型
}doit_protocol01_wificfg_status_t;

```

**status说明**

|  status  |                          说明                          |
| :---: | :----------------------------------------------------: |
|	1	|		开始绑定|
|	2	|		状态码：成功连接wifi|
|	3	|		状态码：wifi连接断开|
|	4	|		状态码：成功获取ip|
|	5	|		状态码：开始绑定|
|	6	|		状态码：http-&gt; 请求开始|
|	7	|		状态码：http-&gt; DNS成功|
|	8	|		状态码：http-&gt; 连接成功|
|	10	|		状态码：http-&gt; 请求完成|
|	11	|		状态码：绑定成功|
|		|		|
|	FF	|		错误码：绑定失败 |
|	FE	|		错误码：超时结束配网模式|
|	EF	|		错误码: 连接wifi失败 (无法连接WiFi)|
|	EE	|		错误码: wifi密码错误 (无法连接WiFi)|
|	ED	|		错误码: wifi不存在 (无法搜索到WiFi)|
|	EC	|		错误码: DHCP失败，无法获取ip (网络环境存在问题)|
|	DF	|		错误码: http DNS失败 (网络环境存在问题)|
|	DE	|		错误码: http 连接失败 (网络环境存在问题)|
|	DD	|		错误码: http 请求错误 (网络环境存在问题)|

### CMD:20 扫描2.4G SSID 

#### 发送（控制端-&gt;设备端）

```
typedef struct {
    unsigned int8 cmd = 20;
    unsigned int8 len = 1;
    unsigned int8 mode = 0;
}doit_protocol01_scan_t;
```


## 回复 

#### 发送（设备端-&gt;控制端）

```
typedef struct {
    unsigned int8 len;
    unsigned int8 rssi;
    unsigned int8 security;
    unsigned char ssid[len-2];
}doit_protocol01_ap_info_t;

typedef struct {
    unsigned int8 cmd;
    unsigned int8 len;//总长度;
    doit_protocol01_ap_info_t ap_info[n];
}doit_protocol01_scan_t;

```

## 设备配网流程说明

### 蓝牙配网流程

-   App打开蓝牙，并接收广播帧；
-   根据收到的广播帧信息，获取设备ID、绑定标志位以及设备key等信息，上报服务器；
-   根据服务器回复判定是否为合法设备，是合法设备且无绑定和无设备key则显示在界面中，如果设备有绑定且设备key与app存储的一致，则进行二次连接，再次发送CMD1与设备进行匹配，返回0则二次连接成功，返回1则失败；
-   用户勾选后，连接对应的设备，先查询设备信息，用于生成对应的控制界面，后在颁发设备key；
-   联网成功后，设备向服务器提交登录申请，附带配网时的设备key，并主动上报状态到服务器；
-   APP端主动轮询设备在线状态，直到超时失败；期间如果查到设备已上线，则认为设备配网成功；
-   配网成功，退出配网流程，进入设备控制界面；配网失败，引导用户重试并分析原因或反馈问题。



## 设备OTA流程说明


根据设备版本号以及服务器版本，在App端做出提醒，不允许静默升级。

## 联系人

邮箱:lihonggang@doit.am

![联系人](a31fa5dfeae11ed49fca984fb5f73fd1.jpg)
