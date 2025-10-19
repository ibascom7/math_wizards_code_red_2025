/**
 * Cloudflare Worker for Math Explanations using Gemini AI
 *
 * Accepts POST requests with JSON body containing LaTeX/math content
 * and returns plain text explanations from Google's Gemini API.
 *
 * @endpoint POST /
 * @request { "mathContent": "latex or markdown math here", "model"?: "gemini-1.5-pro" }
 * @response Plain text explanation
 */

interface Env {
  GEMINI_API_KEY: string;
}

interface MathRequest {
  mathContent: string;
  model?: string;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    // Only accept POST requests
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed. Use POST." }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }

    try {
      // Parse request body
      const body: MathRequest = await request.json();

      if (!body.mathContent) {
        return new Response(
          JSON.stringify({ error: "mathContent is required" }),
          {
            status: 400,
            headers: {
              "Content-Type": "application/json",
              "Access-Control-Allow-Origin": "*",
            }
          }
        );
      }

      // Call Gemini API
      const explanation = await explainMath(
        body.mathContent,
        env.GEMINI_API_KEY,
        body.model || "gemini-2.0-flash-exp"
      );

      // Return plain text response
      return new Response(explanation, {
        status: 200,
        headers: {
          "Content-Type": "text/plain",
          "Access-Control-Allow-Origin": "*",
        },
      });

    } catch (error) {
      console.error("Error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to generate explanation",
          details: error instanceof Error ? error.message : String(error)
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          }
        }
      );
    }
  },
};

/**
 * Call Gemini API to explain math content
 */
async function explainMath(
  mathContent: string,
  apiKey: string,
  model: string = "gemini-2.0-flash-exp"
): Promise<string> {
  const systemPrompt = `You are a helpful math tutor who explains mathematical concepts in an accessible, easy-to-understand way.

Your task is to:
1. Analyze the LaTeX/Markdown math content provided
2. Break down complex concepts into simpler parts
3. Explain the meaning and intuition behind formulas and equations
4. Provide real-world analogies when helpful
5. Use clear, conversational language while maintaining mathematical accuracy
6. Highlight key insights and common pitfalls

Format your explanation with:
- Clear section headers
- Step-by-step breakdowns when appropriate
- Examples that illustrate the concept
- Summaries of key takeaways`;

  const prompt = `${systemPrompt}

Here is the math content to explain:

${mathContent}

Please provide a clear, accessible explanation of this mathematical content.`;

  // Call Gemini API
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: prompt,
              },
            ],
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data: any = await response.json();

  // Extract text from Gemini response
  if (data.candidates && data.candidates[0]?.content?.parts?.[0]?.text) {
    return data.candidates[0].content.parts[0].text;
  }

  throw new Error("Unexpected response format from Gemini API");
}
