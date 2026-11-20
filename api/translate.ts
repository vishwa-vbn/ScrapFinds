import type { VercelRequest, VercelResponse } from '@vercel/node';

type AdminCheck = { ok: true; uid: string } | { ok: false; status: number; msg: string };

async function verifyAdmin(req: VercelRequest): Promise<AdminCheck> {
  const allowed = (process.env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = req.headers.origin;
  const isTrustedDomain =
    !origin ||
    origin.endsWith('.vercel.app') ||
    origin.includes('localhost') ||
    origin.includes('127.0.0.1');

  if (origin && allowed.length > 0 && !allowed.includes(origin) && !isTrustedDomain) {
    return { ok: false, status: 403, msg: 'origin not allowed' };
  }

  const m = /^Bearer (.+)$/.exec(req.headers.authorization ?? '');
  if (!m) return { ok: false, status: 401, msg: 'missing token' };

  const idToken = m[1];
  const configuredAdminUid = (process.env.ADMIN_UID || 'hgSPBxuZM7PNGsfJKMz5Syd66dJ3').trim();
  const configuredAdminEmail = (process.env.ADMIN_EMAIL || 'vishwabnaik12@gmail.com').toLowerCase();

  // 1. Fast decode check for admin identity from Firebase JWT
  try {
    const parts = idToken.split('.');
    if (parts.length === 3) {
      const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
      const email = payload.email?.toLowerCase();
      const uid = payload.user_id || payload.sub;
      if (
        uid === configuredAdminUid ||
        email === configuredAdminEmail ||
        email === 'vishwabnaik12@gmail.com'
      ) {
        return { ok: true, uid: uid || configuredAdminUid };
      }
    }
  } catch {
    // fallback to identitytoolkit lookup
  }

  // 2. Network verification fallback
  const apiKey = process.env.FIREBASE_SERVER_API_KEY || process.env.VITE_FIREBASE_API_KEY;
  if (!apiKey) {
    return { ok: false, status: 500, msg: 'firebase api key not configured' };
  }

  try {
    const r = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    );

    if (!r.ok) return { ok: false, status: 401, msg: 'invalid token' };
    const data = (await r.json()) as { users?: Array<{ localId?: string; email?: string }> };
    const user = data?.users?.[0];
    const uid = user?.localId;
    const email = user?.email?.toLowerCase();

    const isAdminUid = uid && uid === configuredAdminUid;
    const isAdminEmail =
      email &&
      (email === 'vishwabnaik12@gmail.com' ||
        email === configuredAdminEmail);

    if (!isAdminUid && !isAdminEmail) {
      return { ok: false, status: 403, msg: 'not admin' };
    }

    return { ok: true, uid: uid || configuredAdminUid };
  } catch (err) {
    return { ok: false, status: 500, msg: (err as Error).message };
  }
}

interface EndpointCandidate {
  apiVer: 'v1' | 'v1beta';
  model: string;
}

function parseAiJson(rawText: string): any {
  if (!rawText) throw new Error('Empty AI response');
  const text = rawText.trim();

  // 1. Try direct parse
  try {
    return JSON.parse(text);
  } catch {}

  // 2. Strip markdown fences: ```json ... ``` or ``` ... ```
  const fenceRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = text.match(fenceRegex);
  if (match && match[1]) {
    try {
      return JSON.parse(match[1].trim());
    } catch {}
  }

  // 3. Extract outermost { ... }
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    const candidate = text.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  throw new Error(`Failed to parse AI response: ${text.slice(0, 120)}`);
}

async function callGeminiApi(
  key: string,
  chosenModel: string,
  promptText: string,
  schema: any,
  maxTokens = 2048
): Promise<{ ok: true; text: string } | { ok: false; status: number; error: string }> {
  // Active models on Google AI (v1beta first with gemini-3.5-flash leading)
  const candidates: EndpointCandidate[] = [
    { apiVer: 'v1beta', model: 'gemini-3.5-flash' },
    { apiVer: 'v1beta', model: 'gemini-3.1-flash-lite' },
    { apiVer: 'v1beta', model: 'gemini-3.8-flash' },
    { apiVer: 'v1', model: 'gemini-2.5-flash' },
    { apiVer: 'v1', model: 'gemini-2.5-pro' },
  ];

  if (
    chosenModel &&
    chosenModel !== 'gemini-1.5-flash' &&
    chosenModel !== 'gemini-1.5-flash-8b' &&
    chosenModel !== 'gemini-2.0-flash'
  ) {
    candidates.unshift(
      { apiVer: 'v1beta', model: chosenModel },
      { apiVer: 'v1', model: chosenModel }
    );
  }

  // Deduplicate
  const uniqueCandidates = candidates.filter(
    (c, i, a) => a.findIndex(x => x.apiVer === c.apiVer && x.model === c.model) === i
  );

  let lastError = '';

  for (const { apiVer, model } of uniqueCandidates) {
    const url = `https://generativelanguage.googleapis.com/${apiVer}/models/${model}:generateContent?key=${key}`;
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

      // If model does not support thinkingConfig, retry without it
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
          resp.status === 429 ||
          resp.status === 503 ||
          errText.includes('not found') ||
          errText.includes('not supported') ||
          errText.includes('is not available') ||
          errText.includes('Quota exceeded') ||
          errText.includes('RESOURCE_EXHAUSTED') ||
          errText.includes('high demand')
        ) {
          console.warn(`Endpoint ${apiVer}/models/${model} unavailable (${resp.status}), attempting next...`);
          lastError = errText;
          continue;
        }
        return { ok: false, status: resp.status, error: errText };
      }

      const data: any = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        return { ok: false, status: 502, error: 'No content returned from Gemini' };
      }
      return { ok: true, text };
    } catch (e: any) {
      lastError = e?.message || 'Network error';
    }
  }

  // Attempt dynamic discovery to show the exact available models if all failed
  try {
    const listResp = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${key}`);
    if (listResp.ok) {
      const data = (await listResp.json()) as { models?: Array<{ name?: string }> };
      const avail = (data.models || []).map(m => m.name).join(', ');
      return { ok: false, status: 502, error: `All models failed. Available on v1: [${avail}]. Last error: ${lastError}` };
    }
  } catch {}

  return { ok: false, status: 502, error: `All Flash models failed: ${lastError}` };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Require admin authorization
  const auth = await verifyAdmin(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ error: auth.msg });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on server (ensure you redeployed after adding the env var in Vercel)' });
  }

  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      return res.status(400).json({ error: 'Invalid JSON request body' });
    }
  }

  const { action, rawText, title, description, category, condition } = body || {};
  const requestedModel = process.env.GEMINI_MODEL || 'gemini-3.5-flash';

  // ACTION 1: Clean & Format raw unorganized text into clean English title + spec table
  if (action === 'format' || (rawText && !title && !description)) {
    if (!rawText || !rawText.trim()) {
      return res.status(400).json({ error: 'Raw text is required to format details' });
    }

    const formatPrompt = `You are an expert product catalog copywriter for a second-hand, recovered, and scrap item shop in India.
The user pasted unorganized raw text copied from e-commerce sites, manufacturer specs, or seller notes.
Extract the core item context and generate a clean, professional product title, a short buyer-friendly description, and a structured specification list.

Item context:
- Category: ${category || 'general'}
- Condition: ${condition || 'good'}
- Existing Title: ${title || ''}
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

    const formatSchema = {
      type: 'OBJECT',
      properties: {
        title: { type: 'STRING' },
        description: { type: 'STRING' },
      },
      required: ['title', 'description'],
    };

    const result = await callGeminiApi(apiKey, requestedModel, formatPrompt, formatSchema, 2048);
    if (!result.ok) {
      return res.status(result.status).json({ error: result.error });
    }

    try {
      const parsed = parseAiJson(result.text);
      return res.status(200).json(parsed);
    } catch (parseErr: any) {
      return res.status(502).json({ error: 'Failed to parse AI format response: ' + (parseErr?.message || '') });
    }
  }

  // ACTION 2: Multilingual translation (Kannada & Hindi) from user-approved English
  if (!title && !description) {
    return res.status(400).json({ error: 'Title or description is required for translation' });
  }

  const prompt = `You are a professional local second-hand and scrap item catalog copywriter in India.
Translate and adapt the following clean item listing into natural, clear Kannada (kn) and Hindi (hi) suitable for local second-hand buyers.

Item details:
- Category: ${category || 'general'}
- Condition: ${condition || 'good'}
- Title: ${title || ''}
- Description & Specs:
${description || ''}

Requirements:
1. Translate the title concisely into natural Kannada and Hindi (keep brand/model names recognizable).
2. Translate the description into clear, conversational, buyer-friendly language highlighting the working condition. If specifications are listed, preserve the bullet points clearly.
3. Keep translations concise and direct to ensure fast generation and clear reading.
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

  const result = await callGeminiApi(apiKey, requestedModel, prompt, translateSchema, 2048);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.error });
  }

  try {
    const parsed = parseAiJson(result.text);
    return res.status(200).json(parsed);
  } catch (parseErr: any) {
    return res.status(502).json({ error: 'Failed to parse AI translation response: ' + (parseErr?.message || '') });
  }
}
