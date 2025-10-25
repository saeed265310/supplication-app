# PWA Testing Guide

This guide walks you through deploying and testing the PWA (Progressive Web App) functionality.

## What's New

Your Supplications Counter app now supports:

✅ **Installation on Android devices** - Users can install the app like a native app
✅ **Offline functionality** - App works without internet connection
✅ **Home screen icon** - Custom teal icon with Arabic "ذكر" text
✅ **Standalone mode** - Runs without browser UI
✅ **Push notifications** - Ready for future implementation

## Quick Deploy

### Step 1: Pull Latest Changes

```bash
cd ~/supplication-app
git pull origin claude/list-current-features-011CUSpxjonL3akNoyTpjvG7
```

### Step 2: Update Environment Variables

Make sure your `.env` file has the correct API URL:

```bash
# For production with domain
VITE_API_URL=https://api.yourdomain.com/api

# For local testing (if not using domain)
VITE_API_URL=http://localhost:3002/api
```

### Step 3: Rebuild Frontend Container

The frontend needs to be rebuilt to include PWA files:

```bash
# Rebuild only the frontend
docker compose up -d --build frontend

# OR rebuild everything
docker compose down
docker compose up -d --build
```

### Step 4: Verify Deployment

Check containers are running:

```bash
docker compose ps
```

You should see:
- `supplication-backend` - healthy on port 3002
- `supplication-frontend` - running on port 8081

### Step 5: Test Locally

Visit `http://localhost:8081` (or your server IP):

1. **Check manifest** - Open DevTools → Application → Manifest
   - Should show "عداد الأذكار - Supplications Counter"
   - Icons should be listed and load correctly

2. **Check service worker** - DevTools → Application → Service Workers
   - Should show "Activated and running" status
   - Location: `/sw.js`

3. **Check icons** - Visit these URLs directly:
   ```
   http://localhost:8081/icons/icon-72x72.png
   http://localhost:8081/icons/icon-192x192.png
   http://localhost:8081/icons/icon-512x512.png
   http://localhost:8081/manifest.json
   http://localhost:8081/sw.js
   ```

## Testing PWA Installation

### Requirements for Install Prompt

PWA install prompt requires:

1. ✅ **HTTPS connection** (or localhost for testing)
2. ✅ **Valid manifest.json** with icons
3. ✅ **Registered service worker**
4. ✅ **User engagement** (not first visit)

### Local Testing (HTTP)

On localhost, Chrome allows PWA installation even without HTTPS:

1. Open `http://localhost:8081` in Chrome
2. Click the install icon (⊕) in the address bar
3. Or use Menu → Install app

**Note:** Mobile install requires HTTPS (see production testing below)

### Production Testing (HTTPS)

For real mobile testing, deploy with HTTPS:

#### Option 1: Using nginx Proxy Manager (Recommended)

1. **Set up proxy host** (see NGINX_PROXY_SETUP.md):
   - Domain: `yourdomain.com`
   - Forward to: `localhost:8081`
   - SSL enabled with Let's Encrypt

2. **Update .env and rebuild**:
   ```bash
   VITE_API_URL=https://api.yourdomain.com/api
   docker compose up -d --build frontend
   ```

3. **Test on Android**:
   - Visit `https://yourdomain.com`
   - Chrome will show "Install app" banner
   - Or use Menu → Add to Home screen

#### Option 2: Using Cloudflare Tunnel (Alternative)

If you don't have a domain or can't set up nginx:

```bash
# Install cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64
chmod +x cloudflared-linux-amd64
sudo mv cloudflared-linux-amd64 /usr/local/bin/cloudflared

# Create tunnel
cloudflared tunnel --url http://localhost:8081
```

This gives you a temporary HTTPS URL for testing.

## Android Testing Checklist

### Installation Test

1. ☐ Visit app on Android Chrome over HTTPS
2. ☐ Install prompt appears (may need to refresh or interact with page)
3. ☐ Click "Install" or "Add to Home screen"
4. ☐ App icon appears on home screen with correct design
5. ☐ App name shows as "عداد الأذكار" (or short name)

### Standalone Mode Test

1. ☐ Open app from home screen icon
2. ☐ Runs without browser address bar/UI
3. ☐ Shows teal theme color in status bar
4. ☐ Back button works correctly
5. ☐ App can be switched like other apps

### Offline Test

1. ☐ With app open, turn on airplane mode
2. ☐ Refresh the page - should still load
3. ☐ Navigate between pages - should work
4. ☐ Try API calls - should show cached data or graceful error
5. ☐ Turn off airplane mode - should sync automatically

### iOS Testing (Optional)

iOS has different PWA behavior:

1. Open in Safari (not Chrome)
2. Tap Share → Add to Home Screen
3. App installs without install prompt
4. Note: Service workers work differently on iOS

## Troubleshooting

### Install Prompt Not Showing

**Possible causes:**
- Not using HTTPS (required on mobile)
- User previously dismissed the prompt (Chrome waits 90 days)
- Service worker not registered properly
- Missing or invalid manifest.json

**Solutions:**
```bash
# Check service worker registration
# In browser console:
navigator.serviceWorker.getRegistrations().then(console.log)

# Check manifest
# DevTools → Application → Manifest → Check for errors

# Force re-prompt (for testing)
# Clear site data: DevTools → Application → Clear storage
```

### Icons Not Loading

**Check icon files exist:**
```bash
ls -lh public/icons/
```

Should show 8 PNG files (72x72 to 512x512).

**Rebuild if missing:**
```bash
node scripts/generate-icons.js
docker compose up -d --build frontend
```

### Service Worker Not Registering

**Check browser console for errors:**
- Open DevTools → Console
- Look for `[PWA]` messages
- Should see "Service Worker registered successfully"

**Common issues:**
- File `/sw.js` not found (not in public folder)
- Service worker scope issues
- Browser cache - try hard refresh (Ctrl+Shift+R)

### Offline Mode Not Working

**Check caching strategy:**

```javascript
// In DevTools → Application → Cache Storage
// Should see two caches:
// - dhikr-counter-v1 (static assets)
// - dhikr-api-v1 (API responses)
```

**Test manually:**
```bash
# In browser console:
caches.keys().then(console.log)
```

### manifest.json 404 Error

**Check file location:**
```bash
ls -la public/manifest.json
```

**Verify in HTML:**
```bash
grep manifest index.html
# Should show: <link rel="manifest" href="/manifest.json" />
```

**Rebuild frontend:**
```bash
docker compose up -d --build frontend
```

## Performance Testing

### Lighthouse Audit

1. Open DevTools → Lighthouse
2. Select "Progressive Web App" category
3. Run audit
4. Should score **90+** in PWA category

**Key checks:**
- ✅ Installable
- ✅ Provides a valid manifest
- ✅ Uses HTTPS
- ✅ Registers a service worker
- ✅ Responds with 200 when offline
- ✅ Has a viewport meta tag
- ✅ Has an apple-touch-icon

### Network Throttling Test

1. DevTools → Network → Throttling → Slow 3G
2. Refresh page
3. Page should load from cache quickly
4. API requests should show network activity

## Custom Icon Design (Optional)

The current icon is a placeholder. To create a custom design:

### Method 1: Edit SVG Source

Edit `public/icon-source.svg` with your design, then regenerate:

```bash
node scripts/generate-icons.js
git add public/icon-source.svg public/icons/
git commit -m "Update PWA icons with custom design"
docker compose up -d --build frontend
```

### Method 2: Use Online Tools

1. Visit [Maskable.app Editor](https://maskable.app/editor)
2. Upload your design
3. Adjust safe zone for Android masks
4. Download generated icons
5. Replace files in `public/icons/`

### Design Tips

- **Size:** Start with 512x512 minimum
- **Safe zone:** Keep important content in center 80%
- **Format:** PNG with transparency
- **Colors:** Match app theme (#0d9488 teal)
- **Content:** Simple, recognizable design
  - Arabic calligraphy of "ذكر"
  - Prayer beads design
  - Islamic geometric patterns

## Next Steps

After PWA is working:

1. ☐ **Notifications & Reminders** - Use push notification infrastructure
2. ☐ **Statistics & Charts** - Add offline-capable data visualization
3. ☐ **Pre-loaded Hisnul Muslim Library** - Cache entire library for offline use
4. ☐ **Enhanced Offline** - Background sync for pending API calls

## Resources

- [PWA Checklist](https://web.dev/pwa-checklist/)
- [Service Workers Explained](https://web.dev/service-workers-cache-storage/)
- [Manifest Reference](https://web.dev/add-manifest/)
- [Maskable Icons](https://maskable.app/)

## Summary

Your app is now a full Progressive Web App! Users can:
- Install it on their Android devices
- Use it offline
- Get app-like experience without app stores
- Receive push notifications (when you implement that feature)

The PWA infrastructure is ready for the remaining features (notifications, statistics, library).
