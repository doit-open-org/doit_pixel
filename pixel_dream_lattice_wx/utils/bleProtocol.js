const READ_UUID_SHORT = '2B10';
const WRITE_UUID_SHORT = '2B11';
const READ_UUID2_SHORT = '2B12';

function normalizeUuid(uuid) {
  return String(uuid || '').toUpperCase();
}

function shortUuid(uuid) {
  const raw = normalizeUuid(uuid).replace(/-/g, '');
  if (raw.length === 4) return raw;
  if (raw.length === 32 && raw.startsWith('0000')) return raw.slice(4, 8);
  return raw;
}

function uuidMatches(uuid, shortId) {
  return shortUuid(uuid) === normalizeUuid(shortId);
}

function bytesToHex(bytes) {
  return Array.prototype.map.call(bytes || [], function (b) {
    return ('00' + (b & 0xff).toString(16)).slice(-2);
  }).join('').toUpperCase();
}

function abToBytes(buffer) {
  if (!buffer) return new Uint8Array(0);
  if (buffer instanceof Uint8Array) return buffer;
  return new Uint8Array(buffer);
}

function abToHex(buffer) {
  return bytesToHex(abToBytes(buffer));
}

function bytesToAb(bytes) {
  const out = new Uint8Array(bytes.length);
  out.set(bytes);
  return out.buffer;
}

function bytesToAscii(bytes) {
  let text = '';
  for (let i = 0; i < bytes.length; i += 1) {
    text += String.fromCharCode(bytes[i]);
  }
  return text;
}

function hexToBytes(hex) {
  const clean = String(hex || '').replace(/\s+/g, '');
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16) || 0;
  }
  return out;
}

function writeU32LE(out, offset, value) {
  const n = Number(value) >>> 0;
  out[offset] = n & 0xff;
  out[offset + 1] = (n >>> 8) & 0xff;
  out[offset + 2] = (n >>> 16) & 0xff;
  out[offset + 3] = (n >>> 24) & 0xff;
}

function readU16LE(bytes, offset) {
  return (bytes[offset] || 0) | ((bytes[offset + 1] || 0) << 8);
}

function readU32LE(bytes, offset) {
  return ((bytes[offset] || 0) |
    ((bytes[offset + 1] || 0) << 8) |
    ((bytes[offset + 2] || 0) << 16) |
    ((bytes[offset + 3] || 0) << 24)) >>> 0;
}

function crc8(bytes, length) {
  const end = length == null ? bytes.length : length;
  let crc = 0x00;
  for (let i = 0; i < end; i += 1) {
    crc ^= bytes[i] & 0xff;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x80) ? (((crc << 1) ^ 0x07) & 0xff) : ((crc << 1) & 0xff);
    }
  }
  return crc & 0xff;
}

function slicePayload(payload, pv) {
  const body = abToBytes(payload);
  const version = pv === 3 ? 0x03 : 0x01;
  const count = Math.max(1, Math.ceil(body.length / 17));
  const packets = [];

  for (let i = 0; i < count; i += 1) {
    const packet = new Uint8Array(20);
    packet[0] = version;
    packet[1] = i;
    if (i === count - 1) packet[1] |= 0x80;

    const start = i * 17;
    const part = body.slice(start, start + 17);
    packet.set(part, 2);
    packet[19] = crc8(packet, 19);
    packets.push(packet.buffer);
  }

  return packets;
}

function parseTransportFrame(buffer) {
  const bytes = abToBytes(buffer);
  if (bytes.length < 20) {
    return { ok: false, error: 'frame length < 20', hex: abToHex(buffer) };
  }
  const frame = bytes.slice(0, 20);
  const expected = crc8(frame, 19);
  const actual = frame[19];
  return {
    ok: expected === actual,
    pv: frame[0],
    sn: frame[1],
    index: frame[1] & 0x7f,
    isLast: (frame[1] & 0x80) !== 0,
    payload: frame.slice(2, 19),
    crcExpected: expected,
    crcActual: actual,
    hex: bytesToHex(frame)
  };
}

function reassembleFrames(frames) {
  const sorted = frames.slice().sort(function (a, b) {
    return (a.index || 0) - (b.index || 0);
  });
  const total = new Uint8Array(sorted.length * 17);
  sorted.forEach(function (frame, i) {
    total.set(frame.payload, i * 17);
  });
  return total;
}

function buildGetDeviceInfo() {
  const out = new Uint8Array(6);
  out[0] = 0x00;
  out[1] = 0x04;
  writeU32LE(out, 2, Math.floor(Date.now() / 1000));
  return out;
}

function buildQueryDp(dpids) {
  const ids = dpids || [];
  const out = new Uint8Array(2 + ids.length);
  out[0] = 0x02;
  out[1] = ids.length & 0xff;
  ids.forEach(function (id, i) {
    out[2 + i] = Number(id) & 0xff;
  });
  return out;
}

function numberToLEBytes(value, byteWidth) {
  let width = byteWidth;
  const n = Number(value);
  if (!width) {
    if (n <= 0xff) width = 1;
    else if (n <= 0xffff) width = 2;
    else width = 4;
  }

  const out = new Uint8Array(width);
  let remain = n >>> 0;
  for (let i = 0; i < width; i += 1) {
    out[i] = remain & 0xff;
    remain = Math.floor(remain / 256);
  }
  return out;
}

function buildSetDpNumber(dpid, value, byteWidth) {
  const valueBytes = numberToLEBytes(value, byteWidth);
  const out = new Uint8Array(3 + valueBytes.length);
  out[0] = 0x03;
  out[1] = 1 + valueBytes.length;
  out[2] = Number(dpid) & 0xff;
  out.set(valueBytes, 3);
  return out;
}

function buildSetDpBytes(dpid, valueBytes) {
  const bytes = abToBytes(valueBytes);
  const out = new Uint8Array(3 + bytes.length);
  out[0] = 0x03;
  out[1] = 1 + bytes.length;
  out[2] = Number(dpid) & 0xff;
  out.set(bytes, 3);
  return out;
}

function buildKeepAlive() {
  const out = new Uint8Array(6);
  out[0] = 0x08;
  out[1] = 0x04;
  writeU32LE(out, 2, Math.floor(Date.now() / 1000));
  return out;
}

function buildBleResetDevice() {
  const out = new Uint8Array(3);
  out[0] = 0x04;
  out[1] = 0x01;
  out[2] = 0x01;
  return out;
}

function generateDevKey() {
  return String(Date.now()).slice(-10);
}

function normalizeDevKey(devKey) {
  const key = String(devKey || '').replace(/\D/g, '');
  if (key.length >= 10) return key.slice(-10);
  return (key + '0000000000').slice(0, 10);
}

function buildLocalAuth(type, devKey) {
  const out = new Uint8Array(155);
  const flag = type === 1 ? 0x01 : 0x02;
  const key = normalizeDevKey(devKey || generateDevKey());

  out[0] = 0x01;
  out[1] = 153;
  for (let i = 0; i < 32; i += 1) out[2 + i] = flag;
  for (let i = 0; i < 10; i += 1) out[104 + i] = key.charCodeAt(i) || 0x30;
  writeU32LE(out, 147, 0);
  writeU32LE(out, 151, 0);
  return out;
}

function parseDeviceInfo(bytes) {
  if (bytes.length < 34 || bytes[2] !== 0x00) return null;
  const software = readU32LE(bytes, 14);
  const hardware = readU32LE(bytes, 18);
  return {
    deviceId: bytesToHex(bytes.slice(3, 13)).toLowerCase(),
    devType: bytes[13],
    softwareVersion: 'v' + ((software >>> 16) & 0xffff) + '.' + ((software >>> 8) & 0xff) + '.' + (software & 0xff),
    hardwareVersion: hardware,
    mac: bytesToHex(bytes.slice(22, 28)),
    pid: String.fromCharCode.apply(null, Array.prototype.slice.call(bytes.slice(28, 34))).replace(/\0/g, '')
  };
}

function parseDpSegments(bytes) {
  const data = {};
  let offset = 0;
  while (offset + 2 < bytes.length) {
    const cmd = bytes[offset];
    if (cmd === 0x00) break;
    const len = bytes[offset + 1];
    const dpid = bytes[offset + 2];
    const valueLen = len - 1;
    if (len <= 0 || offset + 2 + len > bytes.length) break;

    const value = bytes.slice(offset + 3, offset + 3 + valueLen);
    let parsed;
    if (dpid === 14) parsed = bytesToAscii(value);
    else if (valueLen === 1) parsed = value[0];
    else if (valueLen === 2) parsed = readU16LE(value, 0);
    else if (valueLen === 3 || valueLen === 4) parsed = readU32LE(value, 0);
    else parsed = bytesToHex(value);

    data[String(dpid)] = parsed;
    offset += len + 2;
  }
  return data;
}

function parseBusinessPayload(payload) {
  const bytes = abToBytes(payload);
  const cmd = bytes[0];
  const result = {
    cmd: cmd,
    rawHex: bytesToHex(bytes)
  };

  if (cmd === 0x00) {
    result.type = 'deviceInfo';
    result.status = bytes[2];
    result.deviceInfo = parseDeviceInfo(bytes);
  } else if (cmd === 0x01) {
    result.type = 'auth';
    result.status = bytes[2];
  } else if (cmd === 0x02 || cmd === 0x03 || cmd === 0x0a) {
    result.type = 'dp';
    result.data = parseDpSegments(bytes);
  } else if (cmd === 0x05) {
    result.type = 'ota';
    result.status = bytes[2];
  } else if (cmd === 0x0c) {
    result.type = 'configStatus';
    result.status = bytes[2];
  } else {
    result.type = 'unknown';
  }

  return result;
}

function parseManufacturerData(buffer) {
  const raw = abToBytes(buffer);
  let bytes = raw;
  let companyId = '';

  if (raw.length === 26) {
    companyId = bytesToHex(raw.slice(0, 2));
    bytes = raw.slice(2);
  } else if (raw.length > 24) {
    bytes = raw.slice(raw.length - 24);
  }

  const result = {
    rawHex: bytesToHex(raw),
    payloadHex: bytesToHex(bytes),
    companyId: companyId,
    valid: bytes.length === 24,
    length: raw.length,
    payloadLength: bytes.length
  };

  if (!result.valid) return result;

  result.boundFlag = bytes[0];
  result.isBound = bytes[0] === 0x01;
  result.advDeviceId = bytesToHex(bytes.slice(1, 11)).toLowerCase();
  result.chipProvider = bytes[23];
  return result;
}

function parseServiceData(serviceData) {
  const parsed = [];
  Object.keys(serviceData || {}).forEach(function (uuid) {
    const bytes = abToBytes(serviceData[uuid]);
    if (bytes.length < 14) return;
    const pidBytes = bytes.slice(2, 8);
    const macBytes = bytes.slice(8, 14);
    const mac = Array.prototype.slice.call(macBytes).reverse().map(function (b) {
      return ('00' + b.toString(16)).slice(-2).toUpperCase();
    }).join(':');

    parsed.push({
      serviceUuid: uuid,
      pv: bytes[0],
      dt: bytes[1],
      pid: String.fromCharCode.apply(null, Array.prototype.slice.call(pidBytes)).replace(/\0/g, ''),
      mac: mac,
      rawHex: bytesToHex(bytes)
    });
  });
  return parsed;
}

module.exports = {
  READ_UUID_SHORT: READ_UUID_SHORT,
  WRITE_UUID_SHORT: WRITE_UUID_SHORT,
  READ_UUID2_SHORT: READ_UUID2_SHORT,
  abToHex: abToHex,
  bytesToAb: bytesToAb,
  bytesToHex: bytesToHex,
  hexToBytes: hexToBytes,
  shortUuid: shortUuid,
  uuidMatches: uuidMatches,
  crc8: crc8,
  slicePayload: slicePayload,
  parseTransportFrame: parseTransportFrame,
  reassembleFrames: reassembleFrames,
  buildGetDeviceInfo: buildGetDeviceInfo,
  buildQueryDp: buildQueryDp,
  buildSetDpNumber: buildSetDpNumber,
  buildSetDpBytes: buildSetDpBytes,
  buildKeepAlive: buildKeepAlive,
  buildBleResetDevice: buildBleResetDevice,
  generateDevKey: generateDevKey,
  buildLocalAuth: buildLocalAuth,
  parseBusinessPayload: parseBusinessPayload,
  parseManufacturerData: parseManufacturerData,
  parseServiceData: parseServiceData
};
