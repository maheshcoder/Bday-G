import sharp from 'sharp';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
const source = process.argv[2];
if (!source)
  throw new Error('Pass the generated transparent character atlas PNG.');
const image = await readFile(source);
const { data, info } = await sharp(image)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });
const xCounts = new Array(info.width).fill(0);
const yCounts = new Array(info.height).fill(0);
for (let y = 0; y < info.height; y++)
  for (let x = 0; x < info.width; x++) {
    if (data[(y * info.width + x) * 4 + 3] > 32) {
      xCounts[x]++;
      yCounts[y]++;
    }
  }
function separator(counts, target, radius) {
  let best = Math.round(target);
  for (
    let i = Math.max(0, best - radius);
    i < Math.min(counts.length, Math.round(target) + radius);
    i++
  ) {
    if (counts[i] < counts[best]) best = i;
  }
  if (counts[best] !== 0)
    throw new Error(
      'The generated poses overlap; inspect the source atlas before slicing.',
    );
  return best;
}
const columns = [
  0,
  separator(xCounts, info.width / 3, 35),
  separator(xCounts, (info.width * 2) / 3, 35),
  info.width,
];
const rows = [
  0,
  separator(yCounts, info.height / 4, 40),
  separator(yCounts, info.height / 2, 40),
  separator(yCounts, (info.height * 3) / 4, 40),
  info.height,
];
const poses = [];
for (let row = 0; row < 4; row++)
  for (let col = 0; col < 3; col++) {
    const extracted = await sharp(image)
      .extract({
        left: columns[col],
        top: rows[row],
        width: columns[col + 1] - columns[col],
        height: rows[row + 1] - rows[row],
      })
      .png()
      .toBuffer();
    const pose = await sharp(extracted).trim({ threshold: 2 }).png().toBuffer();
    const metadata = await sharp(pose).metadata();
    poses.push({ image: pose, width: metadata.width, height: metadata.height });
  }
const scale = Math.min(
  232 / Math.max(...poses.map((pose) => pose.width)),
  290 / Math.max(...poses.map((pose) => pose.height)),
);
const tiles = [];
for (const pose of poses) {
  const width = Math.round(pose.width * scale);
  const height = Math.round(pose.height * scale);
  const resized = await sharp(pose.image)
    .resize(width, height)
    .png()
    .toBuffer();
  tiles.push(
    await sharp({
      create: {
        width: 256,
        height: 320,
        channels: 4,
        background: { r: 0, g: 0, b: 0, alpha: 0 },
      },
    })
      .composite([
        {
          input: resized,
          left: Math.round((256 - width) / 2),
          top: 304 - height,
        },
      ])
      .png()
      .toBuffer(),
  );
}
await mkdir('public/assets/chibi', { recursive: true });
await sharp({
  create: {
    width: 768,
    height: 1280,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite(
    tiles.map((input, index) => ({
      input,
      left: (index % 3) * 256,
      top: Math.floor(index / 3) * 320,
    })),
  )
  .webp({ quality: 90, alphaQuality: 100 })
  .toFile('public/assets/chibi/expressions.webp');
await writeFile(
  'public/assets/chibi/atlas.json',
  JSON.stringify(
    {
      columns: 3,
      rows: 4,
      tileWidth: 256,
      tileHeight: 320,
      expressions: [
        'laughing',
        'teary',
        'unimpressed',
        'frustrated',
        'thinking',
        'sleepy',
        'waving',
        'surprised',
        'shy',
        'pouting',
        'blushing',
        'excited',
      ],
    },
    null,
    2,
  ) + '\n',
);
console.log(
  'Prepared all 12 reference-style expressions as a transparent 768x1280 atlas.',
);
