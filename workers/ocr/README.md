# Math Wizards OCR Worker

Cloudflare Worker that handles Mathpix OCR requests.

## Setup

1. Install dependencies:
```bash
cd workers/ocr
npm install
```

2. Set up Mathpix API credentials as secrets:
```bash
wrangler secret put MATHPIX_APP_ID
# Enter your Mathpix App ID when prompted

wrangler secret put MATHPIX_APP_KEY
# Enter your Mathpix App Key when prompted
```

3. Test locally:
```bash
npm run dev
```

4. Deploy to Cloudflare:
```bash
npm run deploy
```

## Usage

The worker exposes a single POST endpoint that accepts base64-encoded images:

```javascript
fetch('https://your-worker.workers.dev/', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    image: 'base64-encoded-image-data'
  })
})
```

Response:
```json
{
  "latex": "\\int_{0}^{\\infty} e^{-x^2} dx",
  "raw": { /* full Mathpix response */ }
}
```

## Get Mathpix API Credentials

1. Sign up at https://mathpix.com/
2. Go to your dashboard
3. Create a new API key
4. Copy the App ID and App Key
