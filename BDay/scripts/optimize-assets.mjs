import sharp from 'sharp';
import { mkdir, readFile } from 'node:fs/promises';
import path from 'node:path';
const source = process.argv[2];
if (!source)
  throw new Error('Pass the generated-image directory as the first argument.');
const assets = [
  ['exec-ae40bddb-5839-4f31-bcf4-0737b1393a42.png', 'hero', 900],
  ['exec-70e29c3a-582f-4327-b774-c700b4506cba.png', 'welcome', 760],
  ['exec-780f124c-957c-48a8-8771-07f9872e4a90.png', 'success', 600],
];
await mkdir('public/assets', { recursive: true });
for (const [filename, name, size] of assets) {
  const output = 'public/assets/' + name + '.webp';
  await sharp(await readFile(path.join(source, filename)))
    .resize(size, size)
    .webp({ quality: 84, alphaQuality: 95 })
    .toFile(output);
  const meta = await sharp(output).metadata();
  console.log(
    name + ': ' + meta.width + '×' + meta.height + ', alpha=' + meta.hasAlpha,
  );
}
