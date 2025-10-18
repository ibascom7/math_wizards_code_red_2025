# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Math Wizards** - A Chrome extension for making STEM notes and research easier to read and understand. This is a hackathon project.

### Core Features
1. OCR scanning of PDFs and images on web pages (Mathpix API) → LaTeX transcription
2. Display transcribed LaTeX in sidebar
3. Generate AI explanations of LaTeX (Gemini API)
4. Text-to-speech for LaTeX content (ElevenLabs API)
5. Find relevant links for selected LaTeX (Google Search API)

### Tech Stack

**Frontend: Chrome Extension (TypeScript + React)**
- Extension popup/sidebar UI
- Content scripts to scan pages for PDFs/images
- Hotkey activation support

**Backend: Cloudflare Workers**
- `/ocr` - Mathpix OCR endpoint
- `/exp` - Gemini explanation generation
- `/tts` - ElevenLabs text-to-speech
- `/search` - Google API search with filtering

## Development Commands

### Chrome Extension
```bash
# Install dependencies
npm install

# Development build with watch mode
npm run dev

# Production build
npm run build

# Load extension in Chrome:
# Navigate to chrome://extensions/
# Enable Developer Mode
# Click "Load unpacked" and select the dist/ directory
```

### Cloudflare Workers
```bash
# Install wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy all workers
wrangler deploy

# Test worker locally
wrangler dev
```

## Project Structure

```
/extension       - Chrome extension code (TypeScript + React)
  /src
    /components  - React components for sidebar UI
    /content     - Content scripts for page scanning
    /background  - Background service worker
    manifest.json
/workers         - Cloudflare Workers endpoints
  /ocr          - Mathpix OCR integration
  /exp          - Gemini explanation generation
  /tts          - ElevenLabs text-to-speech
  /search       - Google Search API integration
```

## Important Implementation Notes

### Chrome Extension Permissions
The manifest.json must include:
- `activeTab` - for scanning current page
- `scripting` - for content script injection
- `sidePanel` or custom sidebar implementation
- Host permissions for PDF/image access

### API Key Management
Store API keys as Cloudflare Worker secrets (not in code):
```bash
wrangler secret put MATHPIX_API_KEY
wrangler secret put GEMINI_API_KEY
wrangler secret put ELEVENLABS_API_KEY
wrangler secret put GOOGLE_API_KEY
```

### LaTeX Rendering
Use KaTeX or MathJax library for rendering LaTeX in the sidebar.

### PDF Handling
Consider using PDF.js for client-side PDF parsing to extract images before sending to OCR endpoint.

### Workflow
User triggers extension → Content script scans page → Extracts images/PDFs → Sends to /ocr endpoint → Displays LaTeX in sidebar → User can click "Explain" (/exp), "Read Aloud" (/tts), or "Find Links" (/search)
