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

  const model = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
  const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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

    const formatConfig: Record<string, any> = {
      temperature: 0.2,
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'OBJECT',
        properties: {
          title: { type: 'STRING' },
          description: { type: 'STRING' },
        },
        required: ['title', 'description'],
      },
      maxOutputTokens: 500,
      thinkingConfig: {
        thinkingBudget: 0,
      },
    };

    try {
      let response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: formatPrompt }] }],
          generationConfig: formatConfig,
        }),
      });

      if (!response.ok && response.status === 400) {
        const errClone = await response.clone().text();
        if (errClone.includes('thinkingConfig') || errClone.includes('Unknown field')) {
          delete formatConfig.thinkingConfig;
          response = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: formatPrompt }] }],
              generationConfig: formatConfig,
            }),
          });
        }
      }

      if (!response.ok) {
        const errText = await response.text();
        console.error('Gemini format error:', response.status, errText);
        return res.status(502).json({ error: `Gemini API error ${response.status}: ${errText}` });
      }

      const data: any = await response.json();
      const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!candidateText) {
        return res.status(502).json({ error: 'No formatted content generated' });
      }

      const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
      const parsed = JSON.parse(cleanJson);
      return res.status(200).json(parsed);
    } catch (err) {
      console.error('Format error:', err);
      return res.status(500).json({ error: (err as Error).message || 'Failed to format raw text' });
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

  try {
    let response = await fetch(apiUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig,
      }),
    });

    // If model endpoint rejects thinkingConfig, gracefully retry without it
    if (!response.ok && response.status === 400) {
      const errClone = await response.clone().text();
      if (errClone.includes('thinkingConfig') || errClone.includes('Unknown field')) {
        delete generationConfig.thinkingConfig;
        response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig,
          }),
        });
      }
    }

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ error: `Gemini API returned ${response.status}: ${errText}` });
    }

    const data: any = await response.json();
    const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) {
      return res.status(502).json({ error: 'No translation generated by Gemini' });
    }

    const cleanJson = candidateText.replace(/^```json/i, '').replace(/```$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    return res.status(200).json(parsed);
  } catch (err) {
    console.error('Translation error:', err);
    return res.status(500).json({ error: (err as Error).message || 'Failed to generate translations' });
  }
}
