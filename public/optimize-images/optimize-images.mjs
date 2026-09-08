import sharp from 'sharp';
import { readdir, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// ── Configuración ──────────────────────────────────────────
const INPUT_DIR  = './public/images';   // carpeta con tus imágenes
const OUTPUT_DIR = './public/images/optimized'; // carpeta de salida
const MAX_WIDTH  = 1920;               // ancho máximo en pixels

// ── Formatos a generar ─────────────────────────────────────
const FORMATS = [
  { ext: 'webp', options: { quality: 88 } },
  { ext: 'avif', options: { quality: 85 } },
];

// ── Extensiones que procesa ────────────────────────────────
const VALID_EXTENSIONS = ['.jpg', '.jpeg', '.png'];

async function optimizeImages() {
  // Crear carpeta de salida si no existe
  if (!existsSync(OUTPUT_DIR)) {
    await mkdir(OUTPUT_DIR, { recursive: true });
  }

  const files = await readdir(INPUT_DIR);
  const images = files.filter(f => 
    VALID_EXTENSIONS.includes(path.extname(f).toLowerCase())
  );

  console.log(`\n🔍 Encontradas ${images.length} imágenes...\n`);

  for (const file of images) {
    const inputPath = path.join(INPUT_DIR, file);
    const baseName  = path.parse(file).name;

    for (const format of FORMATS) {
      const outputPath = path.join(OUTPUT_DIR, `${baseName}.${format.ext}`);
      
      await sharp(inputPath)
        .resize({ width: MAX_WIDTH, withoutEnlargement: true })
        .toFormat(format.ext, format.options)
        .toFile(outputPath);

      console.log(`✅ ${file} → ${baseName}.${format.ext}`);
    }
  }

  console.log('\n🎉 ¡Todas las imágenes optimizadas!\n');
}

optimizeImages().catch(console.error);