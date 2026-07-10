import { NextRequest, NextResponse } from 'next/server';
import { extractVoiceListItems, indicTranslate } from '../_lib/productScan';

export const runtime = 'nodejs';

// ── Route handler ─────────────────────────────────────────────────────────────
// Customer "speak your shopping list" flow. Text-only sibling of
// `smart-bulk-scan` — same {name, quantity}[] output shape the Bulk
// Purchase page's `addFromScan()` already consumes — just fed by a speech
// transcript instead of a photographed list. Non-English transcripts are
// translated via the same `indicTranslate()` pipeline every OCR route uses.

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang } = await req.json();
    if (!text || !String(text).trim()) {
      return NextResponse.json({ success: false, message: 'No speech text provided.' }, { status: 400 });
    }

    const english = sourceLang && sourceLang !== 'en' ? await indicTranslate(String(text)) : String(text);
    const { extracted: items, engine } = await extractVoiceListItems(english);

    if (items.length === 0) {
      return NextResponse.json({ success: false, message: "Couldn't make out any items in that — try again." }, { status: 400 });
    }

    return NextResponse.json({ success: true, items, engine });

  } catch (err: any) {
    console.error('[voice-purchase-list]', err);
    return NextResponse.json({ success: false, message: err.message || 'Could not understand that.' }, { status: 500 });
  }
}
