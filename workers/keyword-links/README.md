# Keyword Links Worker

A Cloudflare Worker that highlights keywords in text and returns relevant academic links for each keyword using Google Custom Search API with intelligent relevance scoring.

## Features

- **Keyword Highlighting**: Find and highlight all occurrences of keywords in text
- **Smart Link Generation**: Fetch relevant academic resources for each keyword
- **Field-Aware Search**: Optimize searches with STEM field context
- **Relevance Scoring**: Rank results by domain authority, term frequency, and field relevance
- **Academic Source Prioritization**: Trusted domains (arXiv, MathWorld, IEEE, etc.) scored higher
- **Batch Processing**: Process multiple keywords in a single request
- **CORS Enabled**: Ready for browser integration

## Quick Start

### Prerequisites

- Cloudflare account
- Google Custom Search API credentials
- Node.js 16+ and npm

### Installation

```bash
cd workers/keyword-links

# Install dependencies
npm install

# Set up Google API credentials
wrangler secret put GOOGLE_API_KEY
wrangler secret put GOOGLE_SEARCH_ENGINE_ID

# Test locally
npm run dev

# Deploy to Cloudflare
npm run deploy
```

### Google API Setup

1. **Create Custom Search Engine**:
   - Visit: https://programmablesearchengine.google.com/
   - Click "Add" to create a new search engine
   - Set to "Search the entire web"
   - Note the **Search Engine ID** (cx parameter)

2. **Get Google API Key**:
   - Visit: https://console.cloud.google.com/
   - Enable "Custom Search API"
   - Create credentials → API Key
   - Note the **API Key**

3. **Store as Secrets**:
   ```bash
   wrangler secret put GOOGLE_API_KEY
   # Enter your API key when prompted

   wrangler secret put GOOGLE_SEARCH_ENGINE_ID
   # Enter your Search Engine ID when prompted
   ```

## API Documentation

### Base URL

```
Production: https://keyword-links.YOUR-SUBDOMAIN.workers.dev
Development: http://localhost:8787
```

### Endpoints

#### `GET /`

Get API documentation and examples.

**Response:**
```json
{
  "success": true,
  "name": "Keyword Links API",
  "version": "1.0.0",
  "endpoints": { ... },
  "example": { ... }
}
```

---

#### `POST /process`

Process text with keywords and return highlights + relevant links.

**Request Body:**
```json
{
  "text": "In group theory, the Sylow theorems describe the structure of finite groups.",
  "keywords": [
    {
      "text": "Sylow theorems",
      "field": "group theory",
      "context": ["finite groups", "subgroups"]
    },
    {
      "text": "group theory"
    }
  ],
  "maxLinksPerKeyword": 3,
  "minRelevanceScore": 0.3
}
```

**Parameters:**

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `text` | `string` | ✅ Yes | - | Text to search for keywords |
| `keywords` | `Keyword[]` | ✅ Yes | - | Keywords to highlight and search |
| `maxLinksPerKeyword` | `number` | ❌ No | `3` | Max links per keyword |
| `minRelevanceScore` | `number` | ❌ No | `0.3` | Min relevance (0-1) |

**Keyword Object:**
```typescript
{
  text: string;        // Keyword text (required)
  field?: string;      // STEM field for context (optional)
  context?: string[];  // Related terms for better search (optional)
}
```

**Response:**
```json
{
  "success": true,
  "results": [
    {
      "keyword": "Sylow theorems",
      "field": "group theory",
      "highlights": [
        {
          "text": "Sylow theorems",
          "startIndex": 19,
          "endIndex": 33,
          "field": "group theory"
        }
      ],
      "links": [
        {
          "title": "Sylow's Theorems - Wolfram MathWorld",
          "url": "https://mathworld.wolfram.com/SylowTheorems.html",
          "snippet": "The Sylow theorems are fundamental results...",
          "displayLink": "mathworld.wolfram.com",
          "relevanceScore": 0.92
        },
        {
          "title": "Sylow theorems - Wikipedia",
          "url": "https://en.wikipedia.org/wiki/Sylow_theorems",
          "snippet": "In mathematics, specifically in group theory...",
          "displayLink": "en.wikipedia.org",
          "relevanceScore": 0.85
        }
      ],
      "searchQuery": "Sylow theorems group theory finite groups"
    }
  ],
  "statistics": {
    "totalKeywords": 2,
    "totalHighlights": 3,
    "totalLinks": 5,
    "averageLinksPerKeyword": 2.5
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

### JavaScript (Browser)

```javascript
async function highlightAndFetchLinks(text, keywords) {
  const response = await fetch('https://keyword-links.YOUR-SUBDOMAIN.workers.dev/process', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: text,
      keywords: keywords,
      maxLinksPerKeyword: 3,
      minRelevanceScore: 0.5,
    }),
  });

  const result = await response.json();

  if (result.success) {
    result.results.forEach(keywordResult => {
      console.log(`Keyword: ${keywordResult.keyword}`);
      console.log(`Found ${keywordResult.highlights.length} occurrences`);
      console.log(`Top links:`);
      keywordResult.links.forEach((link, i) => {
        console.log(`  ${i + 1}. ${link.title} (${link.relevanceScore})`);
        console.log(`     ${link.url}`);
      });
    });
  }

  return result;
}

// Example usage
const text = `
  Neural networks are computational models inspired by biological neural networks.
  Deep learning uses multiple layers of neural networks to learn hierarchical representations.
`;

const keywords = [
  {
    text: 'neural networks',
    field: 'machine learning',
    context: ['deep learning', 'artificial intelligence'],
  },
  {
    text: 'deep learning',
    field: 'machine learning',
  },
];

highlightAndFetchLinks(text, keywords);
```

### cURL

```bash
curl -X POST https://keyword-links.YOUR-SUBDOMAIN.workers.dev/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "In topology, a manifold is a space that locally resembles Euclidean space.",
    "keywords": [
      {
        "text": "manifold",
        "field": "topology",
        "context": ["differential geometry"]
      }
    ],
    "maxLinksPerKeyword": 3,
    "minRelevanceScore": 0.5
  }'
```

### Python

```python
import requests

def highlight_and_fetch_links(text, keywords, max_links=3, min_score=0.3):
    url = "https://keyword-links.YOUR-SUBDOMAIN.workers.dev/process"

    payload = {
        "text": text,
        "keywords": keywords,
        "maxLinksPerKeyword": max_links,
        "minRelevanceScore": min_score
    }

    response = requests.post(url, json=payload)
    result = response.json()

    if result.get('success'):
        for kw_result in result['results']:
            print(f"\nKeyword: {kw_result['keyword']}")
            print(f"Highlights: {len(kw_result['highlights'])}")
            print(f"Top Links:")
            for i, link in enumerate(kw_result['links'], 1):
                print(f"  {i}. {link['title']} ({link['relevanceScore']})")
                print(f"     {link['url']}")

    return result

# Example
text = "The Fourier transform is a mathematical transform that decomposes functions."
keywords = [
    {
        "text": "Fourier transform",
        "field": "analysis",
        "context": ["harmonic analysis", "signal processing"]
    }
]

highlight_and_fetch_links(text, keywords, max_links=3, min_score=0.5)
```

## Relevance Scoring Algorithm

Each search result is scored on a 0-1 scale based on three factors:

### 1. Domain Authority (40% weight)

Trusted academic domains receive higher scores:

| Domain | Score | Category |
|--------|-------|----------|
| mathworld.wolfram.com | 0.95 | Mathematics |
| ncatlab.org | 0.95 | Mathematics |
| arxiv.org | 0.95 | General Academic |
| dl.acm.org | 0.95 | Computer Science |
| ieeexplore.ieee.org | 0.95 | Engineering/CS |
| aps.org | 0.95 | Physics |
| nature.com | 0.95 | Science |
| en.wikipedia.org | 0.75 | General Reference |
| stackoverflow.com | 0.80 | Programming |
| Default (unknown) | 0.50 | - |

### 2. Term Frequency (40% weight)

Counts occurrences of the search term in title and snippet:
- Title matches weighted 3x higher than snippet matches
- Normalized to 0-1 scale

### 3. Field Relevance (20% weight)

Checks if the specified STEM field appears in the result:
- Field mentioned: 1.0
- Field not mentioned: 0.5 (default)

**Final Score Formula:**
```
relevanceScore = (domainAuthority × 0.4) + (termFrequency × 0.4) + (fieldRelevance × 0.2)
```

## Architecture

```
┌─────────────────┐
│   Client App    │
│  (Browser/API)  │
└────────┬────────┘
         │ POST /process
         │ {text, keywords[]}
         ▼
┌─────────────────────────────┐
│   Keyword Links Worker      │
├─────────────────────────────┤
│ 1. Highlight Keywords       │
│    - Find all occurrences   │
│    - Track positions        │
│                             │
│ 2. Build Search Queries     │
│    - Add field context      │
│    - Add related concepts   │
│                             │
│ 3. Fetch from Google API    │
│    - Custom Search API      │
│    - 10 results per keyword │
│                             │
│ 4. Score & Filter Results   │
│    - Domain authority       │
│    - Term frequency         │
│    - Field relevance        │
│    - Filter by threshold    │
│    - Sort by score          │
│                             │
│ 5. Return Top Links         │
│    - Top N per keyword      │
│    - With relevance scores  │
└─────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Client Receives│
│  - Highlights   │
│  - Top Links    │
│  - Statistics   │
└─────────────────┘
```

## Error Handling

All errors return consistent format:

```json
{
  "success": false,
  "error": "Error message description",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request (invalid input)
- `404` - Not Found (invalid endpoint)
- `500` - Internal Server Error (API error, missing credentials)

## Performance

- **Cold Start**: ~50-100ms
- **Warm Request**: ~10-20ms
- **Search Time**: ~200-500ms per keyword (Google API)
- **Total Processing**: ~1-2s for 3-5 keywords
- **Rate Limits**: Google Custom Search API allows 100 queries/day (free tier)

## Deployment

### Development

```bash
npm run dev
# Worker available at http://localhost:8787
```

### Production

```bash
npm run deploy
# Deploys to https://keyword-links.YOUR-SUBDOMAIN.workers.dev
```

### Custom Domain

Edit `wrangler.toml`:
```toml
routes = [
  { pattern = "api.yourdomain.com/keyword-links/*", zone_name = "yourdomain.com" }
]
```

Then deploy:
```bash
npm run deploy
```

## Integration Examples

### Chrome Extension Integration

```javascript
// Background script or content script
class KeywordLinksClient {
  constructor(workerUrl) {
    this.workerUrl = workerUrl;
  }

  async processText(text, keywords, options = {}) {
    const response = await fetch(`${this.workerUrl}/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        keywords,
        maxLinksPerKeyword: options.maxLinks || 3,
        minRelevanceScore: options.minScore || 0.3,
      }),
    });

    return await response.json();
  }
}

// Usage in extension
const client = new KeywordLinksClient(
  'https://keyword-links.YOUR-SUBDOMAIN.workers.dev'
);

// When PDF is processed
const pdfText = extractTextFromPDF();
const detectedKeywords = [
  { text: 'homomorphism', field: 'group theory' },
  { text: 'isomorphism', field: 'group theory' },
];

const result = await client.processText(pdfText, detectedKeywords);

// Highlight keywords on page
result.results.forEach(kwResult => {
  kwResult.highlights.forEach(highlight => {
    highlightTextInPDF(highlight.startIndex, highlight.endIndex);
  });

  // Show links in popup
  showLinksPopup(kwResult.keyword, kwResult.links);
});
```

### React Component Example

```jsx
import { useState } from 'react';

function KeywordHighlighter({ text, keywords }) {
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const processKeywords = async () => {
    setLoading(true);
    const response = await fetch('https://keyword-links.YOUR-SUBDOMAIN.workers.dev/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, keywords, maxLinksPerKeyword: 3 }),
    });
    const data = await response.json();
    setResults(data.results);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={processKeywords} disabled={loading}>
        {loading ? 'Processing...' : 'Highlight & Get Links'}
      </button>

      {results && results.map(kwResult => (
        <div key={kwResult.keyword} className="keyword-result">
          <h3>{kwResult.keyword}</h3>
          <p>Found {kwResult.highlights.length} occurrences</p>

          <h4>Top Resources:</h4>
          <ul>
            {kwResult.links.map((link, i) => (
              <li key={i}>
                <a href={link.url} target="_blank" rel="noopener noreferrer">
                  {link.title}
                </a>
                <span className="score">({Math.round(link.relevanceScore * 100)}%)</span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

## Testing

Test with sample data:

```bash
# Start local server
npm run dev

# In another terminal, test the endpoint
curl -X POST http://localhost:8787/process \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Category theory studies abstract mathematical structures and relationships between them.",
    "keywords": [
      {
        "text": "Category theory",
        "field": "mathematics",
        "context": ["functors", "natural transformations"]
      }
    ]
  }'
```

## License

MIT

## Support

For issues and feature requests, open an issue in the GitHub repository.

## Credits

Part of the Math Wizards STEM Paper Assistant project.
