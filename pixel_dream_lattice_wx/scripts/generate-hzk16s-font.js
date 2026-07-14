/*
 * Converts the bundled GB2312 HZK16 font into a WeChat Mini Program module.
 * Run from pixel_dream_lattice_wx with: node scripts/generate-hzk16s-font.js
 */
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const sourcePath = path.resolve(projectRoot, '..', 'hzk16s');
const outputPath = path.resolve(projectRoot, 'utils', 'hzk16sFontData.js');
const BYTES_PER_GLYPH = 32;
const GLYPH_COLUMNS = 94;
const FIRST_LEAD_BYTE = 0xa1;
const LAST_LEAD_BYTE = 0xf7;
const FIRST_TRAIL_BYTE = 0xa1;
const LAST_TRAIL_BYTE = 0xfe;

function buildOffsetToCodePointBytes(glyphCount) {
  const decoder = new TextDecoder('gbk', { fatal: false });
  const bytes = Buffer.alloc(glyphCount * 2);
  let supportedCharacterCount = 0;

  for (let lead = FIRST_LEAD_BYTE; lead <= LAST_LEAD_BYTE; lead += 1) {
    for (let trail = FIRST_TRAIL_BYTE; trail <= LAST_TRAIL_BYTE; trail += 1) {
      const char = decoder.decode(Uint8Array.of(lead, trail));
      if (char.length !== 1 || char === '\ufffd') continue;

      const offset = (lead - FIRST_LEAD_BYTE) * GLYPH_COLUMNS + trail - FIRST_TRAIL_BYTE;
      const codePoint = char.codePointAt(0);
      if (codePoint > 0xffff) throw new Error(`Unsupported non-BMP code point: ${codePoint}`);
      bytes.writeUInt16LE(codePoint, offset * 2);
      supportedCharacterCount += 1;
    }
  }

  return { bytes, supportedCharacterCount };
}

function wrapBase64(value) {
  const width = 4096;
  const rows = [];
  for (let index = 0; index < value.length; index += width) {
    rows.push(`  '${value.slice(index, index + width)}'`);
  }
  return `[\n${rows.join(',\n')}\n].join('')`;
}

function main() {
  const bytes = fs.readFileSync(sourcePath);
  const glyphCount = (LAST_LEAD_BYTE - FIRST_LEAD_BYTE + 1) * GLYPH_COLUMNS;
  const expectedLength = glyphCount * BYTES_PER_GLYPH;
  if (bytes.length !== expectedLength) {
    throw new Error(`Unexpected hzk16s size: ${bytes.length}, expected ${expectedLength}`);
  }

  const offsetToCodePoint = buildOffsetToCodePointBytes(glyphCount);
  const source = [
    '/* Generated from /hzk16s by scripts/generate-hzk16s-font.js. */',
    `const HZK16S_BASE64 = ${wrapBase64(bytes.toString('base64'))};`,
    `const OFFSET_TO_CODE_POINT_BASE64 = ${wrapBase64(offsetToCodePoint.bytes.toString('base64'))};`,
    '',
    'module.exports = {',
    '  HZK16S_BASE64,',
    '  OFFSET_TO_CODE_POINT_BASE64',
    '};',
    ''
  ].join('\n');

  fs.writeFileSync(outputPath, source, 'utf8');
  console.log(`Generated ${path.relative(projectRoot, outputPath)}: ${bytes.length} bytes, ${offsetToCodePoint.supportedCharacterCount} characters.`);
}

main();
