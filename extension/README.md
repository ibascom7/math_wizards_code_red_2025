# Math Wizards Chrome Extension

## Quick Start

### 1. Install Dependencies

```bash
cd extension
npm install
```

### 2. Build the Extension

```bash
# Development build (with watch mode)
npm run dev

# Production build
npm run build
```

### 3. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the `extension/dist` directory

### 4. Test the Extension

1. Navigate to any webpage with PDF content (try searching for "PDF sample" or visit a site like arXiv.org)
2. Click the **Math Wizards** extension icon in your Chrome toolbar
3. The sidebar will open and automatically scan the page for PDFs
4. Any found PDFs will be displayed in the sidebar

## Project Structure

```
extension/
├── manifest.json          # Extension manifest
├── package.json          # Dependencies
├── tsconfig.json         # TypeScript config
├── webpack.config.js     # Build configuration
├── src/
│   ├── sidepanel/       # React sidebar UI
│   │   ├── SidePanel.tsx
│   │   ├── index.tsx
│   │   ├── sidepanel.html
│   │   └── styles.css
│   ├── content/         # Content script (runs on pages)
│   │   └── content.ts
│   └── background/      # Background service worker
│       └── background.ts
└── dist/                # Built extension (generated)
```

## Current Features (MVP)

- Click extension icon to open sidebar
- Automatically scans page for PDFs
- Detects PDFs in:
  - `<embed>` tags
  - `<object>` tags
  - `<iframe>` tags
  - `<a>` links to .pdf files
- Displays list of found PDFs with links

## Adding Icons

The extension currently needs icon files. Create or download icons and place them in `extension/icons/`:

- `icon16.png` (16x16)
- `icon48.png` (48x48)
- `icon128.png` (128x128)

Quick icon generator: https://www.favicon-generator.org/

## Development

- Run `npm run dev` to start webpack in watch mode
- Make changes to TypeScript/React files
- Reload the extension in `chrome://extensions/` after changes
- Click the refresh icon on the Math Wizards extension card

## Next Steps

After confirming this MVP works, you can add:

1. OCR functionality (Mathpix integration)
2. LaTeX display
3. AI explanations (Gemini)
4. Text-to-speech (ElevenLabs)
5. Search functionality (Google API)
