import type { ItemTranslation } from '../types/item';

export interface TranslationsResult {
  kn?: ItemTranslation;
  hi?: ItemTranslation;
}

interface TranslateOptions {
  title: string;
  description: string;
  category?: string;
  condition?: string;
  idToken?: string;
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
  const payload = { title, description, category, condition };

  // 1. Try serverless endpoint first with a tight timeout to prevent long hangs
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (idToken) {
      headers.Authorization = `Bearer ${idToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

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
    } else {
      const errData = await res.json().catch(() => ({}));
      console.warn('Translate endpoint returned non-OK status, falling back to direct API:', res.status, errData);
    }
  } catch (err) {
    console.warn('Serverless translate endpoint error, falling back to direct API:', err);
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

  const model = import.meta.env.VITE_GEMINI_MODEL || 'gemini-3.8-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${clientKey}`;

  const generationConfig: Record<string, any> = {
    temperature: 0.2,
    responseMimeType: 'application/json',
    responseSchema: {
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
    },
    maxOutputTokens: 500,
    thinkingConfig: {
      thinkingBudget: 0,
    },
  };

  let res = await fetch(apiUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig,
    }),
  });

  // If model endpoint rejects thinkingConfig, gracefully retry without it
  if (!res.ok && res.status === 400) {
    const errClone = await res.clone().text();
    if (errClone.includes('thinkingConfig') || errClone.includes('Unknown field')) {
      delete generationConfig.thinkingConfig;
      res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      });
    }
  }

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API returned ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!candidateText) {
    throw new Error('No content returned by Gemini');
  }

  const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
  return JSON.parse(cleanJson) as TranslationsResult;
}

