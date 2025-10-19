# Gemini Math Explainer Worker

Cloudflare Worker that uses Google's Gemini AI to generate plain-text explanations of mathematical content extracted from LaTeX or Markdown.

## Features

- 🤖 **AI-Powered Explanations** - Uses Gemini 1.5 Flash for fast, accurate math tutoring
- 📝 **LaTeX Support** - Accepts LaTeX-formatted mathematical expressions
- 🌐 **CORS Enabled** - Ready for Chrome extension integration
- ⚡ **Fast Response** - Optimized for quick explanations
- 🎯 **Educational Focus** - Explains concepts with step-by-step breakdowns

## API Endpoint

### POST /

Generate an explanation for mathematical content.

**Request:**
```json
{
  "mathContent": "\\int_{0}^{\\infty} e^{-x} dx = 1",
  "model": "gemini-1.5-flash"  // optional, defaults to gemini-1.5-flash
}
```

**Response:**
```
Plain text explanation of the mathematical content...

The integral ∫₀^∞ e^(-x) dx = 1 represents the area under the curve...
[detailed explanation follows]
```

**Status Codes:**
- `200` - Success (returns plain text)
- `400` - Missing required field `mathContent`
- `405` - Method not allowed (only POST accepted)
- `500` - Server error (Gemini API failure)

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Gemini API Key

Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey), then:

```bash
wrangler secret put GEMINI_API_KEY
# Paste your API key when prompted
```

### 3. Local Development

```bash
npm run dev
```

Test locally at `http://localhost:8787`

### 4. Deploy to Cloudflare

```bash
npm run deploy
```

Your worker will be available at: `https://math-wizards-gemini.<your-subdomain>.workers.dev`

## Testing

### cURL Example

```bash
curl -X POST https://math-wizards-gemini.<your-subdomain>.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "mathContent": "\\frac{d}{dx}(x^2) = 2x"
  }'
```

### JavaScript Example

```javascript
const response = await fetch('https://math-wizards-gemini.<your-subdomain>.workers.dev', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    mathContent: '\\int x^2 dx = \\frac{x^3}{3} + C'
  })
});

const explanation = await response.text();
console.log(explanation);
```

## Model Options

You can specify different Gemini models:

- **`gemini-1.5-flash`** (default) - Fast, cost-effective
- **`gemini-1.5-pro`** - Higher quality, more detailed explanations

```json
{
  "mathContent": "E = mc^2",
  "model": "gemini-1.5-pro"
}
```

## Integration with Extension

This worker is designed to integrate with the Math Wizards Chrome extension:

1. User extracts LaTeX from PDF using OCR worker
2. Extension displays LaTeX with "Explain" button
3. Clicking "Explain" sends LaTeX to this Gemini worker
4. AI-generated explanation is displayed to user

## Error Handling

The worker returns JSON error responses for debugging:

```json
{
  "error": "Failed to generate explanation",
  "details": "Gemini API error: 401 - Invalid API key"
}
```

## Development Notes

- Default model changed to `gemini-1.5-flash` for faster response times
- CORS headers allow requests from any origin (safe for extension use)
- TypeScript types ensure type safety for request/response handling
- Error messages include details for easier debugging

## Related Workers

- **OCR Worker** (`../ocr/`) - Extracts LaTeX from images using Mathpix
- **Pipeline Worker** (planned) - Combines OCR + Gemini in one request

## License

MIT License - Math Wizards Code Red 2025
