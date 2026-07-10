import { NextRequest, NextResponse } from 'next/server';
import { GOOGLE_OCR_LIST_PROMPT, googleOCR, indicTranslate, parseItems } from '../_lib/productScan';

export const runtime = 'nodejs';

// ── Route ─────────────────────────────────────────────────────────────────────
// OCR/translation/parsing logic lives in `../_lib/productScan` (shared with
// `smart-product-upload` and `smart-bulk-product-scan`) — this route is now
// just the HTTP glue.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');
    const mediaType = file.type || 'image/jpeg';

    console.log('[bulk-scan] stage-1 Google OCR…');
    const rawText = await googleOCR(base64, mediaType, GOOGLE_OCR_LIST_PROMPT);

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
