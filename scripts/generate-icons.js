const fs = require('fs');
const path = require('path');

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate luxury SVG icons for PWA
const createSvgIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect width="${size}" height="${size}" rx="${size * 0.15}" fill="#1F1F1F"/>
  <defs>
    <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#F2E9DA" />
      <stop offset="40%" stop-color="#DCC9A6" />
      <stop offset="100%" stop-color="#B67355" />
    </linearGradient>
  </defs>
  <g transform="translate(${size * 0.2}, ${size * 0.15}) scale(${size * 0.006})">
    <!-- Stylized A -->
    <path d="M 50 12 L 20 85 L 32 85 L 43 58 L 57 58 L 68 85 L 80 85 Z" fill="url(#goldGrad)" opacity="0.95" />
    <!-- Cutout -->
    <path d="M 50 28 L 45 52 L 55 52 Z" fill="#1F1F1F" />
    <!-- Woman silhouette & hat curve -->
    <path d="M 50 14 C 54 14, 58 17, 60 21 C 62 25, 60 29, 58 32 C 63 36, 68 43, 67 52 C 65 62, 55 70, 42 78 C 36 82, 30 84, 25 85 C 32 81, 42 74, 49 65 C 56 56, 57 48, 54 42 C 51 38, 48 35, 47 31 C 45 25, 46 19, 50 14 Z" fill="url(#goldGrad)" />
    <!-- Flowing Hair -->
    <path d="M 60 25 C 68 33, 72 45, 69 56 C 65 68, 52 77, 35 84" stroke="url(#goldGrad)" stroke-width="2.5" stroke-linecap="round" />
  </g>
  <text x="50%" y="82%" font-family="Georgia, serif" font-size="${size * 0.1}" font-weight="bold" letter-spacing="${size * 0.03}" fill="url(#goldGrad)" text-anchor="middle">ARMIA</text>
</svg>
`;

fs.writeFileSync(path.join(iconsDir, 'icon.svg'), createSvgIcon(512));
fs.writeFileSync(path.join(iconsDir, 'icon-192x192.svg'), createSvgIcon(192));
fs.writeFileSync(path.join(iconsDir, 'icon-512x512.svg'), createSvgIcon(512));

console.log('Icons generated successfully.');
