#!/usr/bin/env node

/**
 * Download Placeholder Icons for PWA Testing
 *
 * This script downloads placeholder icons from via.placeholder.com
 * for testing PWA functionality before creating custom icons.
 *
 * Usage:
 * node scripts/download-placeholder-icons.js
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Theme color (teal from app)
const COLOR = '0d9488';
const TEXT_COLOR = 'FFFFFF';

// Create icons directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Created directory: ${OUTPUT_DIR}`);
}

// Download icon from URL
function downloadIcon(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete partial file
      reject(err);
    });
  });
}

// Download all icons
async function downloadIcons() {
  console.log('📥 Downloading placeholder PWA icons...\n');
  console.log('Theme color: #0d9488 (Teal)\n');

  for (const size of ICON_SIZES) {
    const url = `https://via.placeholder.com/${size}x${size}/${COLOR}/${TEXT_COLOR}?text=%D8%B0%D9%83%D8%B1`;
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await downloadIcon(url, outputPath);
      console.log(`✓ Downloaded ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Failed to download ${size}x${size} icon:`, error.message);
    }
  }

  console.log('\n✅ All placeholder icons downloaded successfully!');
  console.log(`\nIcons saved to: ${OUTPUT_DIR}`);
  console.log('\n⚠️  Note: These are placeholder icons for testing.');
  console.log('For production, create custom icons following ICONS.md guide.\n');
}

downloadIcons().catch((error) => {
  console.error('❌ Error downloading icons:', error);
  process.exit(1);
});
