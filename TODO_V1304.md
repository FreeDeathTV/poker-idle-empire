# V1304 Implementation TODO

## Fix PWA Manifest Configuration
- [ ] Update vite.config.ts with proper icons (144x144, 192x192, 512x512, maskable)
- [ ] Add screenshots to manifest
- [ ] Add id and display_override fields

## Verify Icons
- [ ] Check static/icon-192.png size (should be 192x192)
- [ ] Check static/icon-512.png size (should be 512x512)
- [ ] Create icon-144.png if needed
- [ ] Create icon-maskable.png if needed

## Verification
- [ ] Test manifest in DevTools → Application → Manifest
- [ ] Check installability - all green checks
- [ ] Verify beforeinstallprompt fires
