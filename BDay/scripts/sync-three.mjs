import { build } from 'esbuild';
import { mkdir, copyFile, stat } from 'node:fs/promises';
const destination = new URL('../public/assets/vendor/', import.meta.url);
await mkdir(destination, { recursive: true });
await build({
  entryPoints: ['public/js/mascot-scene.js'],
  outfile: 'public/assets/vendor/mascot-scene.bundle.js',
  bundle: true,
  minify: true,
  format: 'esm',
  target: 'es2020',
  legalComments: 'linked',
});
await copyFile(
  new URL('../node_modules/three/LICENSE', import.meta.url),
  new URL('three-LICENSE.txt', destination),
);
const output = await stat(new URL('mascot-scene.bundle.js', destination));
console.log(
  'Built the local 3D scene (' +
    Math.round(output.size / 1024) +
    ' KB) and preserved the Three.js license.',
);
