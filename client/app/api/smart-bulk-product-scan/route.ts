import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_OCR_LIST_PROMPT,
  googleOCR,
  indicTranslate,
  parseItems,
  guessCategory,
  tryClaudeTextEnrich,
  getProductImage,
  imageResultToUrl,
  DISCLAIMER,
} from '../_lib/productScan';

export const runtime = 'nodejs';

// ── Bulk product scan ────────────────────────────────────────────────────────
// Reuses the exact same OCR+translate+line-parsing pipeline as
// `smart-bulk-scan` (list of item names) and then runs each detected name
// through the SAME per-item AI-recognition + image-generation pipeline
// `smart-product-upload` uses for a single scanned product — just without a
// per-item sub-image to feed vision, so category/description/brand come
// from a lightweight text-only Claude call (falling back to the same
// keyword-based `guessCategory` used elsewhere) instead of Gemini/Claude
// vision. Each item is processed independently: one failure never aborts
// the batch — it's collected into `failed` and the rest continue.
const MAX_ITEMS = 25;

async function enrichOneItem(name: string) {
  let category = 'General';
  let description = '';
  let brand = '';
  try {
    const enriched = await tryClaudeTextEnrich(name);
    category = enriched.category || guessCategory(name);
    description = enriched.description || '';
    brand = enriched.brand || '';
  } catch (err: any) {
    // Claude unavailable/quota — fall back to the same keyword guesser
    // `smart-product-upload` uses for its own local-regex fallback path.
    console.warn(`[bulk-product-scan] text-enrich failed for "${name}":`, err.message);
    category = guessCategory(name);
  }

  const { result: imgResult, aiGenerated } = await getProductImage(name, category);

  return {
    productName: name,
    category,
    price: 0,
    discountedPrice: 0,
    description,
    brand,
    imageUrl: imageResultToUrl(imgResult),
    aiGenerated,
    disclaimer: DISCLAIMER,
  };
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mediaType = file.type || 'image/jpeg';

    console.log('[bulk-product-scan] stage-1 Google OCR…');
    const rawText = await googleOCR(base64, mediaType, GOOGLE_OCR_LIST_PROMPT);

    console.log('[bulk-product-scan] stage-2 IndicTrans2…');
    const english = await indicTranslate(rawText);

    console.log('[bulk-product-scan] stage-3 parsing items…');
    const items = parseItems(english).slice(0, MAX_ITEMS);
    if (items.length === 0) {
      return NextResponse.json({ success: false, message: 'No product names were found in that image.' }, { status: 400 });
    }

    console.log(`[bulk-product-scan] enriching ${items.length} item(s)…`);
    const products: any[] = [];
    const failed: { name: string; reason: string }[] = [];

    for (const item of items) {
      try {
        products.push(await enrichOneItem(item.name));
      } catch (err: any) {
        console.warn(`[bulk-product-scan] failed for "${item.name}":`, err.message);
        failed.push({ name: item.name, reason: err.message || 'Could not process this item.' });
      }
    }

    return NextResponse.json({ success: true, products, failed, engine: 'google+indictrans2' });

  } catch (err: any) {
    console.error('[smart-bulk-product-scan]', err);
    return NextResponse.json({ success: false, message: err.message || 'Scan failed.' }, { status: 500 });
  }
}
