import sharp from 'sharp';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoPath = join(root, 'public/images/Logo.png');
const canvasSize = 512;
const logoScale = 0.87;
const logoSize = Math.round(canvasSize * logoScale);
const offset = Math.round((canvasSize - logoSize) / 2);
const radius = canvasSize / 2;

const circleMask = Buffer.from(
  `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="#fff"/>
  </svg>`,
);

const blackCircle = Buffer.from(
  `<svg width="${canvasSize}" height="${canvasSize}" xmlns="http://www.w3.org/2000/svg">
    <circle cx="${radius}" cy="${radius}" r="${radius}" fill="#000000"/>
  </svg>`,
);

const logo = await sharp(logoPath)
  .trim()
  .resize(logoSize, logoSize, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
  .toBuffer();

const squareComposite = await sharp({
  create: {
    width: canvasSize,
    height: canvasSize,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([
    { input: blackCircle, top: 0, left: 0 },
    { input: logo, top: offset, left: offset },
  ])
  .png()
  .toBuffer();

const circular = await sharp(squareComposite)
  .composite([{ input: circleMask, blend: 'dest-in' }])
  .png()
  .toBuffer();

await sharp(circular).resize(32, 32).png().toFile(join(root, 'public/favicon.png'));
await sharp(circular).resize(64, 64).png().toFile(join(root, 'public/favicon-64.png'));
await sharp(circular).resize(180, 180).png().toFile(join(root, 'public/apple-touch-icon.png'));

console.log('Circular favicons with black background generated.');
