# PWA Icons Setup Guide

The Progressive Web App requires icons in multiple sizes for different devices and use cases.

## Required Icon Sizes

- **72x72** - Android Chrome
- **96x96** - Android Chrome, shortcuts
- **128x128** - Android Chrome
- **144x144** - Windows
- **152x152** - iOS, iPad
- **192x192** - Android Chrome (required)
- **384x384** - Android Chrome
- **512x512** - Android Chrome (required), maskable

## Option 1: Automated Generation (Recommended)

### Step 1: Install Dependencies

```bash
npm install --save-dev sharp
```

### Step 2: Prepare Source Icon

Create or download a **512x512px** PNG icon and save it as:
```
public/icon-source.png
```

**Icon Design Tips:**
- Use a simple, recognizable design
- Ensure good contrast for visibility
- Consider the app theme color (teal: #0d9488)
- Test how it looks on both light and dark backgrounds
- For maskable icons, keep important content in the center "safe zone" (80% of the image)

### Step 3: Generate Icons

```bash
node scripts/generate-icons.js
```

This will create all required icon sizes in `public/icons/`.

## Option 2: Online Icon Generator

Use an online tool to generate all sizes:

### Recommended Tools:

1. **PWA Asset Generator**
   - URL: https://www.pwabuilder.com/imageGenerator
   - Upload your 512x512 icon
   - Download the generated package
   - Extract to `public/icons/`

2. **Real Favicon Generator**
   - URL: https://realfavicongenerator.net/
   - Upload your icon
   - Configure for web app
   - Download and extract to `public/icons/`

3. **Favicon.io**
   - URL: https://favicon.io/favicon-converter/
   - Simpler option for basic icons

## Option 3: Manual Creation

Create icons manually using:
- **Figma**: Free design tool with export options
- **GIMP**: Free image editor
- **Photoshop**: Professional option
- **Canva**: Easy online design tool

### Manual Steps:

1. Design your icon at 512x512px
2. Export/resize to each required size:
   - 72x72, 96x96, 128x128, 144x144, 152x152, 192x192, 384x384, 512x512
3. Save each as `icon-{size}x{size}.png`
4. Place all files in `public/icons/`

## Option 4: Temporary Placeholder

For testing, use a placeholder service:

```bash
# Create icons directory
mkdir -p public/icons

# Download placeholders (requires curl or wget)
cd public/icons

# Using ImageMagick (if installed)
for size in 72 96 128 144 152 192 384 512; do
  convert -size ${size}x${size} xc:#0d9488 -gravity center \
    -pointsize $((size/4)) -fill white -annotate 0 "ذكر" \
    icon-${size}x${size}.png
done
```

Or manually download from:
```
https://via.placeholder.com/72x72/0d9488/FFFFFF?text=72
https://via.placeholder.com/96x96/0d9488/FFFFFF?text=96
https://via.placeholder.com/128x128/0d9488/FFFFFF?text=128
https://via.placeholder.com/144x144/0d9488/FFFFFF?text=144
https://via.placeholder.com/152x152/0d9488/FFFFFF?text=152
https://via.placeholder.com/192x192/0d9488/FFFFFF?text=192
https://via.placeholder.com/384x384/0d9488/FFFFFF?text=384
https://via.placeholder.com/512x512/0d9488/FFFFFF?text=512
```

## Verification

After creating icons, verify they exist:

```bash
ls -lh public/icons/
```

You should see:
```
icon-72x72.png
icon-96x96.png
icon-128x128.png
icon-144x144.png
icon-152x152.png
icon-192x192.png
icon-384x384.png
icon-512x512.png
```

## Testing

### 1. Local Testing

```bash
npm run build
npm run preview
```

Visit `http://localhost:4173` and:
- Check browser dev tools → Application → Manifest
- Verify all icons load correctly
- Check for any console errors

### 2. Chrome DevTools Audit

- Open DevTools (F12)
- Go to Lighthouse tab
- Run "Progressive Web App" audit
- Should score 90+ with proper icons

### 3. Mobile Testing

- Deploy to production with HTTPS
- Visit on Android Chrome
- You should see "Install app" prompt
- Icons should appear in the installation dialog

## Icon Design Recommendations

### Theme
- **Primary Color**: #0d9488 (Teal)
- **Background**: White or transparent
- **Style**: Simple, Islamic geometric patterns or Arabic calligraphy

### Design Ideas:
1. **Tasbih beads** icon
2. **Arabic calligraphy** of "ذكر"
3. **Crescent moon** with Islamic pattern
4. **Prayer beads** circular design
5. **Counter/tally** symbol with Arabic numerals

### Maskable Icons

For the maskable icons (192x192 and 512x512), ensure:
- Safe zone: Keep important content in the center 80%
- No text or important details near edges
- They look good as circles (Android) or rounded squares (iOS)

## Troubleshooting

### Icons not showing in manifest

Check browser console for 404 errors. Ensure:
- Files are in `public/icons/` directory
- Vite is copying public files (should happen automatically)
- No typos in manifest.json icon paths

### Install prompt not appearing

Requirements:
- Must be served over HTTPS (or localhost)
- Must have valid manifest with icons
- Must have service worker
- User hasn't previously dismissed the prompt

### Icons appear blurry

- Ensure source icon is high quality (512x512 minimum)
- Don't upscale smaller images
- Use PNG format, not JPEG
- Avoid compression artifacts

## Resources

- [Web.dev PWA Icons Guide](https://web.dev/add-manifest/#icons)
- [PWA Builder](https://www.pwabuilder.com/)
- [Maskable.app Editor](https://maskable.app/editor)
- [Material Icons](https://fonts.google.com/icons)
