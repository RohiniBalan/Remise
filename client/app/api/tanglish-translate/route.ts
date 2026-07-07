import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const INDICTRANS_URL = (process.env.INDICTRANS_URL || 'http://localhost:8400').replace(/\/$/, '');

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Gemini: Tanglish → English grocery term ───────────────────────────────────

async function geminiTranslate(text: string): Promise<string> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('No Gemini key');

  const prompt = `You are a Tamil grocery translator.
The user typed a grocery or household item in Tanglish (Tamil words written in English letters, e.g. "thengai ennai", "arisi", "vengayam").
Translate it to the standard English grocery/item name.
Return ONLY the English name — no explanation, no punctuation, nothing else.

Input: ${text}`;

  const body = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0, maxOutputTokens: 32 },
  });

  for (const model of ['gemini-2.0-flash', 'gemini-2.5-flash']) {
    for (const version of ['v1', 'v1beta']) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (res.status === 429) { await sleep(2000); continue; }
        if (!res.ok) continue;
        const out = ((await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        if (out) return out;
      } catch { continue; }
    }
  }
  throw new Error('Gemini unavailable');
}

// ── IndicTrans2: Tamil script → English ───────────────────────────────────────
// Fallback for when the text is already in Tamil Unicode script

async function indicTranslate(text: string): Promise<string> {
  const res = await fetch(`${INDICTRANS_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`IndicTrans2 ${res.status}`);
  const { translated } = await res.json();
  return translated?.trim() || text;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let text = '';
  try {
    ({ text } = await req.json());
    if (!text?.trim()) return NextResponse.json({ translated: text });

    const trimmed = text.trim();

    // If the text contains Tamil Unicode characters, use IndicTrans2 service
    const hasTamil = /[஀-௿]/.test(trimmed);
    const translated = hasTamil
      ? await indicTranslate(trimmed)
      : await geminiTranslate(trimmed);

    return NextResponse.json({ translated });

  } catch {
    return NextResponse.json({ translated: text });
  }
}
