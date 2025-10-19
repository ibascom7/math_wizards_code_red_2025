/**
 * Cloudflare Worker - STEM Keyword Detection API
 *
 * Detects STEM keywords in text extracted from PDFs (e.g., LaTeX code)
 * Returns keyword matches with positions for highlighting
 *
 * @module cloudflare-worker/keyword-detector
 */

import { KeywordDetector } from './KeywordDetector.js';
import { getAllFields, hasField } from './fieldKeywords.js';

/**
 * Handle CORS preflight requests
 */
function handleOptions(request) {
  const headers = request.headers;

  if (
    headers.get('Origin') !== null &&
    headers.get('Access-Control-Request-Method') !== null &&
    headers.get('Access-Control-Request-Headers') !== null
  ) {
    // Handle CORS preflight request
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Max-Age': '86400',
      },
    });
  }

  return new Response(null, {
    headers: {
      'Allow': 'GET, POST, OPTIONS',
    },
  });
}

/**
 * Add CORS headers to response
 */
function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

/**
 * Create error response
 */
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    success: false,
    error: message,
    timestamp: new Date().toISOString()
  }), {
    status,
    headers: corsHeaders()
  });
}

/**
 * Create success response
 */
function successResponse(data) {
  return new Response(JSON.stringify({
    success: true,
    ...data,
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: corsHeaders()
  });
}

/**
 * Handle GET request - API documentation
 */
function handleGet() {
  return successResponse({
    name: 'STEM Keyword Detection API',
    version: '1.0.0',
    description: 'Detects STEM keywords in text with position tracking',
    endpoints: {
      'POST /detect': {
        description: 'Detect keywords in word array',
        body: {
          words: 'Array<{text: string, x: number, y: number, width: number, height: number}>',
          targetFields: 'string[] (optional) - STEM fields to search',
          minConfidence: 'number (optional) - Minimum confidence threshold (0-1)',
          caseSensitive: 'boolean (optional) - Case-sensitive matching',
          multiWordMatching: 'boolean (optional) - Enable phrase matching'
        },
        returns: {
          keywords: 'Array of detected keywords with positions',
          statistics: 'Detection statistics'
        }
      },
      'GET /fields': {
        description: 'Get all available STEM fields',
        returns: {
          fields: 'Array of field names',
          count: 'Number of available fields'
        }
      },
      'GET /health': {
        description: 'Health check endpoint',
        returns: {
          status: 'ok'
        }
      }
    },
    examples: {
      detect: {
        url: 'POST /detect',
        body: {
          words: [
            { text: 'neural', x: 50, y: 100, width: 60, height: 20 },
            { text: 'network', x: 120, y: 100, width: 70, height: 20 }
          ],
          targetFields: ['machine learning'],
          minConfidence: 0.7
        }
      }
    }
  });
}

/**
 * Handle keyword detection request
 */
async function handleDetect(request) {
  let body;

  try {
    body = await request.json();
  } catch (e) {
    return errorResponse('Invalid JSON in request body');
  }

  // Validate request body
  if (!body.words || !Array.isArray(body.words)) {
    return errorResponse('Missing or invalid "words" array in request body');
  }

  // Validate word format
  for (let i = 0; i < body.words.length; i++) {
    const word = body.words[i];
    if (!word.text || typeof word.text !== 'string') {
      return errorResponse(`Invalid word at index ${i}: missing or invalid "text" field`);
    }
    if (typeof word.x !== 'number' || typeof word.y !== 'number') {
      return errorResponse(`Invalid word at index ${i}: missing or invalid position (x, y)`);
    }
    if (typeof word.width !== 'number' || typeof word.height !== 'number') {
      return errorResponse(`Invalid word at index ${i}: missing or invalid dimensions (width, height)`);
    }
  }

  // Validate target fields if provided
  if (body.targetFields) {
    if (!Array.isArray(body.targetFields)) {
      return errorResponse('targetFields must be an array of field names');
    }

    // Check if fields exist
    const invalidFields = body.targetFields.filter(field => !hasField(field));
    if (invalidFields.length > 0) {
      return errorResponse(`Invalid fields: ${invalidFields.join(', ')}. Use GET /fields to see available fields.`);
    }
  }

  // Validate minConfidence if provided
  if (body.minConfidence !== undefined) {
    if (typeof body.minConfidence !== 'number' || body.minConfidence < 0 || body.minConfidence > 1) {
      return errorResponse('minConfidence must be a number between 0 and 1');
    }
  }

  try {
    // Create detector with configuration
    const detector = new KeywordDetector({
      targetFields: body.targetFields,
      minConfidence: body.minConfidence,
      caseSensitive: body.caseSensitive,
      multiWordMatching: body.multiWordMatching
    });

    // Detect keywords
    const keywords = detector.detectKeywords(body.words);
    const statistics = detector.getStatistics(keywords);

    return successResponse({
      keywords,
      statistics,
      config: detector.getConfig()
    });

  } catch (error) {
    return errorResponse(`Detection error: ${error.message}`, 500);
  }
}

/**
 * Handle GET /fields request
 */
function handleGetFields() {
  const fields = getAllFields();

  return successResponse({
    fields,
    count: fields.length,
    categories: {
      mathematics: fields.filter(f =>
        ['group theory', 'topology', 'differential geometry', 'algebra',
         'analysis', 'number theory', 'category theory', 'algebraic topology',
         'logic', 'combinatorics'].includes(f)
      ),
      'computer science': fields.filter(f =>
        ['algorithms & data structures', 'machine learning', 'operating systems',
         'programming languages', 'databases'].includes(f)
      ),
      physics: fields.filter(f =>
        ['classical mechanics', 'quantum mechanics', 'thermodynamics',
         'electromagnetism', 'relativity'].includes(f)
      ),
      chemistry: fields.filter(f =>
        ['organic chemistry', 'inorganic chemistry', 'physical chemistry',
         'biochemistry'].includes(f)
      ),
      biology: fields.filter(f =>
        ['molecular biology', 'cell biology', 'genetics', 'evolution',
         'ecology'].includes(f)
      ),
      engineering: fields.filter(f =>
        ['electrical engineering', 'mechanical engineering', 'civil engineering',
         'chemical engineering'].includes(f)
      )
    }
  });
}

/**
 * Handle health check request
 */
function handleHealth() {
  return successResponse({
    status: 'ok',
    uptime: 'healthy'
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions(request);
    }

    // Route requests
    try {
      // GET /
      if (request.method === 'GET' && path === '/') {
        return handleGet();
      }

      // GET /fields
      if (request.method === 'GET' && path === '/fields') {
        return handleGetFields();
      }

      // GET /health
      if (request.method === 'GET' && path === '/health') {
        return handleHealth();
      }

      // POST /detect
      if (request.method === 'POST' && path === '/detect') {
        return await handleDetect(request);
      }

      // 404 - Not Found
      return errorResponse(`Endpoint not found: ${request.method} ${path}`, 404);

    } catch (error) {
      console.error('Unhandled error:', error);
      return errorResponse(`Internal server error: ${error.message}`, 500);
    }
  }
};
