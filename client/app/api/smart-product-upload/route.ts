import { NextRequest, NextResponse } from 'next/server';
import { DISCLAIMER, extractDetails, getProductImage, imageResultToUrl } from '../_lib/productScan';

export const runtime = 'nodejs';

// ── Route handler ─────────────────────────────────────────────────────────────
// OCR/AI-extraction and image-generation logic lives in `../_lib/productScan`
// (shared with `smart-bulk-scan` and `smart-bulk-product-scan`) — this route
// is now just the HTTP glue.

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('image') as File | null;
    if (!file) return NextResponse.json({ success: false, message: 'No image provided.' }, { status: 400 });

    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString('base64');
    const mediaType = file.type || 'image/jpeg';

    const { extracted, engine } = await extractDetails(base64, mediaType);

    const { result: imgResult, aiGenerated } = await getProductImage(
      extracted.productName || '', extracted.category || '',
    );

    return NextResponse.json({
      success: true,
      engine,
      extracted: {
        productName: extracted.productName || '',
        category: extracted.category || 'General',
        price: Number(extracted.price) || 0,
        discountedPrice: Number(extracted.discountedPrice) || Number(extracted.price) || 0,
        validTill: extracted.validTill || '',
        description: extracted.description || '',
        brand: extracted.brand || '',
        imageKeyword: extracted.imageKeyword || extracted.productName || '',
        imageUrl: imageResultToUrl(imgResult),
        aiGenerated,
        disclaimer: DISCLAIMER,
      },
    });

  } catch (err: any) {
    console.error('[smart-product-upload]', err);
    return NextResponse.json({ success: false, message: err.message || 'Extraction failed.' }, { status: 500 });
  }
}
