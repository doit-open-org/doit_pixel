/* Build-time helper. Requires sharp and writes local gallery preview assets. */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const sourceRoot = path.resolve(__dirname, '../../lattice/img/pic');
const outputRoot = path.resolve(__dirname, '../pkg_lattice/img/pic');
const staticOutput = path.join(outputRoot, 'thumb');
const dynamicOutput = path.join(outputRoot, 'dongtu_thumb');
const staticSize = 180;
const dynamicSize = 160;
const maxGifFrames = 24;
const maxStaticPreviews = 30;
const maxDynamicPreviews = 21;
const staticOnly = process.argv.includes('--static-only');

function imageIds(directory, extension, maximumId) {
  return fs.readdirSync(directory)
    .filter((name) => {
      if (path.extname(name).toLowerCase() !== extension) return false;
      const id = Number(path.basename(name, extension));
      return Number.isInteger(id) && id >= 1 && id <= maximumId;
    })
    .sort((left, right) => Number(path.basename(left, extension)) - Number(path.basename(right, extension)));
}

function decodeBmp(input) {
  const file = fs.readFileSync(input);
  const offset = file.readUInt32LE(10);
  const width = file.readInt32LE(18);
  const signedHeight = file.readInt32LE(22);
  const bitsPerPixel = file.readUInt16LE(28);
  if (bitsPerPixel !== 24 || width <= 0 || signedHeight === 0) {
    throw new Error('Unsupported BMP preview source: ' + input);
  }

  const height = Math.abs(signedHeight);
  const rowStride = Math.floor((width * 3 + 3) / 4) * 4;
  const pixels = Buffer.alloc(width * height * 3);
  for (let y = 0; y < height; y += 1) {
    const sourceY = signedHeight > 0 ? height - 1 - y : y;
    for (let x = 0; x < width; x += 1) {
      const source = offset + sourceY * rowStride + x * 3;
      const target = (y * width + x) * 3;
      pixels[target] = file[source + 2];
      pixels[target + 1] = file[source + 1];
      pixels[target + 2] = file[source];
    }
  }
  return { pixels: pixels, width: width, height: height };
}

function staticPipeline(input) {
  const header = fs.readFileSync(input, { encoding: null, flag: 'r' }).subarray(0, 2).toString('ascii');
  if (header !== 'BM') return sharp(input);
  const bitmap = decodeBmp(input);
  return sharp(bitmap.pixels, { raw: { width: bitmap.width, height: bitmap.height, channels: 3 } });
}

async function makeStaticPreview(name) {
  await staticPipeline(path.join(sourceRoot, name))
    .resize(staticSize, staticSize, { fit: 'inside', withoutEnlargement: true })
    .png({ palette: true, colours: 128, compressionLevel: 9, effort: 8 })
    .toFile(path.join(staticOutput, path.basename(name, '.png') + '.png'));
}

async function makeDynamicPreview(name) {
  const input = path.join(sourceRoot, 'dongtu', name);
  const metadata = await sharp(input, { animated: true }).metadata();
  const pages = metadata.pages || 1;
  const sourceDelays = metadata.delay || [];
  const frameStep = Math.max(1, Math.ceil(pages / maxGifFrames));
  const frames = [];
  const delays = [];
  let accumulatedDelay = 0;

  for (let page = 0; page < pages; page += 1) {
    accumulatedDelay += Number(sourceDelays[page] || 100);
    if (page % frameStep !== 0 && page !== pages - 1) continue;

    const frame = await sharp(input, { animated: true, page: page, pages: 1 })
      .resize(dynamicSize, dynamicSize, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 0 }
      })
      .png()
      .toBuffer();
    frames.push(frame);
    delays.push(Math.max(80, Math.min(1000, accumulatedDelay)));
    accumulatedDelay = 0;
  }

  await sharp(frames, { join: { animated: true } })
    .gif({
      colours: 96,
      effort: 8,
      dither: 0,
      loop: 0,
      delay: delays,
      interFrameMaxError: 8,
      interPaletteMaxError: 16
    })
    .toFile(path.join(dynamicOutput, name));

  return { sourceFrames: pages, previewFrames: frames.length };
}

async function main() {
  fs.mkdirSync(staticOutput, { recursive: true });
  fs.mkdirSync(dynamicOutput, { recursive: true });

  const staticNames = imageIds(sourceRoot, '.png', maxStaticPreviews);
  for (const name of staticNames) {
    await makeStaticPreview(name);
    console.log('static ' + name);
  }

  if (!staticOnly) {
    const dynamicNames = imageIds(path.join(sourceRoot, 'dongtu'), '.gif', maxDynamicPreviews);
    for (const name of dynamicNames) {
      const result = await makeDynamicPreview(name);
      console.log('dynamic ' + name + ': ' + result.sourceFrames + ' -> ' + result.previewFrames + ' frames');
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
