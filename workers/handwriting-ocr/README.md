# Handwriting OCR Worker

A Cloudflare Worker that converts handwritten text images to typed text using Google Cloud Vision API. This worker is used as a preprocessing step before sending images to Mathpix OCR for LaTeX extraction.

## Purpose

Part of the Math Wizards Chrome extension workflow:
1. **Handwriting OCR** (this worker) - Extracts general handwritten text from images
2. **Mathpix OCR** - Extracts LaTeX from mathematical content

## Features

- **Multi-language OCR**: Chinese, Japanese, Korean, Arabic, and Cyrillic scripts
- **Rotation-aware**: Correctly handles images rotated at any angle (0°, ±90°, 180°, ±270°)
- **SVG Overlay**: Returns SVG markup with typed text positioned over handwriting
- **Google Vision API**: Uses DOCUMENT_TEXT_DETECTION for high-quality OCR
- **TypeScript**: Full type safety with comprehensive type definitions

## What it does

- **Input:** Image with handwritten text (any orientation)
- **Output:**
  - Typed text extracted from image
  - SVG overlay with rotation-aware text positioning
  - Bounding box coordinates for each text segment

## Setup

### Prerequisites

```bash
# Navigate to the worker directory
cd workers/handwriting-ocr

# Install dependencies
npm install
```

### Get Google Cloud Vision API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Cloud Vision API
4. Go to [API Credentials](https://console.cloud.google.com/apis/credentials)
5. Create an API key
6. Copy the API key

### Set API Key as Secret

```bash
# For local development, create .dev.vars file
echo "GOOGLE_API_KEY=your_api_key_here" > .dev.vars

# For production deployment
wrangler secret put GOOGLE_API_KEY
# Paste your API key when prompted
```

## Development

### Local Development

```bash
# Run development server
npm run dev

# Server runs at http://localhost:8787
```

### Deploy to Cloudflare

```bash
# First time: login to Cloudflare
npm run login

# Deploy
npm run deploy
```

## API Usage

### Request

```bash
# Using curl with form data
curl -X POST http://localhost:8787 \
  -F "image=@handwriting.jpg"
```

### Request from JavaScript

```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('https://math-wizards-handwriting-ocr.bascomisaiah.workers.dev', {
  method: 'POST',
  body: formData
});

const result = await response.json();
console.log(result.typed_text);
```

### Response Format

```json
{
  "typed_text": "手写的文字",
  "annotated_image": {
    "type": "svg_overlay",
    "svg": "<defs>...</defs><polygon>...</polygon><text>...</text>",
    "note": "Render this SVG on top of the original image"
  },
  "bounding_boxes": [
    {
      "text": "手写",
      "bounds": [{"x": 100, "y": 200}, {"x": 150, "y": 200}, {"x": 150, "y": 230}, {"x": 100, "y": 230}],
      "x": 100,
      "y": 200,
      "width": 50,
      "height": 30,
      "angle": 0,
      "centerX": 125,
      "centerY": 215
    }
  ],
  "success": true
}
```

### Error Response

```json
{
  "error": "Error message here",
  "stack": "Stack trace (in development)",
  "success": false
}
```

## TypeScript Types

### Key Interfaces

```typescript
interface TextAnnotation {
  text: string;
  bounds: Vertex[];
  x: number;
  y: number;
  width: number;
  height: number;
  angle: number;      // Rotation angle in degrees
  centerX: number;    // Center point for rotation
  centerY: number;
}

interface SuccessResponse {
  typed_text: string;
  annotated_image: AnnotatedImage;
  bounding_boxes: TextAnnotation[];
  success: true;
}
```

See `src/index.ts` for complete type definitions.

## Rotation Handling

The service automatically detects text rotation from bounding polygons:
- Calculates angle using `Math.atan2()` from vertex coordinates
- Applies SVG `transform="rotate(angle, centerX, centerY)"` to text elements
- Uses orientation-aware font sizing (width for vertical, height for horizontal)
- Supports all angles: 0°, ±90°, 180°, ±270°, and everything in between

## Integration with Math Wizards

This worker is designed to work as the first step in the OCR pipeline:

1. Chrome extension captures image
2. Sends to **Handwriting OCR** (this worker) to extract any handwritten text
3. Takes the processed image and sends to **Mathpix OCR** to extract LaTeX
4. Combines results for display in extension

## Cost

- **Google Cloud Vision API**: Pay per use (~$1.50 per 1000 images)
- **Cloudflare Workers**: Free tier: 100,000 requests/day

## Secrets Required

- `GOOGLE_API_KEY` - Google Cloud Vision API key

## Endpoint

After deployment, your worker will be available at:
```
https://math-wizards-handwriting-ocr.bascomisaiah.workers.dev
```

## Testing

You can test the worker using the test.html file from the original handwriting-ocr-typescript project, or integrate it directly into your Chrome extension.
