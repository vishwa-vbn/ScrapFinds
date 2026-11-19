import type { ItemTranslation } from '../types/item';

export interface TranslationsResult {
  kn?: ItemTranslation;
  hi?: ItemTranslation;
}

export interface CleanItemResult {
  title: string;
  description: string;
}

interface FormatOptions {
  rawText: string;
  category?: string;
  condition?: string;
  currentTitle?: string;
  idToken?: string;
}

interface TranslateOptions {
  title: string;
  description: string;
  category?: string;
  condition?: string;
  idToken?: string;
}

interface EndpointCandidate {
  apiVer: 'v1' | 'v1beta';
  model: string;
}

async function callGeminiDirectClient(
  clientKey: string,
  chosenModel: string,
  promptText: string,
  schema: any,
  maxTokens = 600
): Promise<string> {
  const candidates: EndpointCandidate[] = [
    { apiVer: 'v1', model: 'gemini-1.5-flash' },
    { apiVer: 'v1beta', model: 'gemini-2.5-flash' },
    { apiVer: 'v1', model: 'gemini-1.5-pro' },
    { apiVer: 'v1beta', model: 'gemini-2.0-flash' },
    { apiVer: 'v1beta', model: 'gemini-1.5-flash' },
  ];

  if (
    chosenModel &&
    chosenModel !== 'gemini-3.8-flash' &&
    chosenModel !== 'gemini-1.5-flash-8b'
  ) {
    candidates.unshift(
      { apiVer: 'v1', model: chosenModel },
      { apiVer: 'v1beta', model: chosenModel }
    );
  }

  const uniqueCandidates = candidates.filter(
    (c, i, a) => a.findIndex(x => x.apiVer === c.apiVer && x.model === c.model) === i
  );

  let lastError = '';

  for (const { apiVer, model } of uniqueCandidates) {
    const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${clientKey}`;
    const genConfig: Record<string, any> = {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: schema,
      maxOutputTokens: maxTokens,
    };

    if (apiVer === 'v1beta') {
      genConfig.thinkingConfig = { thinkingBudget: 0 };
    }

    try {
      let resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: promptText }] }],
          generationConfig: genConfig,
        }),
      });

      if (!resp.ok && resp.status === 400) {
        const errClone = await resp.clone().text();
        if (errClone.includes('thinkingConfig') || errClone.includes('Unknown field')) {
          delete genConfig.thinkingConfig;
          resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }],
              generationConfig: genConfig,
            }),
          });
        }
      }

      if (!resp.ok) {
        const errText = await resp.text();
        if (
          resp.status === 404 ||
          errText.includes('not found') ||
          errText.includes('not supported') ||
          errText.includes('is not available')
        ) {
          console.warn(`Endpoint ${apiVer}/models/${model} not available, trying next...`);
          lastError = errText;
          continue;
        }
        throw new Error(`Gemini API returned ${resp.status}: ${errText}`);
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        throw new Error('No content returned by Gemini');
      }
      return text;
    } catch (err: any) {
      if (err.message?.includes('Gemini API returned')) throw err;
      lastError = err.message || 'Network error';
    }
  }

  throw new Error(`All Gemini Flash models failed: ${lastError}`);
}

/**
 * Takes unorganized, messy raw text copied from websites/catalogs
 * and extracts a clean, professional English title and description with specifications.
 */
export async function cleanAndFormatItemWithGemini({
  rawText,
  category,
  condition,
  currentTitle,
  idToken,
}: FormatOptions): Promise<CleanItemResult> {
  const payload = {
    action: 'format',
    rawText,
    category,
    condition,
    title: currentTitle,
  };

  // 1. Try serverless backend endpoint (/api/translate)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as CleanItemResult;
    }

    const errData = await res.json().catch(() => ({}));
    const serverError = errData?.error || `Server returned HTTP ${res.status}`;

    const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (res.status === 404 && clientKey) {
      console.warn('API endpoint /api/translate not found (404), using client Gemini key.');
    } else {
      throw new Error(serverError);
    }
  } catch (err: any) {
    if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('abort') && !err.message.includes('NetworkError')) {
      throw err;
    }

    const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!clientKey) {
      throw new Error(err?.message || 'Network error reaching /api/translate');
    }
    console.warn('Serverless endpoint unreachable, falling back to direct client API call:', err);
  }

  // 2. Direct fallback
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!clientKey) {
    throw new Error('Gemini API key is not configured');
  }

  const formatPrompt = `You are an expert product catalog copywriter for a second-hand, recovered, and scrap item shop in India.
The user pasted unorganized raw text copied from e-commerce sites, manufacturer specs, or seller notes.
Extract the core item context and generate a clean, professional product title, a short buyer-friendly description, and a structured specification list.

Item context:
- Category: ${category || 'general'}
- Condition: ${condition || 'good'}
- Existing Title: ${currentTitle || ''}
- Raw Copied Text:
${rawText}

Requirements:
1. Title: Crisp, professional title (under 75 characters) with Brand + Model + Key specs (e.g. "Sony Bravia 43-inch 4K UHD Smart Android TV").
2. Description:
   - 2-3 clear sentences explaining what the item is and its condition appeal for a local buyer.
   - Follow with a clean "Specifications:" section using bullet points ("• Spec: Value") for the most important specs (Brand, Model, Dimensions/Capacity, Key Features, Inclusions).
   - Filter out all irrelevant fluff: shipping policies, foreign prices, return policies, review ratings, or long marketing jargon.
   - Keep the entire description concise (under 160 words).
3. Return ONLY a single raw valid JSON object with exact structure:
{
  "title": "Clean Product Title",
  "description": "Clean description sentences.\n\nSpecifications:\n• Brand: ...\n• Model: ...\n• ..."
}
Do not wrap in markdown or backticks. Return valid JSON only.`;

  const requestedModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  const formatSchema = {
    type: 'OBJECT',
    properties: {
      title: { type: 'STRING' },
      description: { type: 'STRING' },
    },
    required: ['title', 'description'],
  };

  const candidateText = await callGeminiDirectClient(clientKey, requestedModel, formatPrompt, formatSchema, 600);

  const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleanJson) as CleanItemResult;
}

/**
 * Translates item details using Gemini AI.
 * First tries the secure serverless backend `/api/translate`.
 * In local dev mode or fallback, can invoke Gemini directly using client key.
 */
export async function translateItemWithGemini({
  title,
  description,
  category,
  condition,
  idToken,
}: TranslateOptions): Promise<TranslationsResult> {
  const payload = { action: 'translate', title, description, category, condition };

  // 1. Try serverless backend endpoint (/api/translate)
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000);

    const res = await fetch('/api/translate', {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      return data as TranslationsResult;
    }

    // Capture the real server error message
    const errData = await res.json().catch(() => ({}));
    const serverError = errData?.error || `Server returned HTTP ${res.status}`;

    // If endpoint doesn't exist (e.g. standard Vite dev without serverless api) AND client key is provided, fallback
    const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (res.status === 404 && clientKey) {
      console.warn('API endpoint /api/translate not found (404), using client Gemini key.');
    } else {
      // Surface the actual server error
      throw new Error(serverError);
    }
  } catch (err: any) {
    // If it's a server error we threw above, bubble it up directly
    if (err?.message && !err.message.includes('Failed to fetch') && !err.message.includes('abort') && !err.message.includes('NetworkError')) {
      throw err;
    }

    const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!clientKey) {
      throw new Error(err?.message || 'Network error reaching /api/translate');
    }
    console.warn('Serverless endpoint unreachable, falling back to direct client API call:', err);
  }

  // 2. Direct fallback (e.g. for Vite local dev without `vercel dev` server running)
  const clientKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!clientKey) {
    throw new Error('Gemini API key is not configured');
  }

  const prompt = `You are a professional local second-hand and scrap item catalog copywriter in India.
Translate and adapt the following item listing into natural, clear Kannada (kn) and Hindi (hi) suitable for local second-hand buyers.

Item details:
- Category: ${category || 'general'}
- Condition: ${condition || 'good'}
- Title: ${title || ''}
- Description: ${description || ''}

Requirements:
1. Translate the title concisely into natural Kannada and Hindi (keep brand/model names recognizable).
2. Translate the description into clear, conversational, buyer-friendly language highlighting the working condition.
3. Keep translations concise and direct (under 35 words each) to ensure fast generation and clear reading.
4. Return ONLY a single raw valid JSON object with exact structure:
{
  "kn": {
    "title": "...",
    "description": "..."
  },
  "hi": {
    "title": "...",
    "description": "..."
  }
}
Do not wrap in markdown or backticks. Return valid JSON only.`;

  const requestedModel = import.meta.env.VITE_GEMINI_MODEL || 'gemini-1.5-flash';
  const translateSchema = {
    type: 'OBJECT',
    properties: {
      kn: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
        },
        required: ['title', 'description'],
      },
      hi: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
        },
        required: ['title', 'description'],
      },
    },
    required: ['kn', 'hi'],
  };

  const candidateText = await callGeminiDirectClient(clientKey, requestedModel, prompt, translateSchema, 600);

  const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleanJson) as TranslationsResult;
}

