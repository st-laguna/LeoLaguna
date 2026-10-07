import sharp from 'sharp';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const source = fileURLToPath(new URL('../public/about/img/about_mobile/', import.meta.url));
const output = source + 'responsive/';
await mkdir(output, { recursive: true });
for (const asset of ['DOGS', 'GAMING', 'IPAD', 'PAINT', 'PC', 'TRAVEL']) {
  for (const size of [640, 960]) {
    await sharp(`${source}${asset}.webp`).trim({ threshold: 8 })
      .resize({ width: size, height: size, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85, effort: 5 }).toFile(`${output}${asset}-${size}.webp`);
  }
}
console.log('Generated 12 responsive stickers. Original assets preserved.');
