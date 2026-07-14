const ble = require('../../utils/bleProtocol');
const bleSession = require('../../utils/bleSession');

const BIND_RECORD_PREFIX = 'dream_ble_bind_';

function promisifyWx(name, options) {
  return new Promise(function (resolve, reject) {
    wx[name](Object.assign({}, options || {}, {
      success: resolve,
      fail: reject
    }));
  });
}

function storageKey(id) {
  const value = String(id || '').trim().toLowerCase();
  return value ? BIND_RECORD_PREFIX + value : '';
}

function readBindRecord(id) {
  const key = storageKey(id);
  if (!key) return null;
  try {
    return wx.getStorageSync(key) || null;
  } catch (err) {
    return null;
  }
}

function findBindRecord(deviceId, advDeviceId) {
  return readBindRecord(deviceId) || readBindRecord(advDeviceId);
}

function writeBindRecord(record) {
  const ids = [record.deviceId, record.advDeviceId].filter(Boolean);
  ids.forEach(function (id) {
    const key = storageKey(id);
    if (key) wx.setStorageSync(key, record);
  });
}

function buildBindLabel(manufacturer, record) {
  if (record && record.devKey) return '本机已保存 key';
  if (!manufacturer || !manufacturer.valid) return '广播未识别';
  return manufacturer.isBound ? '设备已绑定，本机无 key' : '设备未绑定';
}

Page({
  data: {
    nameFilter: 'TT',
    discovering: false,
    devices: [],
    selectedDeviceIndex: -1,
    selectedDeviceId: '',
    hasSelectedDevice: false,
    selectedDevice: {},
    connected: false,
    ready: false,
    controlReady: false,
    connectedDevice: {},
    serviceId: '',
    readCharId: '',
    writeCharId: '',
    transportPv: 1,
    deviceInfo: null,
    currentDeviceId: '',
    currentAdvDeviceId: '',
    currentDevKey: '',
    bindState: '未连接',
    authState: '未鉴权',
    logs: [],
    logScrollTop: 0
  },

  rxFrames: [],
  pendingAuth: null,
  connecting: false,
  keepAliveTimer: null,
  keepAliveSending: false,
  writeQueue: Promise.resolve(),

  onLoad() {
    bleSession.bindWriter({
      writePayload: this.writePayload.bind(this),
      log: this.log.bind(this)
    });
    wx.onBluetoothDeviceFound(this.handleDeviceFound.bind(this));
    wx.onBLECharacteristicValueChange(this.handleCharacteristicValueChange.bind(this));
    wx.onBLEConnectionStateChange(this.handleConnectionStateChange.bind(this));
  },

  onUnload() {
    this.stopKeepAlive();
    this.stopScan();
    if (this.data.connectedDevice.deviceId) {
      wx.closeBLEConnection({ deviceId: this.data.connectedDevice.deviceId });
    }
    wx.closeBluetoothAdapter();
  },

  log(message) {
    const time = new Date();
    const prefix = [
      ('0' + time.getHours()).slice(-2),
      ('0' + time.getMinutes()).slice(-2),
      ('0' + time.getSeconds()).slice(-2)
    ].join(':');
    const line = prefix + ' ' + message;
    console.log('[DreamBLE]', line);
    const logs = this.data.logs.concat(line).slice(-180);
    this.setData({
      logs: logs,
      logScrollTop: logs.length * 1000
    });
  },

  clearLog() {
    this.setData({ logs: [], logScrollTop: 0 });
  },

  onNameFilterInput(e) {
    this.setData({ nameFilter: String(e.detail.value || '').trim() });
  },

  async openAdapter() {
    try {
      await promisifyWx('openBluetoothAdapter');
      this.log('蓝牙初始化成功');
    } catch (err) {
      this.log('蓝牙初始化失败: ' + JSON.stringify(err));
      wx.showToast({ title: '请打开蓝牙权限', icon: 'none' });
    }
  },

  async startScan() {
    try {
      if (!this.data.discovering) {
        await this.openAdapter();
      }
      this.setData({ devices: [], discovering: true });
      await promisifyWx('startBluetoothDevicesDiscovery', {
        allowDuplicatesKey: true
      });
      this.log('开始扫描');
    } catch (err) {
      this.setData({ discovering: false });
      this.log('扫描失败: ' + JSON.stringify(err));
    }
  },

  stopScan() {
    if (!this.data.discovering) return;
    wx.stopBluetoothDevicesDiscovery({
      complete: () => {
        this.setData({ discovering: false });
        this.log('停止扫描');
      }
    });
  },

  handleDeviceFound(res) {
    const found = res.devices || [];
    const nameFilter = this.data.nameFilter;
    const devices = this.data.devices.slice();

    found.forEach((device) => {
      const displayName = device.name || device.localName || '';
      if (nameFilter && displayName !== nameFilter) return;

      const parsedList = ble.parseServiceData(device.serviceData || {});
      const parsed = parsedList[0] || {};
      const manufacturer = device.advertisData ? ble.parseManufacturerData(device.advertisData) : {};
      const localRecord = findBindRecord('', manufacturer.advDeviceId);
      const bindLabel = buildBindLabel(manufacturer, localRecord);
      const item = Object.assign({}, device, {
        displayName: displayName,
        parsed: parsed,
        manufacturer: manufacturer,
        manufacturerHex: manufacturer.rawHex || '',
        localRecord: localRecord,
        bindLabel: bindLabel
      });

      const index = devices.findIndex((old) => old.deviceId === item.deviceId);
      if (index >= 0) devices[index] = item;
      else devices.push(item);
    });

    devices.sort((a, b) => (b.RSSI || -1000) - (a.RSSI || -1000));
    const nextDevices = devices.slice(0, 30);
    let selectedDeviceIndex = -1;
    let selectedDevice = this.data.selectedDevice || {};
    const selectedDeviceId = this.data.selectedDeviceId;
    if (selectedDeviceId) {
      selectedDeviceIndex = nextDevices.findIndex((item) => item.deviceId === selectedDeviceId);
      if (selectedDeviceIndex >= 0) selectedDevice = nextDevices[selectedDeviceIndex];
    }

    this.setData({
      devices: nextDevices,
      selectedDeviceIndex: selectedDeviceIndex,
      selectedDeviceId: selectedDeviceIndex >= 0 ? selectedDeviceId : '',
      hasSelectedDevice: selectedDeviceIndex >= 0,
      selectedDevice: selectedDeviceIndex >= 0 ? selectedDevice : {}
    });
  },

  selectDevice(e) {
    const device = this.data.devices[e.currentTarget.dataset.index];
    if (!device) return;
    this.setData({
      selectedDeviceIndex: e.currentTarget.dataset.index,
      selectedDeviceId: device.deviceId,
      hasSelectedDevice: true,
      selectedDevice: device
    });
    bleSession.update({ rssi: device.RSSI != null ? device.RSSI : null });
    this.log('已选中: ' + (device.name || device.deviceId));
  },

  async connectSelectedDevice() {
    if (!this.data.hasSelectedDevice || !this.data.selectedDevice.deviceId) {
      wx.showToast({ title: '请先选择设备', icon: 'none' });
      return;
    }
    await this.connectToDevice(this.data.selectedDevice);
  },

  async connectDevice(e) {
    const device = this.data.devices[e.currentTarget.dataset.index];
    if (!device) return;
    this.setData({
      selectedDeviceIndex: e.currentTarget.dataset.index,
      selectedDeviceId: device.deviceId,
      hasSelectedDevice: true,
      selectedDevice: device
    });
    bleSession.update({ rssi: device.RSSI != null ? device.RSSI : null });
    await this.connectToDevice(device);
  },

  async connectToDevice(device) {
    if (this.connecting) {
      this.log('连接正在进行中，忽略重复请求');
      return false;
    }
    if (this.data.connected && this.data.connectedDevice.deviceId === device.deviceId) {
      this.log('设备已连接，忽略重复请求');
      return true;
    }

    this.connecting = true;
    this.stopKeepAlive();
    this.stopScan();
    this.rxFrames = [];
    this.pendingAuth = null;
    const transportPv = device && device.parsed && Number(device.parsed.pv) === 3 ? 3 : 1;
    this.setData({
      connected: false,
      ready: false,
      controlReady: false,
      connectedDevice: device,
      transportPv: transportPv,
      serviceId: '',
      readCharId: '',
      writeCharId: '',
      deviceInfo: null,
      currentDeviceId: '',
      currentAdvDeviceId: device.manufacturer && device.manufacturer.advDeviceId || '',
      currentDevKey: device.localRecord && device.localRecord.devKey || '',
      bindState: buildBindLabel(device.manufacturer, device.localRecord),
      authState: '未鉴权'
    });

    try {
      this.log('连接: ' + (device.name || device.deviceId));
      await promisifyWx('createBLEConnection', {
        deviceId: device.deviceId,
        timeout: 10000
      });
      this.setData({ connected: true });
      bleSession.update({ connected: true, ready: false, controlReady: false });
      this.log('连接成功，发现服务');
      await this.discoverProtocolCharacteristics(device.deviceId);
      this.autoLocalBindOrAuth();
      return true;
    } catch (err) {
      this.log('连接失败: ' + JSON.stringify(err));
      return false;
    } finally {
      this.connecting = false;
    }
  },

  async disconnectDevice() {
    const deviceId = this.data.connectedDevice.deviceId || this.data.selectedDevice.deviceId;
    if (!deviceId) {
      wx.showToast({ title: '暂无设备可断开', icon: 'none' });
      return;
    }

    try {
      await promisifyWx('closeBLEConnection', { deviceId: deviceId });
      this.log('已断开: ' + deviceId);
    } catch (err) {
      this.log('断开失败: ' + JSON.stringify(err));
    } finally {
      this.stopKeepAlive();
      this.rxFrames = [];
      this.pendingAuth = null;
      this.setData({
        connected: false,
        ready: false,
        controlReady: false,
        connectedDevice: {},
        serviceId: '',
        readCharId: '',
        writeCharId: '',
        deviceInfo: null,
        bindState: '未连接',
        authState: '未鉴权'
      });
      bleSession.update({ connected: false, ready: false, controlReady: false, deviceInfo: null });
    }
  },

  async discoverProtocolCharacteristics(deviceId) {
    const serviceRes = await promisifyWx('getBLEDeviceServices', { deviceId: deviceId });
    const services = serviceRes.services || [];
    let readChar = null;
    let writeChar = null;
    let serviceId = '';

    for (let i = 0; i < services.length; i += 1) {
      const service = services[i];
      const charRes = await promisifyWx('getBLEDeviceCharacteristics', {
        deviceId: deviceId,
        serviceId: service.uuid
      });
      const chars = charRes.characteristics || [];
      chars.forEach((ch) => {
        if (ble.uuidMatches(ch.uuid, ble.READ_UUID_SHORT)) readChar = ch;
        if (ble.uuidMatches(ch.uuid, ble.WRITE_UUID_SHORT)) writeChar = ch;
      });
      if (readChar && writeChar) {
        serviceId = service.uuid;
        break;
      }
    }

    if (!readChar || !writeChar || !serviceId) {
      this.log('未找到 2B10/2B11，请确认设备协议或 Service UUID');
      wx.showToast({ title: '未找到协议特征', icon: 'none' });
      return;
    }

    this.setData({
      serviceId: serviceId,
      readCharId: readChar.uuid,
      writeCharId: writeChar.uuid
    });

    await promisifyWx('notifyBLECharacteristicValueChange', {
      state: true,
      deviceId: deviceId,
      serviceId: serviceId,
      characteristicId: readChar.uuid
    });

    this.setData({ ready: true });
    bleSession.update({ connected: true, ready: true, controlReady: false });
    this.log('Notify 已开启: ' + readChar.uuid);
  },

  handleConnectionStateChange(res) {
    if (res.deviceId !== this.data.connectedDevice.deviceId) return;
    this.setData({
      connected: res.connected,
      ready: res.connected && this.data.ready,
      controlReady: res.connected && this.data.controlReady
    });
    if (!res.connected) {
      this.stopKeepAlive();
      this.pendingAuth = null;
      this.rxFrames = [];
      this.setData({ authState: '未鉴权', controlReady: false });
      bleSession.update({ connected: false, ready: false, controlReady: false });
    }
    this.log('连接状态: ' + (res.connected ? 'connected' : 'disconnected'));
  },

  handleCharacteristicValueChange(res) {
    if (res.deviceId !== this.data.connectedDevice.deviceId) return;
    if (!ble.uuidMatches(res.characteristicId, ble.READ_UUID_SHORT)) return;

    const frame = ble.parseTransportFrame(res.value);
    this.log('RX: ' + frame.hex + (frame.ok ? '' : ' CRC_ERR'));
    if (!frame.ok) return;
    if (frame.pv === 0x03 && this.data.transportPv !== 3) {
      this.setData({ transportPv: 3 });
      this.log('检测到设备使用 pv=3，后续写包自动使用 pv=3');
    }

    this.rxFrames.push(frame);
    if (!frame.isLast) return;

    const payload = ble.reassembleFrames(this.rxFrames);
    this.rxFrames = [];
    const parsed = ble.parseBusinessPayload(payload);
    this.log('业务回包: ' + JSON.stringify(parsed));

    if (parsed.deviceInfo) {
      this.setData({ deviceInfo: parsed.deviceInfo });
      bleSession.update({ deviceInfo: parsed.deviceInfo });
      this.prepareLocalAuth(parsed.deviceInfo);
    }

    if (parsed.type === 'auth') {
      this.handleAuthResult(parsed);
    }

    if (parsed.type === 'dp') {
      bleSession.emitDpData(parsed.data, parsed.cmd);
    }
  },

  prepareLocalAuth(deviceInfo) {
    const manufacturer = this.data.connectedDevice.manufacturer || {};
    const advDeviceId = manufacturer.advDeviceId || this.data.currentAdvDeviceId || '';
    const record = findBindRecord(deviceInfo.deviceId, advDeviceId);

    this.setData({
      currentDeviceId: deviceInfo.deviceId || '',
      currentAdvDeviceId: advDeviceId
    });

    if (record && record.devKey) {
      this.setData({
        currentDevKey: record.devKey,
        bindState: '本机已保存 key',
        authState: '自动鉴权中'
      });
      this.startLocalAuth(1, record.devKey, 'auth');
      return;
    }

    if (manufacturer.valid && manufacturer.isBound) {
      this.setData({
        bindState: '设备已绑定，本机无 key',
        authState: '缺少本地 key',
        controlReady: false
      });
      wx.showModal({
        title: '需要重置设备',
        content: '设备广播显示已绑定，但本机没有保存 dev_key。纯本地模式无法恢复，只能让已绑定手机解绑，或将设备重置为未绑定后重新绑定。',
        showCancel: false
      });
      return;
    }

    const devKey = ble.generateDevKey();
    this.setData({
      currentDevKey: devKey,
      bindState: manufacturer.valid ? '设备未绑定' : '广播未知，尝试本地绑定',
      authState: '自动绑定中'
    });
    this.startLocalAuth(2, devKey, 'bind');
  },

  async startLocalAuth(type, devKey, purpose) {
    this.pendingAuth = {
      type: type,
      devKey: devKey,
      purpose: purpose,
      ts: Date.now()
    };
    this.log('开始' + (purpose === 'bind' ? '绑定' : '鉴权') + ': type=' + type + ', dev_key=' + devKey);
    const ok = await this.writePayload(ble.buildLocalAuth(type, devKey), 'local auth type=' + type);
    if (!ok) this.pendingAuth = null;
  },

  handleAuthResult(parsed) {
    const pending = this.pendingAuth;
    this.pendingAuth = null;

    if (parsed.status === 0) {
      let bindState = '本机可控制';
      if (pending && pending.purpose === 'bind') {
        const deviceInfo = this.data.deviceInfo || {};
        const manufacturer = this.data.connectedDevice.manufacturer || {};
        const record = {
          devKey: pending.devKey,
          deviceId: this.data.currentDeviceId || deviceInfo.deviceId || '',
          advDeviceId: this.data.currentAdvDeviceId || manufacturer.advDeviceId || '',
          name: this.data.connectedDevice.displayName || this.data.connectedDevice.name || '',
          pid: deviceInfo.pid || this.data.connectedDevice.parsed && this.data.connectedDevice.parsed.pid || '',
          mac: deviceInfo.mac || '',
          createdAt: Date.now(),
          updatedAt: Date.now()
        };
        writeBindRecord(record);
        bindState = '已绑定并保存 key';
        this.log('已保存本地 dev_key: ' + record.devKey);
      }

      this.setData({
        controlReady: true,
        authState: '鉴权成功',
        bindState: bindState,
        currentDevKey: pending && pending.devKey || this.data.currentDevKey
      });
      bleSession.update({ connected: true, ready: true, controlReady: true, deviceInfo: this.data.deviceInfo });
      this.startKeepAlive();
      wx.switchTab({ url: '/pages/lattice/index' });
      return;
    }

    const hadLocalKey = !!this.data.currentDevKey;
    this.setData({
      controlReady: false,
      authState: '鉴权失败 status=' + parsed.status,
      bindState: hadLocalKey ? '本地 key 可能已失效' : this.data.bindState
    });
    bleSession.update({ controlReady: false });
    if (hadLocalKey) {
      wx.showModal({
        title: '鉴权失败',
        content: '设备拒绝当前 dev_key。常见原因是设备已被其他手机重置并重新绑定，本机保存的 key 已失效。需要重置设备后重新绑定。',
        showCancel: false
      });
    }
  },

  writePayload(payload, title) {
    // Keep every multi-frame BLE payload contiguous on the wire.
    const writeTask = () => this.writePayloadNow(payload, title);
    const queuedWrite = this.writeQueue.then(writeTask, writeTask);
    this.writeQueue = queuedWrite.catch(() => undefined);
    return queuedWrite;
  },

  async writePayloadNow(payload, title) {
    if (!this.data.ready) {
      wx.showToast({ title: '请先连接设备', icon: 'error' });
      return false;
    }

    const packets = ble.slicePayload(payload, this.data.transportPv);
    this.log('TX ' + title + ': pv=' + this.data.transportPv + ', payload=' + ble.bytesToHex(payload) + ', packets=' + packets.length);

    try {
      for (let i = 0; i < packets.length; i += 1) {
        await promisifyWx('writeBLECharacteristicValue', {
          deviceId: this.data.connectedDevice.deviceId,
          serviceId: this.data.serviceId,
          characteristicId: this.data.writeCharId,
          value: packets[i]
        });
        this.log('TX frame: ' + ble.abToHex(packets[i]));
        await new Promise((resolve) => setTimeout(resolve, 30));
      }
      return true;
    } catch (err) {
      this.log('写入失败: ' + JSON.stringify(err));
      wx.showToast({ title: '写入失败', icon: 'none' });
      return false;
    }
  },

  sendGetInfo() {
    this.writePayload(ble.buildGetDeviceInfo(), 'getDeviceInfo');
  },

  autoLocalBindOrAuth() {
    if (this.data.deviceInfo) {
      this.prepareLocalAuth(this.data.deviceInfo);
      return;
    }
    this.setData({ authState: '自动获取信息中' });
    this.sendGetInfo();
  },

  querySwitch() {
    this.writePayload(ble.buildQueryDp([1]), 'query DP 1');
  },

  queryCommonDp() {
    this.writePayload(ble.buildQueryDp([1, 2, 4, 8, 10, 12, 19]), 'query common DP');
  },

  turnOn() {
    this.writePayload(ble.buildSetDpNumber(1, 0xff, 1), 'set DP 1 on ff');
  },

  turnOff() {
    this.writePayload(ble.buildSetDpNumber(1, 0, 1), 'set DP 1 off');
  },

  turnOnValue1() {
    this.writePayload(ble.buildSetDpNumber(1, 1, 1), 'set DP 1 on value 1');
  },

  startKeepAlive() {
    this.stopKeepAlive();
    this.sendKeepAlive();
    this.keepAliveTimer = setInterval(() => {
      this.sendKeepAlive();
    }, 20000);
  },
  stopKeepAlive() {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }
  },
  async sendKeepAlive() {
    if (this.keepAliveSending || !this.data.connected || !this.data.ready || !this.data.controlReady) {
      return false;
    }
    this.keepAliveSending = true;
    try {
      return await this.writePayload(ble.buildKeepAlive(), 'keepAlive');
    } finally {
      this.keepAliveSending = false;
    }
  }
});
