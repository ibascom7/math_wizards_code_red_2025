# STEM Keyword Detector - Cloudflare Worker

A high-performance Cloudflare Worker API for detecting STEM keywords in text with position tracking. Designed for integration with browser extensions that process academic PDFs and LaTeX documents.

## Features

- **37 STEM Fields**: Covers Mathematics, Computer Science, Physics, Chemistry, Biology, and Engineering
- **1000+ Keywords**: Comprehensive database of academic terminology
- **Multi-word Phrase Matching**: Detects phrases up to 4 words (e.g., "convolutional neural network")
- **Position Tracking**: Returns precise coordinates for highlighting
- **Fast & Lightweight**: 24KB keyword database, optimized for edge computing
- **CORS Enabled**: Ready for browser extension integration

## Quick Start

### Prerequisites

- Node.js 16+
- Cloudflare account
- Wrangler CLI installed globally: `npm install -g wrangler`

### Installation

```bash
# Clone or copy this directory
cd keyword-detector

# Install dependencies
npm install

# Login to Cloudflare (first time only)
wrangler login

# Deploy to Cloudflare Workers
npm run deploy
```

### Development

```bash
# Run local development server
npm run dev

# Test the API locally
curl http://localhost:8787/
```

## API Documentation

### Base URL

```
Production: https://keyword-detector.YOUR-SUBDOMAIN.workers.dev
Development: http://localhost:8787
```

### Endpoints

#### `GET /`
Get API information and documentation.

**Response:**
```json
{
  "success": true,
  "name": "STEM Keyword Detection API",
  "version": "1.0.0",
  "endpoints": { ... },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `GET /fields`
Get all available STEM fields.

**Response:**
```json
{
  "success": true,
  "fields": [
    "group theory",
    "topology",
    "machine learning",
    "quantum mechanics",
    ...
  ],
  "count": 37,
  "categories": {
    "mathematics": [...],
    "computer science": [...],
    "physics": [...],
    "chemistry": [...],
    "biology": [...],
    "engineering": [...]
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `POST /detect`
Detect STEM keywords in text.

**Request Body:**
```json
{
  "words": [
    {
      "text": "neural",
      "x": 50,
      "y": 100,
      "width": 60,
      "height": 20,
      "confidence": 0.95
    },
    {
      "text": "network",
      "x": 120,
      "y": 100,
      "width": 70,
      "height": 20,
      "confidence": 0.95
    }
  ],
  "targetFields": ["machine learning", "deep learning"],
  "minConfidence": 0.7,
  "caseSensitive": false,
  "multiWordMatching": true
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `words` | `Array<Word>` | ✅ Yes | - | Array of word objects with positions |
| `targetFields` | `string[]` | ❌ No | All fields | STEM fields to search |
| `minConfidence` | `number` | ❌ No | `0.7` | Minimum confidence (0-1) |
| `caseSensitive` | `boolean` | ❌ No | `false` | Case-sensitive matching |
| `multiWordMatching` | `boolean` | ❌ No | `true` | Enable phrase matching |

**Word Object Format:**
```typescript
{
  text: string,       // Word text
  x: number,          // X position
  y: number,          // Y position
  width: number,      // Width
  height: number,     // Height
  confidence?: number // Optional OCR confidence (0-1)
}
```

**Response:**
```json
{
  "success": true,
  "keywords": [
    {
      "text": "neural network",
      "normalizedText": "neural network",
      "field": "machine learning",
      "confidence": 0.95,
      "position": {
        "x": 50,
        "y": 100,
        "width": 130,
        "height": 20
      },
      "wordIndices": [0, 1]
    }
  ],
  "statistics": {
    "total": 1,
    "byField": {
      "machine learning": 1
    },
    "averageConfidence": 0.95,
    "uniqueTerms": 1
  },
  "config": {
    "targetFields": ["machine learning", "deep learning"],
    "minConfidence": 0.7,
    "caseSensitive": false,
    "multiWordMatching": true,
    "indexedKeywords": 85
  },
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

#### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "success": true,
  "status": "ok",
  "uptime": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Usage Examples

### JavaScript (Browser Extension)

```javascript
// Fetch keyword detection
async function detectKeywords(words) {
  const response = await fetch('https://keyword-detector.YOUR-SUBDOMAIN.workers.dev/detect', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      words: words,
      targetFields: ['machine learning', 'neural networks'],
      minConfidence: 0.7
    })
  });

  const result = await response.json();

  if (result.success) {
    console.log('Detected keywords:', result.keywords);
    console.log('Statistics:', result.statistics);
    return result.keywords;
  } else {
    console.error('Error:', result.error);
    return [];
  }
}

// Example: Process LaTeX text
const words = [
  { text: 'Deep', x: 10, y: 50, width: 40, height: 15 },
  { text: 'learning', x: 55, y: 50, width: 60, height: 15 },
  { text: 'models', x: 120, y: 50, width: 50, height: 15 }
];

detectKeywords(words);
```

### cURL

```bash
# Get all fields
curl https://keyword-detector.YOUR-SUBDOMAIN.workers.dev/fields

# Detect keywords
curl -X POST https://keyword-detector.YOUR-SUBDOMAIN.workers.dev/detect \
  -H "Content-Type: application/json" \
  -d '{
    "words": [
      {"text": "quantum", "x": 10, "y": 20, "width": 60, "height": 15},
      {"text": "mechanics", "x": 75, "y": 20, "width": 70, "height": 15}
    ],
    "targetFields": ["quantum mechanics"],
    "minConfidence": 0.7
  }'
```

### Python

```python
import requests

def detect_keywords(words, target_fields=None):
    url = "https://keyword-detector.YOUR-SUBDOMAIN.workers.dev/detect"

    payload = {
        "words": words,
        "targetFields": target_fields or [],
        "minConfidence": 0.7
    }

    response = requests.post(url, json=payload)
    result = response.json()

    if result.get('success'):
        return result['keywords']
    else:
        raise Exception(result.get('error'))

# Example usage
words = [
    {"text": "neural", "x": 50, "y": 100, "width": 60, "height": 20},
    {"text": "network", "x": 120, "y": 100, "width": 70, "height": 20}
]

keywords = detect_keywords(words, target_fields=["machine learning"])
print(keywords)
```

## Available STEM Fields

### Mathematics (10 fields)
- group theory
- topology
- differential geometry
- algebra
- analysis
- number theory
- category theory
- algebraic topology
- logic
- combinatorics

### Computer Science (5 fields)
- algorithms & data structures
- machine learning
- operating systems
- programming languages
- databases

### Physics (5 fields)
- classical mechanics
- quantum mechanics
- thermodynamics
- electromagnetism
- relativity

### Chemistry (4 fields)
- organic chemistry
- inorganic chemistry
- physical chemistry
- biochemistry

### Biology (5 fields)
- molecular biology
- cell biology
- genetics
- evolution
- ecology

### Engineering (4 fields)
- electrical engineering
- mechanical engineering
- civil engineering
- chemical engineering

## Deployment

### Deploy to Production

```bash
# Deploy to production environment
npm run deploy:prod
```

### Deploy to Development

```bash
# Deploy to development environment
npm run deploy:dev
```

### Custom Domain Setup

1. Edit `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/*", zone_name = "yourdomain.com" }
]
```

2. Deploy:
```bash
npm run deploy
```

## Browser Extension Integration

### Chrome Extension Example

```javascript
// background.js or content script

class KeywordDetectorClient {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
  }

  async detectKeywords(words, options = {}) {
    try {
      const response = await fetch(`${this.workerUrl}/detect`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          words,
          targetFields: options.targetFields,
          minConfidence: options.minConfidence || 0.7
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error('Keyword detection failed:', error);
      return { success: false, keywords: [], error: error.message };
    }
  }

  async getAvailableFields() {
    const response = await fetch(`${this.workerUrl}/fields`);
    const result = await response.json();
    return result.fields;
  }
}

// Usage
const detector = new KeywordDetectorClient(
  'https://keyword-detector.YOUR-SUBDOMAIN.workers.dev'
);

// When PDF is loaded and text is extracted
const words = extractWordsFromPDF(); // Your extraction logic
const result = await detector.detectKeywords(words, {
  targetFields: ['machine learning', 'quantum mechanics']
});

// Highlight keywords on page
result.keywords.forEach(keyword => {
  highlightText(keyword.position, keyword.text);
});
```

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Common HTTP status codes:
- `200`: Success
- `400`: Bad Request (invalid input)
- `404`: Not Found (invalid endpoint)
- `500`: Internal Server Error

## Performance

- **Cold Start**: ~10-50ms
- **Warm Request**: ~1-5ms
- **Average Detection Time**: <2ms for 100 words
- **Size**: 24KB total worker size
- **Limits**: Cloudflare free tier supports 100,000 requests/day

## Testing

Run the included test file:

```bash
npm test
```

Or test manually:

```bash
# Start local server
npm run dev

# In another terminal, run test requests
node test/manual-test.js
```

## License

MIT

## Support

For issues and feature requests, please open an issue in the GitHub repository.

## Credits

Part of the STEM Paper Assistant project.
