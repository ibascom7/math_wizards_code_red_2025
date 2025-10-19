/**
 * Cloudflare Worker - ElevenLabs Text-to-Speech Proxy
 *
 * Proxies text-to-speech requests to ElevenLabs API
 * Returns MP3 audio for speaking LaTeX/math explanations
 *
 * @endpoint POST /
 * @request { "text": "text to speak", "voiceId"?: "voice-id", "apiKey": "your-api-key" }
 * @response Audio/mpeg file
 */

interface Env {
  // Optional: Store API key as secret instead of requiring it in requests
  ELEVENLABS_API_KEY?: string;
}

interface TTSRequest {
  text: string;
  voiceId?: string;
  modelId?: string;
  apiKey?: string;
}

const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM'; // Rachel - clear, professional voice
const DEFAULT_MODEL_ID = 'eleven_multilingual_v2';

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

    // Only allow POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed. Use POST.' }),
        {
          status: 405,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    try {
      const body: TTSRequest = await request.json();

      // Validate request
      if (!body.text) {
        return new Response(
          JSON.stringify({ error: 'text is required' }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      // Use API key from request or environment variable
      const apiKey = body.apiKey || env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return new Response(
          JSON.stringify({
            error: 'API key is required. Provide apiKey in request body or set ELEVENLABS_API_KEY secret.'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      const voiceId = body.voiceId || DEFAULT_VOICE_ID;
      const modelId = body.modelId || DEFAULT_MODEL_ID;

      // Call ElevenLabs API
      const elevenLabsResponse = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Accept': 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': apiKey,
          },
          body: JSON.stringify({
            text: body.text,
            model_id: modelId,
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            },
          }),
        }
      );

      if (!elevenLabsResponse.ok) {
        const errorText = await elevenLabsResponse.text();
        return new Response(
          JSON.stringify({
            error: `ElevenLabs API error: ${elevenLabsResponse.status}`,
            details: errorText,
          }),
          {
            status: elevenLabsResponse.status,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      const audioData = await elevenLabsResponse.arrayBuffer();

      // Return audio with CORS headers
      return new Response(audioData, {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'public, max-age=3600',
        },
      });

    } catch (error) {
      console.error('TTS error:', error);
      return new Response(
        JSON.stringify({
          error: 'Internal server error',
          details: error instanceof Error ? error.message : 'Unknown error',
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
