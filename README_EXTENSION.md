# AutoSlay Chrome Extension

## How to Build & Load

### 1. Install dependencies (if not done)
```bash
npm install
```

### 2. Build the extension
```bash
npm run build
```
This creates a `dist/` folder.

### 3. Add icons (required)
Place these PNG icon files inside the `public/` folder before building:
- `icon16.png`  (16x16)
- `icon48.png`  (48x48)
- `icon128.png` (128x128)

### 4. Load in Chrome
1. Open Chrome → go to `chrome://extensions/`
2. Enable **Developer Mode** (toggle, top right)
3. Click **"Load unpacked"**
4. Select the `dist/` folder
5. ✅ AutoSlay will appear in your extensions!

## Changes Made for Chrome Extension
- `public/manifest.json` — added (Chrome extension manifest v3)
- `src/App.jsx` — switched `BrowserRouter` → `HashRouter` (required for extensions)
- `vite.config.js` — removed dev server proxy, clean build config

## Note
Make sure your backend API is deployed (not localhost) before using in the extension.
Update API base URLs in `src/api/` to point to your deployed server.
