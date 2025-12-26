# PWA Quick Start - vite-plugin-pwa Only

## Single Dependency Setup ✅

This project uses **only** `vite-plugin-pwa` for complete PWA functionality. No additional packages needed!

```bash
npm install -D vite-plugin-pwa
```

`vite-plugin-pwa` includes everything:
- ✅ Workbox for service worker generation
- ✅ Service worker registration utilities
- ✅ PWA manifest generation
- ✅ Auto-update handling
- ✅ Dev mode support

## What It Does

### 1. **Image Caching**
Firebase Storage images are cached with **CacheFirst** strategy:
- 7-day cache duration
- Max 500 images
- Works offline
- Instant loading from cache

### 2. **Auto-Updates**
When you deploy a new version:
- Service worker detects update automatically
- User sees: "New content available. Reload to update?"
- Seamless update on confirmation

### 3. **PWA Manifest**
Configured in `vite.config.js` - no separate file needed:
- App name, colors, icons
- Installable on mobile/desktop
- Standalone display mode

### 4. **Dev Mode Support**
Service worker works in development:
- Test caching locally
- Test offline mode
- Test updates

## Configuration

Everything is in `vite.config.js`:

```javascript
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: { /* PWA config */ },
      workbox: {
        runtimeCaching: [
          {
            // Cache Firebase Storage images
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'recipema-images-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 7
              }
            }
          }
        ]
      }
    })
  ]
});
```

## Service Worker Registration

In `app/index.js`:

```javascript
import { registerSW } from 'virtual:pwa-register';

const updateSW = registerSW({
  onNeedRefresh() {
    if (confirm('New content available. Reload to update?')) {
      updateSW(true);
    }
  },
  onOfflineReady() {
    console.log('App ready to work offline');
  }
});
```

The `virtual:pwa-register` module is provided by `vite-plugin-pwa` - no imports needed!

## Build Output

### Development (`npm run dev`)
Creates `app/dev-dist/` with development service worker:
```
app/dev-dist/
  ├── sw.js              # Dev service worker (for testing)
  └── workbox-*.js       # Workbox runtime (dev version)
```
**Note:** This directory is auto-generated and ignored by git. Don't commit it!

### Production (`npm run build`)
Creates `dist/` with optimized production build:
```
dist/
  ├── sw.js                       # Service worker (optimized)
  ├── workbox-[hash].js           # Workbox runtime (production)
  ├── manifest.webmanifest        # PWA manifest
  └── assets/
      └── workbox-window.prod.*.js # Registration helper
```

All generated automatically by `vite-plugin-pwa`!

## Development

```bash
# Dev with service worker (generates app/dev-dist/)
npm run dev

# Build for production (generates dist/)
npm run build

# Preview production build
npm run preview
```

### Dev Mode Features

Thanks to `devOptions.enabled: true` in config:
- ✅ Service worker runs during development
- ✅ Test caching without building
- ✅ Hot reload works with service worker
- ✅ Test offline mode locally
- ✅ `dev-dist/` auto-generated and served at `/dev-sw.js?dev-sw`

**Tip:** Open DevTools → Application → Service Workers to see the dev SW in action!

## Adding More Caching Strategies

Want to cache other resources? Just add more rules to `workbox.runtimeCaching`:

```javascript
workbox: {
  runtimeCaching: [
    // Existing image cache...
    {
      // Cache Google Fonts
      urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts-cache',
        expiration: {
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
        }
      }
    },
    {
      // Network-first for API requests
      urlPattern: /^https:\/\/api\.example\.com\/.*/i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 50,
          maxAgeSeconds: 60 * 5 // 5 minutes
        }
      }
    }
  ]
}
```

### Available Strategies

- **CacheFirst**: Cache → Network (best for static assets, images)
- **NetworkFirst**: Network → Cache (best for API, frequently updated)
- **StaleWhileRevalidate**: Cache → Background update (best for balance)
- **NetworkOnly**: Always network (no caching)
- **CacheOnly**: Always cache (offline-only)

## That's It! 🎉

One package (`vite-plugin-pwa`), one config file (`vite.config.js`), and you have a full-featured PWA with:
- ✅ Offline support
- ✅ Image caching
- ✅ Auto-updates
- ✅ Installability
- ✅ Dev mode testing

No manual service worker code. No separate manifest file. No extra dependencies.

## Resources

- [vite-plugin-pwa docs](https://vite-pwa-org.netlify.app/)
- [Workbox strategies](https://developer.chrome.com/docs/workbox/caching-strategies-overview/)

