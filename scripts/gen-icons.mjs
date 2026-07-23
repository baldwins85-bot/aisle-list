// Generates app icons from an inline SVG using sharp (already a dep via Next).
// Run: node scripts/gen-icons.mjs
import sharp from "sharp";
import { mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

// Full-bleed emerald square with a white shopping-cart glyph (Feather icon,
// MIT). iOS masks its own rounded corners, so we keep the square full.
function svg({ maskable }) {
  // Maskable variant keeps the glyph inside the center ~80% safe zone.
  const scale = maskable ? 11 : 13.5;
  const w = 24 * scale;
  const tx = (512 - w) / 2;
  const ty = (512 - 22 * scale) / 2 - (maskable ? 0 : 6);
  return `<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#10b981"/>
      <stop offset="1" stop-color="#047857"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#g)"/>
  <g transform="translate(${tx} ${ty}) scale(${scale})" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
    <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    <circle cx="9" cy="21" r="1.35" fill="#ffffff" stroke="none"/>
    <circle cx="20" cy="21" r="1.35" fill="#ffffff" stroke="none"/>
  </g>
</svg>`;
}

const standard = Buffer.from(svg({ maskable: false }));
const maskable = Buffer.from(svg({ maskable: true }));

await mkdir(join(root, "public"), { recursive: true });

const jobs = [
  // App Router metadata conventions (auto-linked by Next).
  [standard, 180, join(root, "app", "apple-icon.png")],
  [standard, 96, join(root, "app", "icon.png")],
  // Manifest icons.
  [standard, 192, join(root, "public", "icon-192.png")],
  [standard, 512, join(root, "public", "icon-512.png")],
  [maskable, 512, join(root, "public", "icon-512-maskable.png")],
  // Handy for later App Store / marketing use.
  [standard, 1024, join(root, "public", "icon-1024.png")],
];

for (const [buf, size, out] of jobs) {
  await sharp(buf).resize(size, size).png().toFile(out);
  console.log(`wrote ${out} (${size}px)`);
}
