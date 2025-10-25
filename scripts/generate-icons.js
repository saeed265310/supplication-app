#!/usr/bin/env node

/**
 * Icon Generator for PWA
 *
 * This script generates PWA icons from a source image.
 *
 * Requirements:
 * - Install sharp: npm install --save-dev sharp
 * - Provide a source icon (512x512 or larger) at: public/icon-source.png
 *
 * Usage:
 * node scripts/generate-icons.js
 */

const fs = require('fs');
const path = require('path');

// Try to load sharp, provide instructions if not available
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed!');
  console.log('\nTo generate icons, install sharp:');
  console.log('  npm install --save-dev sharp');
  console.log('\nThen run this script again:');
  console.log('  node scripts/generate-icons.js');
  process.exit(1);
}

// Icon sizes for PWA
const ICON_SIZES = [72, 96, 128, 144, 152, 192, 384, 512];

// Paths
const SOURCE_ICON_PNG = path.join(__dirname, '../public/icon-source.png');
const SOURCE_ICON_SVG = path.join(__dirname, '../public/icon-source.svg');
const OUTPUT_DIR = path.join(__dirname, '../public/icons');

// Check if source icon exists (PNG or SVG)
let SOURCE_ICON;
if (fs.existsSync(SOURCE_ICON_PNG)) {
  SOURCE_ICON = SOURCE_ICON_PNG;
  console.log('Using PNG source icon');
} else if (fs.existsSync(SOURCE_ICON_SVG)) {
  SOURCE_ICON = SOURCE_ICON_SVG;
  console.log('Using SVG source icon');
} else {
  console.error('❌ Source icon not found!');
  console.log('\nPlease provide a source icon (512x512 or larger):');
  console.log(`  ${SOURCE_ICON_PNG} or ${SOURCE_ICON_SVG}`);
  console.log('\nYou can:');
  console.log('  1. Create a custom icon with your design');
  console.log('  2. Use an online tool like https://realfavicongenerator.net/');
  console.log('  3. Use a placeholder from https://via.placeholder.com/512x512');
  process.exit(1);
}

// Create icons directory if it doesn't exist
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log(`✓ Created directory: ${OUTPUT_DIR}`);
}

// Generate icons
async function generateIcons() {
  console.log('🎨 Generating PWA icons...\n');

  for (const size of ICON_SIZES) {
    const outputPath = path.join(OUTPUT_DIR, `icon-${size}x${size}.png`);

    try {
      await sharp(SOURCE_ICON)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Generated ${size}x${size} icon`);
    } catch (error) {
      console.error(`❌ Failed to generate ${size}x${size} icon:`, error.message);
    }
  }

  console.log('\n✅ All icons generated successfully!');
  console.log(`\nIcons saved to: ${OUTPUT_DIR}`);
}

generateIcons().catch((error) => {
  console.error('❌ Error generating icons:', error);
  process.exit(1);
});
