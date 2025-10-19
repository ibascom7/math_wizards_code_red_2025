/**
 * Cloudflare Worker for Mathpix OCR
 * Receives base64 image, sends to Mathpix API, returns LaTeX
 */

export interface Env {
  MATHPIX_APP_ID: string;
  MATHPIX_APP_KEY: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const body = await request.json() as { image: string };

      if (!body.image) {
        return new Response(JSON.stringify({ error: 'No image provided' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Call Mathpix OCR API
      const mathpixResponse = await fetch('https://api.mathpix.com/v3/text', {
        method: 'POST',
        headers: {
          'app_id': env.MATHPIX_APP_ID,
          'app_key': env.MATHPIX_APP_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          src: `data:image/png;base64,${body.image}`,
          formats: ['text', 'latex_styled'],
          ocr: ['math', 'text'],
        }),
      });

      if (!mathpixResponse.ok) {
        const errorText = await mathpixResponse.text();
        console.error('Mathpix error:', errorText);
        return new Response(
          JSON.stringify({
            error: 'Mathpix OCR failed',
            details: errorText
          }),
          {
            status: mathpixResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      const result = await mathpixResponse.json() as {
        text?: string;
        latex_styled?: string;
        error?: string;
      };

      return new Response(
        JSON.stringify({
          latex: result.latex_styled || result.text || '',
          raw: result,
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error'
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },
};
