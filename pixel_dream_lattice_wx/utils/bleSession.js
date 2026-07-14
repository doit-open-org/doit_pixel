const ble = require('./bleProtocol');
const dotMatrixFont = require('./dotMatrixFont');

const listeners = {};

const state = {
  connected: false,
  ready: false,
  controlReady: false,
  deviceInfo: null,
  rssi: null,
  writer: null,
  logs: []
};

function log(message) {
  const line = '[BLESession] ' + message;
  console.log(line);
  state.logs = state.logs.concat(line).slice(-200);
  if (state.writer && state.writer.log) state.writer.log(message);
}

function on(name, handler) {
  if (!listeners[name]) listeners[name] = [];
  listeners[name].push(handler);
}

function emit(name, payload) {
  (listeners[name] || []).forEach((handler) => {
    try {
      handler(payload);
    } catch (err) {
      console.warn('[BLESession] listener error', err);
    }
  });
}

function bindWriter(writer) {
  state.writer = writer;
}

function update(next) {
  Object.assign(state, next || {});
}

function getState() {
  return Object.assign({}, state);
}

function bytesPayload(dpid, bytes) {
  const raw = bytes instanceof Uint8Array ? bytes : ble.hexToBytes(bytes);
  const out = new Uint8Array(3 + raw.length);
  out[0] = 0x03;
  out[1] = 1 + raw.length;
  out[2] = Number(dpid) & 0xff;
  out.set(raw, 3);
  return out;
}

function asciiPayload(dpid, value) {
  const text = String(value);
  const out = new Uint8Array(3 + text.length);
  out[0] = 0x03;
  out[1] = 1 + text.length;
  out[2] = Number(dpid) & 0xff;
  for (let i = 0; i < text.length; i += 1) {
    out[3 + i] = text.charCodeAt(i) & 0xff;
  }
  return out;
}

function normalizeValue(dpid, value) {
  if (Number(dpid) === 1 && Number(value) === 1) return 0xff;
  return value;
}

function buildDpPayload(dpid, value) {
  const normalized = normalizeValue(dpid, value);
  // DP14 is a 50-character ASCII timer string, not hex-encoded binary data.
  if (Number(dpid) === 14 && typeof normalized === 'string') {
    return asciiPayload(dpid, normalized);
  }
  if (typeof normalized === 'string') return bytesPayload(dpid, normalized);
  return ble.buildSetDpNumber(dpid, normalized);
}

async function writePayload(payload, title) {
  if (!state.writer || !state.writer.writePayload) {
    wx.showToast({ title: '请先连接设备', icon: 'error' });
    log('write blocked: no BLE writer');
    return false;
  }
  if (!state.controlReady) {
    wx.showToast({ title: '请先连接设备', icon: 'error' });
    log('write blocked: BLE not authenticated');
    return false;
  }
  return state.writer.writePayload(payload, title);
}

async function sendDpData(attr, data) {
  const ids = attr && attr.length ? attr : Object.keys(data || {});
  const chunks = [];
  for (let i = 0; i < ids.length; i += 1) {
    const id = Number(ids[i]);
    const value = data[String(id)] != null ? data[String(id)] : data[id];
    if (value == null) continue;
    const payload = buildDpPayload(id, value);
    log('DP dpid=' + id + ', value=' + value + ', payload=' + ble.bytesToHex(payload));
    chunks.push(payload);
  }
  if (!chunks.length) return true;

  // 拼接所有 DP 段为单个 payload，一次 BLE 写入发送
  let totalLen = 0;
  chunks.forEach(function (c) { totalLen += c.length; });
  const combined = new Uint8Array(totalLen);
  let offset = 0;
  chunks.forEach(function (c) {
    combined.set(c, offset);
    offset += c.length;
  });
  log('DP multi-write ' + chunks.length + ' DPs, total=' + totalLen + ' bytes, payload=' + ble.bytesToHex(combined));
  return writePayload(combined, 'lattice DP multi (' + chunks.length + ')');
}

function emitPanelData(data, cmd, type) {
  const payload = {
    data: {
      cmd: cmd || 3,
      type: type || 2,
      msg: {
        data: data || {}
      }
    }
  };
  emit('getDeviceData', payload);
  const pages = getCurrentPages ? getCurrentPages() : [];
  const page = pages && pages.length ? pages[pages.length - 1] : null;
  if (page && typeof page.TCPcallback === 'function') {
    page.TCPcallback(data || {}, cmd || 3, type || 2);
  }
}

function handleDeviceInfoRequest() {
  const info = state.deviceInfo || {};
  const data = {
    firmwareVersion: info.softwareVersion || info.firmwareVersion || '',
    signal: state.rssi != null ? state.rssi : 0,
    mpVersion: ''
  };
  log('local type=10 response ' + JSON.stringify(data));
  emitPanelData(data, 10, 10);
  return true;
}

function handleDotMatrixRequest(msg) {
  const text = msg && msg.str != null ? msg.str : '';
  const data = {
    str: dotMatrixFont.textToMatrixMap(text)
  };
  log('local type=70 dot matrix text=' + text);
  emitPanelData(data, 70, 70);
  return true;
}

async function handleSendCmd(cmd) {
  const type = String(cmd && cmd.type != null ? cmd.type : '');
  const msg = cmd && cmd.msg || {};

  if (type === '1') {
    const attr = msg.attr || [0];
    const payload = ble.buildQueryDp(attr);
    log('DP query attr=' + JSON.stringify(attr));
    return writePayload(payload, 'lattice query');
  }

  if (type === '2') {
    return sendDpData(msg.attr || [], msg.data || {});
  }

  if (type === '10') {
    return handleDeviceInfoRequest();
  }

  if (type === '70') {
    return handleDotMatrixRequest(msg);
  }

  return true;
}

function emitDpData(data, cmd) {
  emitPanelData(data, cmd || 3, 2);
}

module.exports = {
  bindWriter,
  update,
  getState,
  log,
  on,
  emit,
  handleSendCmd,
  sendDpData,
  emitDpData
};
