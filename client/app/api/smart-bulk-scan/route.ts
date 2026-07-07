import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const INDICTRANS_URL = (process.env.INDICTRANS_URL || 'http://localhost:8400').replace(/\/$/, '');

// ── OCR prompt specifically for shopping / purchase lists ─────────────────────
const OCR_PROMPT = `You are an OCR engine scanning a handwritten or printed shopping list / purchase order.
Read every line exactly as written. Preserve the original language and script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Marathi, Odia, or English).
Output each line on its own line, top to bottom. Do NOT translate. Do NOT describe. Do NOT skip lines.`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Item parser (English text after translation) ──────────────────────────────

// Matches: "2 kg", "1/2 kg", "1 1/2 kg", "0.5 kg", "half kg", "quarter kg"
const FRAC_NUM  = /(?:\d+\s+)?\d+\/\d+|\d+(?:[.,]\d+)?/;  // fraction or decimal or whole
const UNIT_WORDS = /kg|g|gm|gms|gram|grams|ml|l|ltr|litre|litres|liter|liters|lt|pcs|pc|piece|pieces|nos|no|packet|packets|pack|packs|box|boxes|dozen|doz|bundle|bundles|bag|bags|bottle|bottles|can|cans|unit|units|set|sets|pair|pairs|kilo|kilos/i;

// Capture: (number_part)(unit_part) — number can be a fraction or word
const UNIT_RE = new RegExp(
  `((?:(?:half|quarter|three[- ]quarter)\\s+)|(?:(?:\\d+\\s+)?\\d+\\/\\d+\\s+)|(?:\\d+(?:[.,]\\d+)?\\s*))(${UNIT_WORDS.source})\\.?\\b`,
  'i'
);

interface BulkItem {
  name: string;
  quantity: string;
}

function parseItems(englishText: string): BulkItem[] {
  const lines = englishText
    .split('\n')
    .map(l => l.trim())
    // drop lines that are purely numbers, headers, or too short
    .filter(l => l.length > 1 && !/^(s\.?no|sl\.?\s*no|no\.|#|item|qty|quantity|total|amount|sr\.?\s*no)\.?\s*$/i.test(l));

  const items: BulkItem[] = [];

  for (const line of lines) {
    // Skip lines that look like headings or totals
    if (/^(total|sub\s*total|grand\s*total|tax|gst|bill|invoice|date|name|phone|address)/i.test(line)) continue;

    // Try to extract a quantity with unit from the line
    const unitMatch = UNIT_RE.exec(line);
    let name = line;
    let quantity = '';

    if (unitMatch) {
      quantity = `${unitMatch[1].trim()} ${unitMatch[2].trim()}`;
      name = line.replace(unitMatch[0], '').replace(/[\s\-–:,]+$/, '').replace(/^[\s\-–:,]+/, '').trim();
    } else {
      // Trailing fraction or number: "Rice 1/2", "Onion - 3/4", "Dal 2"
      const trailingNum = line.match(/^(.+?)[\s\-–:]+(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)$/);
      if (trailingNum) {
        name     = trailingNum[1].trim();
        quantity = trailingNum[2].replace(/\s+/g, '');  // normalise "1 / 2" → "1/2"
      } else {
        name     = line;
        quantity = '';
      }
    }

    // Final cleanup: strip leading list markers (1. 2. * - •)
    name = name.replace(/^[\d]+[.)]\s*/, '').replace(/^[\*\-–•]\s*/, '').trim();

    if (name.length > 0) {
      items.push({ name, quantity });
    }
  }

  return items;
}

// ── Google Gemini OCR ─────────────────────────────────────────────────────────

async function googleOCR(base64: string, mediaType: string): Promise<string> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY not set');

  const body = JSON.stringify({ contents: [{ parts: [
    { inline_data: { mime_type: mediaType, data: base64 } },
    { text: OCR_PROMPT },
  ]}]});

  for (const model of ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash', 'gemini-2.0-flash']) {
    for (const version of ['v1', 'v1beta']) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (res.status === 429) { await sleep(3000); continue; }
        if (!res.ok) continue;
        const text = ((await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        if (text) { console.log('[bulk-ocr] raw:', text.slice(0, 400)); return text; }
      } catch { continue; }
    }
  }
  throw new Error('Google OCR unavailable');
}

// ── IndicTrans2 translation ───────────────────────────────────────────────────

async function indicTranslate(rawText: string): Promise<string> {
  const res = await fetch(`${INDICTRANS_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`IndicTrans2 ${res.status}`);
  const { translated } = await res.json();
  return translated;
}

// ── Route ─────────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const base64    = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mediaType = file.type || 'image/jpeg';

    console.log('[bulk-scan] stage-1 Google OCR…');
    const rawText = await googleOCR(base64, mediaType);

    console.log('[bulk-scan] stage-2 IndicTrans2…');
    const english = await indicTranslate(rawText);
    console.log('[bulk-scan] translated:', english.slice(0, 300));

    console.log('[bulk-scan] stage-3 parsing items…');
    const items = parseItems(english);
    console.log(`[bulk-scan] found ${items.length} items`);

    return NextResponse.json({ success: true, items, rawText, engine: 'google+indictrans2' });

  } catch (err: any) {
    console.error('[smart-bulk-scan]', err);
    return NextResponse.json({ success: false, message: err.message || 'Scan failed.' }, { status: 500 });
  }
}
