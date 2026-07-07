import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const INDICTRANS_URL  = (process.env.INDICTRANS_URL  || 'http://localhost:8400').replace(/\/$/, '');
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt';

// ── Price helpers ─────────────────────────────────────────────────────────────

function extractPrices(text: string): number[] {
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  const labeled = /(?:₹|Rs\.?\s*|MRP\s*[:\-]?\s*|(?:Discount\s+|Offer\s+)?Price\s*[:\-]?\s*|Offer\s*[:\-]?\s*|Sale\s*[:\-]?\s*)(\d[\d,]*(?:\.\d{1,2})?)\s*(?:Rs\.?|₹)?/gi;
  while ((m = labeled.exec(text)) !== null) prices.push(parseFloat(m[1].replace(/,/g, '')));
  const numRs = /\b(\d[\d,]*(?:\.\d{1,2})?)\s*Rs\.?(?!\d)/gi;
  while ((m = numRs.exec(text)) !== null) prices.push(parseFloat(m[1].replace(/,/g, '')));
  const slash = /\b(\d[\d,]+)\s*\/\s*-/g;
  while ((m = slash.exec(text)) !== null) prices.push(parseFloat(m[1].replace(/,/g, '')));
  if (prices.length === 0) {
    const nums = /\b(\d{2,5}(?:\.\d{1,2})?)\b/g;
    while ((m = nums.exec(text)) !== null) {
      const n = parseFloat(m[1]);
      if (n >= 1 && n <= 99999) prices.push(n);
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

function extractDate(text: string): string | null {
  const pats = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/,
  ];
  for (const re of pats) {
    const m = text.match(re);
    if (!m) continue;
    if (parseInt(m[1]) > 31) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`;
    const y = m[3].length === 2 ? '20' + m[3] : m[3];
    return `${y}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;
  }
  return null;
}

function guessCategory(text: string): string {
  const t = text.toLowerCase();
  const map: [string, string[]][] = [
    ['Dairy',            ['milk','curd','butter','ghee','paneer','cheese']],
    ['Beverages',        ['tea','coffee','juice','drink','water','chai']],
    ['Snacks',           ['chips','biscuit','cookie','namkeen','snack','wafer']],
    ['Groceries',        ['rice','wheat','flour','dal','oil','sugar','salt','atta','maida','masala','spice','grocery']],
    ['Beauty & Skincare',['cream','lotion','soap','shampoo','face wash','moisturizer','serum']],
    ['Household',        ['detergent','washing','cleaner','floor','dish']],
    ['Electronics',      ['phone','mobile','battery','charger','cable','earphone','bulb','led']],
    ['Clothing',         ['shirt','pant','saree','kurta','dress','cloth','fabric']],
    ['Vegetables',       ['vegetable','onion','potato','tomato','carrot','beans','greens']],
    ['Fruits',           ['fruit','apple','mango','banana','orange','grape','watermelon']],
  ];
  for (const [cat, kws] of map) if (kws.some(kw => t.includes(kw))) return cat;
  return 'General';
}

// ── Offer-specific English text parser ────────────────────────────────────────

function parseOfferText(text: string): {
  title: string; category: string; description: string;
  originalPrice: number; offerPrice: number; validUntil: string | null;
} {
  const lines   = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const full    = lines.join(' ');
  const textLines = lines.filter(l => !/^[\d\s₹.,\-\/]+$/.test(l));

  // Named price extraction: MRP/original vs discount/offer price
  let originalPrice = 0, offerPrice = 0;
  for (const line of lines) {
    const nums = extractPrices(line);
    if (!nums.length) continue;
    const lo = line.toLowerCase();
    if (/discount|offer\s*price|sale\s*price/i.test(lo)) {
      offerPrice = Math.max(offerPrice, ...nums);
    } else if (/\bmrp\b|original\s*price|price\s*[-:]/i.test(lo)) {
      originalPrice = Math.max(originalPrice, ...nums);
    }
  }
  // fallback
  if (!originalPrice && !offerPrice) {
    const all = extractPrices(full);
    originalPrice = all.length ? Math.max(...all) : 0;
    offerPrice    = all.length > 1 ? Math.min(...all) : originalPrice;
  } else if (!offerPrice) {
    offerPrice = originalPrice;
  } else if (!originalPrice) {
    originalPrice = offerPrice;
  }

  // Title: first text line, cleaned of weight units
  const nameLine = textLines[0] || lines[0] || 'Special Offer';
  const title = nameLine.replace(/\s*[-–]\s*\d[\d.,]*\s*(?:kg|g|ml|l|gm|ltr|pcs|pc)\s*$/i, '').trim();

  // validUntil: date → datetime-local string
  const dateStr   = extractDate(full);
  const validUntil = dateStr ? `${dateStr}T23:59` : null;

  return {
    title,
    category:  guessCategory(full),
    description: textLines.slice(0, 4).join('. '),
    originalPrice,
    offerPrice,
    validUntil,
  };
}

// ── OCR + Translation ─────────────────────────────────────────────────────────

const GOOGLE_OCR_PROMPT = `You are an OCR engine. Read every piece of text visible in this offer paper or product label exactly as printed.
Output only the raw text — preserve the original language and script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Marathi, Odia, or English).
List the text line by line from top to bottom. Do NOT translate. Do NOT describe the image.`;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function googleOCR(base64: string, mediaType: string): Promise<string> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error('GOOGLE_AI_API_KEY not set');

  const body = JSON.stringify({ contents: [{ parts: [
    { inline_data: { mime_type: mediaType, data: base64 } },
    { text: GOOGLE_OCR_PROMPT },
  ]}]});

  for (const model of ['gemini-2.5-flash-preview-05-20', 'gemini-2.5-flash', 'gemini-2.0-flash']) {
    for (const version of ['v1', 'v1beta']) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
      try {
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
        if (res.status === 429) { await sleep(3000); continue; }
        if (!res.ok) continue;
        const text = ((await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
        if (text) { console.log('[offer-ocr] raw:', text.slice(0, 300)); return text; }
      } catch { continue; }
    }
  }
  throw new Error('Google OCR unavailable');
}

async function indicTranslate(rawText: string): Promise<{ translated: string; src_lang: string }> {
  const res = await fetch(`${INDICTRANS_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`IndicTrans2 ${res.status}`);
  return res.json();
}

// ── Claude fallback ───────────────────────────────────────────────────────────

const CLAUDE_OFFER_PROMPT = `This is an offer paper or product label. Extract the offer details and translate ALL text to English.
Reply ONLY with a raw JSON object — no markdown, no code fences:
{"title":"<offer or product name in English>","category":"<one of: Groceries, Dairy, Beverages, Snacks, Beauty & Skincare, Household, Electronics, Clothing, Vegetables, Fruits, General>","description":"<2-3 sentence description>","originalPrice":<MRP as number, 0 if not found>,"offerPrice":<discounted price as number, same as originalPrice if not found>,"validUntil":"<YYYY-MM-DDT23:59 or null>"}`;

async function claudeFallback(base64: string, mediaType: string) {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 512,
    messages: [{ role: 'user', content: [
      { type: 'image', source: { type: 'base64', media_type: mediaType as any, data: base64 } },
      { type: 'text', text: CLAUDE_OFFER_PROMPT },
    ]}],
  });
  const raw = res.content[0].type === 'text' ? res.content[0].text.trim() : '';
  return JSON.parse(raw.replace(/^```json?\s*/i,'').replace(/\s*```$/i,'').trim());
}

// ── Image generation ──────────────────────────────────────────────────────────

async function generateOfferImage(title: string, category: string): Promise<string | null> {
  try {
    const prompt = encodeURIComponent(
      `Professional e-commerce offer banner for ${title}${category ? `, ${category}` : ''}, vibrant colors, sale sticker, white background, studio quality, no text`
    );
    const url = `${POLLINATIONS_URL}/${prompt}?width=512&height=512&model=flux&nologo=true&seed=${Date.now()}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) return null;
    const b64 = Buffer.from(await res.arrayBuffer()).toString('base64');
    const mime = res.headers.get('content-type') || 'image/jpeg';
    return `data:${mime};base64,${b64}`;
  } catch {
    return null;
  }
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const base64    = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mediaType = file.type || 'image/jpeg';

    let extracted: ReturnType<typeof parseOfferText>;
    let engine = 'google+indictrans2';

    try {
      console.log('[offer-scan] stage-1 Google OCR…');
      const rawText = await googleOCR(base64, mediaType);

      console.log('[offer-scan] stage-2 IndicTrans2…');
      const { translated, src_lang } = await indicTranslate(rawText);
      console.log(`[offer-scan] translated (${src_lang}):`, translated.slice(0, 200));

      console.log('[offer-scan] stage-3 parsing…');
      extracted = parseOfferText(translated);
    } catch (e1: any) {
      console.warn('[offer-scan] primary failed:', e1.message, '— trying Claude…');
      try {
        const raw = await claudeFallback(base64, mediaType);
        extracted = {
          title:         raw.title         || 'Special Offer',
          category:      raw.category      || 'General',
          description:   raw.description   || '',
          originalPrice: Number(raw.originalPrice) || 0,
          offerPrice:    Number(raw.offerPrice)     || 0,
          validUntil:    raw.validUntil    || null,
        };
        engine = 'claude';
      } catch (e2: any) {
        return NextResponse.json({ success: false, message: e2.message }, { status: 500 });
      }
    }

    console.log('[offer-scan] parsed:', JSON.stringify(extracted).slice(0, 200));

    // Default validUntil to 7 days from now if not found
    const validUntil = extracted.validUntil
      || new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString().slice(0, 16);

    // Generate offer image
    const imageUrl = await generateOfferImage(extracted.title, extracted.category);

    return NextResponse.json({
      success: true,
      engine,
      extracted: {
        title:         extracted.title,
        category:      extracted.category,
        description:   extracted.description,
        originalPrice: extracted.originalPrice,
        offerPrice:    extracted.offerPrice,
        validUntil,
        imageUrl,
      },
    });

  } catch (err: any) {
    console.error('[smart-offer-scan]', err);
    return NextResponse.json({ success: false, message: err.message || 'Scan failed.' }, { status: 500 });
  }
}
