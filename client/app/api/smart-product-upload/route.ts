import { NextRequest, NextResponse } from 'next/server';
import path from 'path';

export const runtime = 'nodejs';

const GATEWAY                = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
const INDICTRANS_URL = (process.env.INDICTRANS_URL || 'http://localhost:8400').replace(/\/$/, '');
// No self-hosted model needed — Pollinations.ai is free, no API key, runs FLUX
const POLLINATIONS_URL = 'https://image.pollinations.ai/prompt';

const DISCLAIMER =
  'Note: Product image is for representation purposes only. Actual product may appear slightly different from what you see.';


// Used by Gemini and Claude (they handle vision + translation in one shot)
const VISION_PROMPT = `This image contains product details. Extract and translate ALL text into English.
Reply ONLY with a raw JSON object — no markdown, no code fences:
{"productName":"<product name>","category":"<one of: Groceries, Dairy, Beverages, Snacks, Beauty & Skincare, Household, Electronics, Clothing, Vegetables, Fruits, Medicine, Stationery, General>","price":<MRP as number>,"discountedPrice":<sale price as number, same as price if not shown>,"validTill":"<YYYY-MM-DD or null>","description":"<2-3 sentence description in English>","brand":"<brand name or empty string>","imageKeyword":"<2-3 word English keyword>"}`;


// ── OCR helpers (last-resort fallback) ───────────────────────────────────────

function extractPrices(text: string): number[] {
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  // "Price - 40Rs", "MRP: 45", "₹40", "Rs 40", "40Rs", "40/-"
  const labeled = /(?:₹|Rs\.?\s*|MRP\s*[:\-]?\s*|(?:Discount\s+)?Price\s*[:\-]?\s*|Offer\s*[:\-]?\s*|Sale\s*[:\-]?\s*)(\d[\d,]*(?:\.\d{1,2})?)\s*(?:Rs\.?|₹)?/gi;
  while ((m = labeled.exec(text)) !== null) prices.push(parseFloat(m[1].replace(/,/g, '')));
  // "40Rs" — number immediately followed by Rs
  const numRs = /\b(\d[\d,]*(?:\.\d{1,2})?)\s*Rs\.?(?!\d)/gi;
  while ((m = numRs.exec(text)) !== null) prices.push(parseFloat(m[1].replace(/,/g, '')));
  // "40/-"
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
  const pats = [/\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/, /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/, /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/];
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
    ['Dairy',            ['milk','curd','butter','ghee','paneer','cheese','दूध','दही','मक्खन','घी']],
    ['Beverages',        ['tea','coffee','juice','drink','water','chai','चाय','कॉफी']],
    ['Snacks',           ['chips','biscuit','cookie','namkeen','snack','wafer','नमकीन','बिस्कुट']],
    ['Groceries',        ['rice','wheat','flour','dal','oil','sugar','salt','atta','maida','masala','spice','चावल','गेहूं','आटा','दाल','तेल','चीनी','नमक']],
    ['Beauty & Skincare',['cream','lotion','soap','shampoo','face wash','moisturizer','serum','साबुन','क्रीम']],
    ['Household',        ['detergent','washing','cleaner','floor','dish','झाड़ू','डिटर्जेंट']],
    ['Electronics',      ['phone','mobile','battery','charger','cable','earphone','bulb','led']],
    ['Clothing',         ['shirt','pant','saree','kurta','dress','cloth','fabric','साड़ी','कुर्ता']],
    ['Vegetables',       ['vegetable','onion','potato','tomato','sabzi','सब्जी','आलू','प्याज','टमाटर']],
    ['Fruits',           ['fruit','apple','mango','banana','orange','फल','आम','सेब','केला']],
  ];
  for (const [cat, kws] of map) if (kws.some(kw => t.includes(kw))) return cat;
  return 'General';
}
function parseEnglishText(text: string): any {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 1);
  const full  = lines.join(' ');

  // Extract named prices: look for lines containing "discount", "offer", "sale" for discounted price
  let mrp = 0, discounted = 0;
  for (const line of lines) {
    const nums = extractPrices(line);
    if (!nums.length) continue;
    const lo = line.toLowerCase();
    if (/discount|offer|sale/i.test(lo)) {
      discounted = Math.max(discounted, ...nums);
    } else if (/\bmrp\b|price/i.test(lo)) {
      mrp = Math.max(mrp, ...nums);
    }
  }
  // fallback: derive from all prices in text
  if (!mrp && !discounted) {
    const all = extractPrices(full);
    mrp = all.length ? Math.max(...all) : 0;
    discounted = all.length > 1 ? Math.min(...all) : mrp;
  } else if (!discounted) {
    discounted = mrp;
  } else if (!mrp) {
    mrp = discounted;
  }

  // First non-numeric text line = product name; strip weight suffixes like "- 1kg"
  const nameLine = lines.find(l => l.length >= 3 && !/^[\d\s₹.,\-\/]+$/.test(l)) || 'Product';
  const productName = nameLine.replace(/\s*[-–]\s*\d[\d.,]*\s*(?:kg|g|ml|l|gm|gms|ltr|pcs|pc)\s*$/i, '').trim();

  const textLines = lines.filter(l => !/^[\d\s₹.,\-\/]+$/.test(l));
  return {
    productName,
    price: mrp,
    discountedPrice: discounted,
    validTill: extractDate(full),
    category: guessCategory(full),
    description: textLines.slice(0, 4).join('. '),
    brand: '',
    imageKeyword: productName.split(/\s+/).slice(0, 3).join(' '),
  };
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

// ── Text extraction engines ───────────────────────────────────────────────────



const GOOGLE_OCR_PROMPT = `You are an OCR engine. Read every piece of text visible in this product image exactly as printed.
Output only the raw text — preserve the original language and script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Marathi, Odia, or English).
List the text line by line from top to bottom as it appears on the product. Do NOT translate. Do NOT describe the image.`;

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
        if (text) {
          console.log('[google-ocr] raw text:', text.slice(0, 300));
          return text;
        }
      } catch { continue; }
    }
  }
  throw new Error('Google OCR unavailable');
}

async function tryGoogleOCRWithIndicTrans2(base64: string, mediaType: string): Promise<any> {
  // Stage 1: Google (Gemini) — precise multilingual OCR, raw text only
  console.log('[pipeline] stage-1 Google OCR…');
  const rawText = await googleOCR(base64, mediaType);

  // Stage 2: IndicTrans2 service — Indian language → English
  console.log('[pipeline] stage-2 IndicTrans2 translation…');
  const itRes = await fetch(`${INDICTRANS_URL}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: rawText }),
    signal: AbortSignal.timeout(60000),
  });
  if (!itRes.ok) throw new Error(`IndicTrans2 ${itRes.status}`);
  const { translated, src_lang, skipped } = await itRes.json();
  console.log(`[pipeline] IndicTrans2 (${src_lang}, skipped=${skipped}):`, translated.slice(0, 200));

  // Stage 3: local regex parser — no LLM needed for English text
  console.log('[pipeline] stage-3 English text parsing…');
  const parsed = parseEnglishText(translated);
  console.log('[pipeline] parsed:', JSON.stringify(parsed).slice(0, 200));
  return parsed;
}


async function tryClaude(base64: string, mediaType: string): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error('ANTHROPIC_API_KEY not set');
  const { default: Anthropic } = await import('@anthropic-ai/sdk');
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: 'claude-haiku-4-5-20251001', max_tokens: 1024,
    messages: [{ role:'user', content:[
      { type:'image', source:{ type:'base64', media_type: mediaType as any, data: base64 } },
      { type:'text', text: VISION_PROMPT },
    ]}],
  });
  const raw = res.content[0].type === 'text' ? res.content[0].text.trim() : '';
  return JSON.parse(raw.replace(/^```json?\s*/i,'').replace(/\s*```$/i,'').trim());
}


async function extractDetails(base64: string, mediaType: string, buffer: Buffer) {
  // IndicTrans2 is primary; Claude is fallback
  const engines = [
    { name: 'google+indictrans2', fn: () => tryGoogleOCRWithIndicTrans2(base64, mediaType) },
    { name: 'claude',             fn: () => tryClaude(base64, mediaType) },
  ];
  for (const e of engines) {
    try { return { extracted: await e.fn(), engine: e.name }; }
    catch (err: any) { console.warn(`[extract] ${e.name} failed:`, err.message); }
  }
  throw new Error('All extraction engines failed.');
}

// ── Image generation ──────────────────────────────────────────────────────────

type ImageResult = { base64: string; mimeType: string } | { url: string };

async function generateWithFluxSchnell(productName: string, category: string): Promise<ImageResult | null> {
  const prompt = encodeURIComponent(
    `Professional e-commerce product photo of ${productName}${category ? `, ${category}` : ''}, plain white background, studio lighting, high quality, photorealistic, no text, no watermark`
  );
  const url = `${POLLINATIONS_URL}/${prompt}?width=512&height=512&model=flux&nologo=true&seed=${Date.now()}`;
  console.log('[image] calling Pollinations.ai FLUX…');
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });
    if (!res.ok) {
      console.warn(`[image] Pollinations ${res.status}`);
      return null;
    }
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    const mimeType = res.headers.get('content-type') || 'image/jpeg';
    console.log('[image] Pollinations FLUX generated successfully');
    return { base64, mimeType };
  } catch (err: any) {
    console.warn('[image] Pollinations error:', err.message);
    return null;
  }
}

// ── PNG product card (SVG → sharp → PNG) ─────────────────────────────────────

const CAT_STYLE: Record<string, { bg: string; accent: string; light: string; symbol: string }> = {
  'Groceries':        { bg:'#FFF7ED', accent:'#EA580C', light:'#FED7AA', symbol:'GR' },
  'Dairy':            { bg:'#F0FDF4', accent:'#16A34A', light:'#BBF7D0', symbol:'DA' },
  'Beverages':        { bg:'#EFF6FF', accent:'#2563EB', light:'#BFDBFE', symbol:'BV' },
  'Snacks':           { bg:'#FFFBEB', accent:'#D97706', light:'#FDE68A', symbol:'SN' },
  'Beauty & Skincare':{ bg:'#FDF4FF', accent:'#9333EA', light:'#E9D5FF', symbol:'BS' },
  'Household':        { bg:'#F0F9FF', accent:'#0284C7', light:'#BAE6FD', symbol:'HH' },
  'Electronics':      { bg:'#F8FAFC', accent:'#475569', light:'#CBD5E1', symbol:'EL' },
  'Clothing':         { bg:'#FFF1F2', accent:'#E11D48', light:'#FECDD3', symbol:'CL' },
  'Vegetables':       { bg:'#F0FDF4', accent:'#16A34A', light:'#BBF7D0', symbol:'VG' },
  'Fruits':           { bg:'#FFF7ED', accent:'#EA580C', light:'#FED7AA', symbol:'FR' },
  'Medicine':         { bg:'#F0FDF4', accent:'#15803D', light:'#A7F3D0', symbol:'MD' },
  'Stationery':       { bg:'#FEFCE8', accent:'#CA8A04', light:'#FEF08A', symbol:'ST' },
};
const DEFAULT_STYLE = { bg:'#F8FAFC', accent:'#334155', light:'#CBD5E1', symbol:'PR' };

function escapeXml(s: string) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function wrapWords(text: string, maxLen: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    const c = line ? `${line} ${w}` : w;
    if (c.length > maxLen) { if (line) lines.push(line); line = w; } else line = c;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

async function buildProductCard(productName: string, category: string): Promise<ImageResult> {
  const s     = CAT_STYLE[category] || DEFAULT_STYLE;
  const lines = wrapWords(productName.toUpperCase(), 14);
  const fs    = lines.some(l => l.length > 11) ? 26 : 32;
  const midY  = 240 - (lines.length - 1) * (fs * 0.65);

  const textRows = lines.map((l, i) =>
    `<text x="200" y="${Math.round(midY + i * fs * 1.3)}"
      text-anchor="middle" font-family="Arial,sans-serif"
      font-size="${fs}" font-weight="bold" fill="${s.accent}">${escapeXml(l)}</text>`
  ).join('\n');

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
  <rect width="400" height="400" fill="${s.bg}"/>
  <rect x="0" y="0" width="400" height="8" fill="${s.accent}"/>
  <rect x="0" y="392" width="400" height="8" fill="${s.accent}" opacity="0.5"/>
  <rect x="120" y="20" width="160" height="26" rx="13" fill="${s.light}"/>
  <text x="200" y="38" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="11" font-weight="700"
    fill="${s.accent}">${escapeXml((category||'Product').toUpperCase())}</text>
  <circle cx="200" cy="140" r="52" fill="${s.light}"/>
  <circle cx="200" cy="140" r="44" fill="white" opacity="0.5"/>
  <text x="200" y="152" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="36" font-weight="bold"
    fill="${s.accent}">${escapeXml(s.symbol)}</text>
  ${textRows}
  <text x="200" y="375" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="9" fill="${s.accent}" opacity="0.4">Representation image only</text>
</svg>`;

  try {
    const { default: sharp } = await import('sharp');
    const png = await sharp(Buffer.from(svg)).resize(400, 400).png({ compressionLevel: 6 }).toBuffer();
    console.log('[image] product card generated as PNG');
    return { base64: png.toString('base64'), mimeType: 'image/png' };
  } catch (e: any) {
    console.warn('[image] sharp PNG conversion failed, using SVG:', e.message);
    return { base64: Buffer.from(svg).toString('base64'), mimeType: 'image/svg+xml' };
  }
}

// ── Shared image library check ────────────────────────────────────────────────

async function checkSharedLibrary(productName: string): Promise<ImageResult | null> {
  try {
    const res = await fetch(`${GATEWAY}/api/product-images?name=${encodeURIComponent(productName)}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.imageUrl) {
        console.log(`[image] reused from shared library for "${productName}"`);
        return { url: data.imageUrl };
      }
    }
  } catch { /* not found */ }
  return null;
}

async function getProductImage(productName: string, category: string): Promise<{ result: ImageResult; aiGenerated: boolean }> {
  // 1. Shared library — reuse existing image uploaded by any store
  const shared = await checkSharedLibrary(productName);
  if (shared) return { result: shared, aiGenerated: false };

  // 2. FLUX.1 Schnell via Hugging Face
  const generated = await generateWithFluxSchnell(productName, category);
  if (generated) return { result: generated, aiGenerated: true };

  // 3. PNG product card — always works, zero external calls
  return { result: await buildProductCard(productName, category), aiGenerated: false };
}

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const bytes     = await file.arrayBuffer();
    const buffer    = Buffer.from(bytes);
    const base64    = buffer.toString('base64');
    const mediaType = file.type || 'image/jpeg';

    const { extracted, engine } = await extractDetails(base64, mediaType, buffer);

    const { result: imgResult, aiGenerated } = await getProductImage(
      extracted.productName || '', extracted.category || ''
    );

    const imageUrl = 'base64' in imgResult
      ? `data:${imgResult.mimeType};base64,${imgResult.base64}`
      : imgResult.url;

    return NextResponse.json({
      success: true,
      engine,
      extracted: {
        productName:    extracted.productName    || '',
        category:       extracted.category       || 'General',
        price:          Number(extracted.price)  || 0,
        discountedPrice:Number(extracted.discountedPrice) || Number(extracted.price) || 0,
        validTill:      extracted.validTill      || '',
        description:    extracted.description    || '',
        brand:          extracted.brand          || '',
        imageKeyword:   extracted.imageKeyword   || extracted.productName || '',
        imageUrl,
        aiGenerated,
        disclaimer:     DISCLAIMER,
      },
    });

  } catch (err: any) {
    console.error('[smart-product-upload]', err);
    return NextResponse.json({ success: false, message: err.message || 'Extraction failed.' }, { status: 500 });
  }
}
