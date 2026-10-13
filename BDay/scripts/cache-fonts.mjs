import { mkdir, writeFile } from 'node:fs/promises';
const endpoint =
  'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Fraunces:ital,wght@0,400;0,500;0,600;1,400;1,500&display=swap';
const response = await fetch(endpoint, {
  headers: { 'User-Agent': 'Mozilla/5.0 Chrome/138.0.0.0 Safari/537.36' },
});
if (!response.ok)
  throw new Error('Could not fetch font CSS: ' + response.status);
let css = await response.text();
await mkdir('public/assets/fonts', { recursive: true });
const urls = [
  ...new Set(
    Array.from(
      css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g),
      (match) => match[1],
    ),
  ),
];
let count = 0;
for (const url of urls) {
  const font = await fetch(url);
  if (!font.ok) throw new Error('Could not fetch a font: ' + font.status);
  const filename = 'font-' + ++count + '.woff2';
  await writeFile(
    'public/assets/fonts/' + filename,
    Buffer.from(await font.arrayBuffer()),
  );
  css = css.replaceAll(url, 'assets/fonts/' + filename);
}
for (const family of ['dmsans', 'fraunces']) {
  const license = await fetch(
    'https://raw.githubusercontent.com/google/fonts/main/ofl/' +
      family +
      '/OFL.txt',
  );
  if (!license.ok) throw new Error('Could not fetch font license: ' + family);
  await writeFile(
    'public/assets/fonts/' + family + '-OFL.txt',
    await license.text(),
  );
}
await writeFile('public/fonts.css', css);
console.log(
  'Cached ' +
    count +
    ' font files and both OFL licenses for reliable local typography.',
);
