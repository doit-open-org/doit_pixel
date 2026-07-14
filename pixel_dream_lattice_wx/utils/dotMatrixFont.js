const hzk16s = require('./hzk16sFontData');

const FONT_5X7 = {
  '0': ['01110', '10001', '10011', '10101', '11001', '10001', '01110'],
  '1': ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
  '2': ['01110', '10001', '00001', '00010', '00100', '01000', '11111'],
  '3': ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
  '4': ['00010', '00110', '01010', '10010', '11111', '00010', '00010'],
  '5': ['11111', '10000', '10000', '11110', '00001', '00001', '11110'],
  '6': ['01110', '10000', '10000', '11110', '10001', '10001', '01110'],
  '7': ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
  '8': ['01110', '10001', '10001', '01110', '10001', '10001', '01110'],
  '9': ['01110', '10001', '10001', '01111', '00001', '00001', '01110'],
  'A': ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
  'B': ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
  'C': ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
  'D': ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
  'E': ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
  'F': ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
  'G': ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
  'H': ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
  'I': ['01110', '00100', '00100', '00100', '00100', '00100', '01110'],
  'J': ['00001', '00001', '00001', '00001', '10001', '10001', '01110'],
  'K': ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
  'L': ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
  'M': ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
  'N': ['10001', '11001', '10101', '10011', '10001', '10001', '10001'],
  'O': ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
  'P': ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
  'Q': ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
  'R': ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
  'S': ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
  'T': ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
  'U': ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
  'V': ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
  'W': ['10001', '10001', '10001', '10101', '10101', '10101', '01010'],
  'X': ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
  'Y': ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
  'Z': ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
  '-': ['00000', '00000', '00000', '11111', '00000', '00000', '00000'],
  '_': ['00000', '00000', '00000', '00000', '00000', '00000', '11111'],
  '.': ['00000', '00000', '00000', '00000', '00000', '01100', '01100'],
  ':': ['00000', '01100', '01100', '00000', '01100', '01100', '00000'],
  ' ': ['00000', '00000', '00000', '00000', '00000', '00000', '00000']
};

function blankRow() {
  return '0000000000000000';
}

function render5x7(pattern) {
  const rows = [blankRow(), blankRow(), blankRow(), blankRow()];
  pattern.forEach((line) => {
    let row = '0000';
    for (let i = 0; i < line.length; i += 1) {
      row += line[i] === '1' ? '11' : '00';
    }
    rows.push(row + '00');
  });
  while (rows.length < 16) rows.push(blankRow());
  return rows;
}

function fallbackGlyph(char) {
  const code = char.charCodeAt(0) || 0;
  const rows = [];
  for (let y = 0; y < 16; y += 1) {
    let row = '';
    for (let x = 0; x < 16; x += 1) {
      const border = x === 0 || y === 0 || x === 15 || y === 15;
      const bit = ((code >> ((x + y) % 12)) ^ x ^ (y * 3)) & 1;
      row += border || (x > 2 && x < 13 && y > 2 && y < 13 && bit) ? '1' : '0';
    }
    rows.push(row);
  }
  return rows;
}

let hzk16sBytes = null;
let hzk16sCodePointBytes = null;
const glyphOffsetCache = Object.create(null);

function decodeBase64(base64) {
  if (typeof wx !== 'undefined' && typeof wx.base64ToArrayBuffer === 'function') {
    return new Uint8Array(wx.base64ToArrayBuffer(base64));
  }

  if (typeof Buffer !== 'undefined') {
    return Uint8Array.from(Buffer.from(base64, 'base64'));
  }

  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function getHzk16sBytes() {
  if (!hzk16sBytes) hzk16sBytes = decodeBase64(hzk16s.HZK16S_BASE64);
  return hzk16sBytes;
}

function getHzk16sCodePointBytes() {
  if (!hzk16sCodePointBytes) {
    hzk16sCodePointBytes = decodeBase64(hzk16s.OFFSET_TO_CODE_POINT_BASE64);
  }
  return hzk16sCodePointBytes;
}

function byteToBits(value) {
  let row = '';
  for (let bit = 7; bit >= 0; bit -= 1) {
    row += (value & (1 << bit)) !== 0 ? '1' : '0';
  }
  return row;
}

function readUint16LittleEndian(bytes, index) {
  return bytes[index] | (bytes[index + 1] << 8);
}

function findHzkGlyphOffset(codePoint) {
  const cacheKey = String(codePoint);
  if (Object.prototype.hasOwnProperty.call(glyphOffsetCache, cacheKey)) {
    return glyphOffsetCache[cacheKey];
  }

  const codePointBytes = getHzk16sCodePointBytes();
  let glyphOffset = -1;
  for (let index = 0; index < codePointBytes.length; index += 2) {
    if (readUint16LittleEndian(codePointBytes, index) === codePoint) {
      glyphOffset = index / 2;
      break;
    }
  }
  glyphOffsetCache[cacheKey] = glyphOffset;
  return glyphOffset;
}

function hzk16sGlyph(char) {
  const codePoint = String(char || '').codePointAt(0);
  const glyphOffset = findHzkGlyphOffset(codePoint);
  if (glyphOffset < 0) return null;

  const bytes = getHzk16sBytes();
  const firstByte = glyphOffset * 32;
  if (firstByte + 31 >= bytes.length) return null;

  const rows = [];
  for (let row = 0; row < 16; row += 1) {
    rows.push(byteToBits(bytes[firstByte + row * 2]) + byteToBits(bytes[firstByte + row * 2 + 1]));
  }
  return rows;
}

function charToMatrix(char) {
  const rawChar = String(char || ' ');
  const hzkGlyph = hzk16sGlyph(rawChar);
  if (hzkGlyph) return hzkGlyph;

  const key = rawChar.toUpperCase();
  if (FONT_5X7[key]) return render5x7(FONT_5X7[key]);
  return fallbackGlyph(rawChar || '?');
}

function textToMatrixMap(text) {
  const out = {};
  Array.from(String(text || '')).forEach((char) => {
    out[char] = charToMatrix(char);
  });
  return out;
}

module.exports = {
  charToMatrix,
  textToMatrixMap
};
