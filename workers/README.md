# Math Wizards - Cloudflare Workers

This directory contains all Cloudflare Workers for the Math Wizards Chrome extension.

## Workers Overview

### 1. Handwriting OCR Worker (`/handwriting-ocr`)
**Endpoint:** `https://math-wizards-handwriting-ocr.bascomisaiah.workers.dev`

Extracts handwritten text from images using Google Cloud Vision API. Supports CJK, Arabic, and Cyrillic scripts with rotation-aware text detection.

- **Method:** POST
- **Input:** FormData with image file
- **Output:** Typed text, SVG overlay, bounding boxes with rotation angles
- **Secrets:** GOOGLE_API_KEY

### 2. OCR Worker (`/ocr`)
**Endpoint:** `https://math-wizards-ocr.bascomisaiah.workers.dev`

Extracts LaTeX from images using Mathpix API.

- **Method:** POST
- **Input:** Base64-encoded image
- **Output:** LaTeX string
- **Secrets:** MATHPIX_APP_ID, MATHPIX_APP_KEY

### 3. Gemini Explanation Worker (`/gemini`)
**Endpoint:** `https://math-wizards-gemini.bascomisaiah.workers.dev`

Generates AI explanations of mathematical content using Gemini AI.

- **Method:** POST
- **Input:** `{ "mathContent": "latex or markdown math" }`
- **Output:** Plain text explanation
- **Secrets:** GEMINI_API_KEY
- **Model:** gemini-2.0-flash-exp

### 4. Text-to-Speech Worker (`/tts`)
**Endpoint:** `https://math-wizards-tts.bascomisaiah.workers.dev`

Converts text to speech using ElevenLabs API.

- **Method:** POST
- **Input:** `{ "text": "text to speak", "apiKey": "your-key" }` or use ELEVENLABS_API_KEY secret
- **Output:** Audio/mpeg file
- **Optional Secrets:** ELEVENLABS_API_KEY
- **Voice:** Rachel (ID: 21m00Tcm4TlvDq8ikWAM)

### 5. Keyword Detection Worker (`/keywords`)
**Endpoint:** `https://math-wizards-keywords.bascomisaiah.workers.dev`

Detects STEM keywords in extracted text with position tracking.

- **Methods:** GET (docs), POST /detect (detection)
- **Input:** Array of words with positions
- **Output:** Detected keywords with metadata
- **No secrets required** - pure computation

## Development

### Install Dependencies
```bash
cd workers/<worker-name>
npm install
```

### Local Development
```bash
npm run dev
```

### Deploy
```bash
npm run deploy
```

### Set Secrets
```bash
wrangler secret put SECRET_NAME
```

## Worker Structure

Each worker follows this structure:
```
workers/<name>/
├── src/
│   └── index.ts       # Main worker code
├── package.json       # Dependencies
├── tsconfig.json      # TypeScript config
└── wrangler.toml      # Cloudflare config
```

## Tech Stack

- **Runtime:** Cloudflare Workers (V8 isolates)
- **Language:** TypeScript
- **Build Tool:** Wrangler
- **APIs:** Google Cloud Vision, Mathpix, Gemini, ElevenLabs

## API Endpoints Summary

| Worker | URL | Purpose |
|--------|-----|---------|
| Handwriting OCR | `.../math-wizards-handwriting-ocr` | Extract handwritten text (preprocessing) |
| OCR | `.../math-wizards-ocr` | Extract LaTeX from images |
| Gemini | `.../math-wizards-gemini` | Explain math content |
| TTS | `.../math-wizards-tts` | Text-to-speech |
| Keywords | `.../math-wizards-keywords` | STEM keyword detection |

## Features

### Handwriting OCR Worker
- Google Cloud Vision API integration
- Multi-language support (CJK, Arabic, Cyrillic)
- Rotation-aware text detection (0°, ±90°, 180°, ±270°)
- SVG overlay generation with bounding boxes
- FormData image input
- CORS enabled

### OCR Worker
- Mathpix OCR integration
- Base64 image input
- LaTeX output
- CORS enabled

### Gemini Worker
- AI-powered explanations
- Context-aware responses
- Supports LaTeX and Markdown
- Gemini 2.0 Flash model

### TTS Worker
- ElevenLabs integration
- High-quality voice synthesis
- MP3 output
- Configurable voice and model

### Keywords Worker
- 1,131 STEM keywords indexed
- Multi-word phrase matching
- Position-aware detection
- Confidence scoring
- 33 STEM fields covered:
  - Mathematics (10 fields)
  - Computer Science (5 fields)
  - Physics (5 fields)
  - Chemistry (4 fields)
  - Biology (5 fields)
  - Engineering (4 fields)

## Testing

### Test Handwriting OCR
```bash
curl -X POST https://math-wizards-handwriting-ocr.bascomisaiah.workers.dev \
  -F "image=@handwriting.jpg"
```

### Test OCR
```bash
curl -X POST https://math-wizards-ocr.bascomisaiah.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"image": "base64_image_data"}'
```

### Test Gemini
```bash
curl -X POST https://math-wizards-gemini.bascomisaiah.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"mathContent": "E = mc^2"}'
```

### Test TTS
```bash
curl -X POST https://math-wizards-tts.bascomisaiah.workers.dev \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "apiKey": "your-key"}' \
  --output audio.mp3
```

### Test Keywords
```bash
curl -X POST https://math-wizards-keywords.bascomisaiah.workers.dev/detect \
  -H "Content-Type: application/json" \
  -d '{
    "words": [
      {"text": "neural", "x": 50, "y": 100, "width": 60, "height": 20},
      {"text": "network", "x": 120, "y": 100, "width": 70, "height": 20}
    ]
  }'
```

## Notes

- All workers are deployed and production-ready
- CORS is enabled for all workers
- TypeScript provides type safety
- Secrets are stored securely in Cloudflare
