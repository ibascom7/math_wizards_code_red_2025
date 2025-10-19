/**
 * Keyword Links Worker
 *
 * Takes a list of keywords, highlights them, and returns relevant academic links
 * for each keyword using Google Custom Search API with STEM-focused filtering.
 */

interface Env {
  GOOGLE_API_KEY: string;
  GOOGLE_SEARCH_ENGINE_ID: string;
}

interface Keyword {
  text: string;
  field?: string; // STEM field (e.g., "machine learning", "group theory")
  context?: string[]; // Related concepts for better search
}

interface HighlightPosition {
  text: string;
  startIndex: number;
  endIndex: number;
  field?: string;
}

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  displayLink: string;
  relevanceScore: number;
}

interface KeywordResult {
  keyword: string;
  field?: string;
  highlights: HighlightPosition[];
  links: SearchResult[];
  searchQuery: string;
}

interface ProcessRequest {
  text: string;
  keywords: Keyword[];
  maxLinksPerKeyword?: number;
  minRelevanceScore?: number;
}

interface ProcessResponse {
  success: boolean;
  results: KeywordResult[];
  statistics: {
    totalKeywords: number;
    totalHighlights: number;
    totalLinks: number;
    averageLinksPerKeyword: number;
  };
  timestamp: string;
}

/**
 * CORS headers for browser compatibility
 */
function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };
}

/**
 * Error response helper
 */
function errorResponse(message: string, status: number = 400): Response {
  return new Response(
    JSON.stringify({
      success: false,
      error: message,
      timestamp: new Date().toISOString(),
    }),
    { status, headers: corsHeaders() }
  );
}

/**
 * Success response helper
 */
function successResponse(data: any): Response {
  return new Response(
    JSON.stringify({
      success: true,
      ...data,
      timestamp: new Date().toISOString(),
    }),
    { status: 200, headers: corsHeaders() }
  );
}

/**
 * Highlight keywords in text
 */
function highlightKeywords(text: string, keywords: Keyword[]): Map<string, HighlightPosition[]> {
  const results = new Map<string, HighlightPosition[]>();

  for (const keyword of keywords) {
    const highlights: HighlightPosition[] = [];
    const searchText = keyword.text.toLowerCase();
    const lowerText = text.toLowerCase();

    let startIndex = 0;
    while ((startIndex = lowerText.indexOf(searchText, startIndex)) !== -1) {
      highlights.push({
        text: text.substring(startIndex, startIndex + keyword.text.length),
        startIndex,
        endIndex: startIndex + keyword.text.length,
        field: keyword.field,
      });
      startIndex += keyword.text.length;
    }

    if (highlights.length > 0) {
      results.set(keyword.text, highlights);
    }
  }

  return results;
}

/**
 * Build optimized search query with field context
 */
function buildSearchQuery(keyword: Keyword): string {
  const parts = [keyword.text];

  if (keyword.field) {
    parts.push(keyword.field);
  }

  if (keyword.context && keyword.context.length > 0) {
    // Add up to 2 context terms
    parts.push(...keyword.context.slice(0, 2));
  }

  return parts.join(' ');
}

/**
 * Fetch search results from Google Custom Search API
 */
async function fetchSearchResults(
  query: string,
  apiKey: string,
  searchEngineId: string,
  numResults: number = 10
): Promise<any> {
  const url = new URL('https://www.googleapis.com/customsearch/v1');
  url.searchParams.set('key', apiKey);
  url.searchParams.set('cx', searchEngineId);
  url.searchParams.set('q', query);
  url.searchParams.set('num', numResults.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Google API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Trusted academic domains with authority scores
 */
const DOMAIN_AUTHORITY: Record<string, number> = {
  // Mathematics
  'mathworld.wolfram.com': 0.95,
  'ncatlab.org': 0.95,
  'planetmath.org': 0.85,
  'mathoverflow.net': 0.85,
  'en.wikipedia.org': 0.75,

  // Computer Science
  'arxiv.org': 0.95,
  'dl.acm.org': 0.95,
  'ieeexplore.ieee.org': 0.95,
  'stackoverflow.com': 0.80,
  'github.com': 0.70,

  // Physics
  'aps.org': 0.95,
  'iop.org': 0.95,
  'cern.ch': 0.95,
  'physics.stackexchange.com': 0.75,

  // Chemistry
  'acs.org': 0.95,
  'rsc.org': 0.95,
  'ncbi.nlm.nih.gov': 0.90,
  'chemistry.stackexchange.com': 0.75,

  // Biology
  'nature.com': 0.95,
  'cell.com': 0.95,
  'nih.gov': 0.90,
  'sciencedirect.com': 0.85,

  // General Academic
  'scholar.google.com': 0.85,
  'researchgate.net': 0.75,
  'academia.edu': 0.70,
};

/**
 * Calculate domain authority score
 */
function getDomainAuthority(url: string): number {
  try {
    const domain = new URL(url).hostname.replace('www.', '');
    return DOMAIN_AUTHORITY[domain] || 0.5; // Default moderate score
  } catch {
    return 0.5;
  }
}

/**
 * Calculate relevance score for search result
 */
function calculateRelevanceScore(
  result: any,
  keyword: Keyword,
  originalQuery: string
): number {
  const title = (result.title || '').toLowerCase();
  const snippet = (result.snippet || '').toLowerCase();
  const searchTerm = keyword.text.toLowerCase();

  // Factor 1: Domain Authority (40%)
  const domainScore = getDomainAuthority(result.link);

  // Factor 2: Term Frequency (40%)
  const titleMatches = (title.match(new RegExp(searchTerm, 'g')) || []).length;
  const snippetMatches = (snippet.match(new RegExp(searchTerm, 'g')) || []).length;
  const termScore = Math.min((titleMatches * 3 + snippetMatches) / 10, 1.0);

  // Factor 3: Field Relevance (20%)
  let fieldScore = 0.5; // Default
  if (keyword.field) {
    const fieldLower = keyword.field.toLowerCase();
    if (title.includes(fieldLower) || snippet.includes(fieldLower)) {
      fieldScore = 1.0;
    }
  }

  // Weighted combination
  const finalScore = (domainScore * 0.4) + (termScore * 0.4) + (fieldScore * 0.2);

  return Math.round(finalScore * 100) / 100; // Round to 2 decimals
}

/**
 * Process search results and filter by relevance
 */
function processSearchResults(
  googleResponse: any,
  keyword: Keyword,
  query: string,
  maxResults: number,
  minScore: number
): SearchResult[] {
  if (!googleResponse.items || !Array.isArray(googleResponse.items)) {
    return [];
  }

  const results: SearchResult[] = googleResponse.items.map((item: any) => {
    const relevanceScore = calculateRelevanceScore(item, keyword, query);

    return {
      title: item.title,
      url: item.link,
      snippet: item.snippet || '',
      displayLink: item.displayLink || '',
      relevanceScore,
    };
  });

  // Filter by minimum score and sort by relevance
  return results
    .filter(r => r.relevanceScore >= minScore)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, maxResults);
}

/**
 * Process keywords and generate links
 */
async function processKeywords(
  text: string,
  keywords: Keyword[],
  apiKey: string,
  searchEngineId: string,
  maxLinksPerKeyword: number,
  minRelevanceScore: number
): Promise<KeywordResult[]> {
  // Highlight all keywords in text
  const highlightMap = highlightKeywords(text, keywords);

  const results: KeywordResult[] = [];

  // Process each keyword
  for (const keyword of keywords) {
    const highlights = highlightMap.get(keyword.text) || [];

    // Build search query
    const searchQuery = buildSearchQuery(keyword);

    // Fetch search results
    let links: SearchResult[] = [];
    try {
      const googleResponse = await fetchSearchResults(
        searchQuery,
        apiKey,
        searchEngineId,
        10 // Fetch 10, filter to top N
      );

      links = processSearchResults(
        googleResponse,
        keyword,
        searchQuery,
        maxLinksPerKeyword,
        minRelevanceScore
      );
    } catch (error) {
      console.error(`Search failed for "${keyword.text}":`, error);
      // Continue with empty links
    }

    results.push({
      keyword: keyword.text,
      field: keyword.field,
      highlights,
      links,
      searchQuery,
    });
  }

  return results;
}

/**
 * Calculate statistics
 */
function calculateStatistics(results: KeywordResult[]) {
  const totalKeywords = results.length;
  const totalHighlights = results.reduce((sum, r) => sum + r.highlights.length, 0);
  const totalLinks = results.reduce((sum, r) => sum + r.links.length, 0);
  const averageLinksPerKeyword = totalKeywords > 0
    ? Math.round((totalLinks / totalKeywords) * 10) / 10
    : 0;

  return {
    totalKeywords,
    totalHighlights,
    totalLinks,
    averageLinksPerKeyword,
  };
}

/**
 * Handle POST /process - Main endpoint
 */
async function handleProcess(request: Request, env: Env): Promise<Response> {
  let body: ProcessRequest;

  try {
    body = await request.json();
  } catch {
    return errorResponse('Invalid JSON in request body');
  }

  // Validate request
  if (!body.text || typeof body.text !== 'string') {
    return errorResponse('Missing or invalid "text" field');
  }

  if (!body.keywords || !Array.isArray(body.keywords) || body.keywords.length === 0) {
    return errorResponse('Missing or empty "keywords" array');
  }

  // Validate keywords
  for (let i = 0; i < body.keywords.length; i++) {
    const kw = body.keywords[i];
    if (!kw.text || typeof kw.text !== 'string') {
      return errorResponse(`Invalid keyword at index ${i}: missing "text" field`);
    }
  }

  // Check API credentials
  if (!env.GOOGLE_API_KEY || !env.GOOGLE_SEARCH_ENGINE_ID) {
    return errorResponse(
      'Google API credentials not configured. Set GOOGLE_API_KEY and GOOGLE_SEARCH_ENGINE_ID secrets.',
      500
    );
  }

  const maxLinksPerKeyword = body.maxLinksPerKeyword || 3;
  const minRelevanceScore = body.minRelevanceScore || 0.3;

  try {
    const results = await processKeywords(
      body.text,
      body.keywords,
      env.GOOGLE_API_KEY,
      env.GOOGLE_SEARCH_ENGINE_ID,
      maxLinksPerKeyword,
      minRelevanceScore
    );

    const statistics = calculateStatistics(results);

    return successResponse({
      results,
      statistics,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Processing error: ${message}`, 500);
  }
}

/**
 * Handle GET / - API documentation
 */
function handleGetRoot(): Response {
  return successResponse({
    name: 'Keyword Links API',
    version: '1.0.0',
    description: 'Highlights keywords in text and returns relevant academic links',
    endpoints: {
      'POST /process': {
        description: 'Process text with keywords and get links',
        body: {
          text: 'string - Text to search for keywords',
          keywords: 'Array<{text: string, field?: string, context?: string[]}> - Keywords to highlight and search',
          maxLinksPerKeyword: 'number (optional, default: 3) - Max links per keyword',
          minRelevanceScore: 'number (optional, default: 0.3) - Minimum relevance score (0-1)',
        },
        returns: {
          results: 'Array of keyword results with highlights and links',
          statistics: 'Processing statistics',
        },
      },
      'GET /health': {
        description: 'Health check',
        returns: { status: 'ok' },
      },
    },
    example: {
      request: {
        text: 'In group theory, the Sylow theorems describe the structure of finite groups.',
        keywords: [
          {
            text: 'Sylow theorems',
            field: 'group theory',
            context: ['finite groups', 'subgroups'],
          },
          {
            text: 'group theory',
          },
        ],
        maxLinksPerKeyword: 3,
        minRelevanceScore: 0.5,
      },
      response: {
        results: [
          {
            keyword: 'Sylow theorems',
            field: 'group theory',
            highlights: [
              {
                text: 'Sylow theorems',
                startIndex: 19,
                endIndex: 33,
                field: 'group theory',
              },
            ],
            links: [
              {
                title: "Sylow's Theorems - Wolfram MathWorld",
                url: 'https://mathworld.wolfram.com/SylowTheorems.html',
                snippet: 'The Sylow theorems are a collection of theorems...',
                displayLink: 'mathworld.wolfram.com',
                relevanceScore: 0.92,
              },
            ],
            searchQuery: 'Sylow theorems group theory finite groups',
          },
        ],
        statistics: {
          totalKeywords: 2,
          totalHighlights: 3,
          totalLinks: 5,
          averageLinksPerKeyword: 2.5,
        },
      },
    },
  });
}

/**
 * Handle GET /health - Health check
 */
function handleHealth(): Response {
  return successResponse({
    status: 'ok',
    uptime: 'healthy',
  });
}

/**
 * Handle OPTIONS - CORS preflight
 */
function handleOptions(): Response {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    try {
      // GET /
      if (request.method === 'GET' && path === '/') {
        return handleGetRoot();
      }

      // GET /health
      if (request.method === 'GET' && path === '/health') {
        return handleHealth();
      }

      // POST /process
      if (request.method === 'POST' && path === '/process') {
        return await handleProcess(request, env);
      }

      // 404
      return errorResponse(`Endpoint not found: ${request.method} ${path}`, 404);
    } catch (error) {
      console.error('Unhandled error:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return errorResponse(`Internal server error: ${message}`, 500);
    }
  },
};
