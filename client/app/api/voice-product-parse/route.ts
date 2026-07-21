import { NextRequest, NextResponse } from "next/server";
import {
  DISCLAIMER,
  extractVoiceProductDetails,
  getProductImage,
  imageResultToUrl,
  indicTranslate,
} from "../_lib/productScan";

export const runtime = "nodejs";

// ── Route handler ─────────────────────────────────────────────────────────────
// Store Owner "speak product details" flow. Text-only sibling of
// `smart-product-upload` — same extraction shape, same `getProductImage()`
// image pipeline — just fed by a speech transcript (from the browser's Web
// Speech API, see `client/app/hooks/useSpeechRecognition.ts`) instead of a
// photographed label. Non-English transcripts are translated via the same
// `indicTranslate()` IndicTrans2 pipeline every OCR route already uses.

export async function POST(req: NextRequest) {
  try {
    const { text, sourceLang } = await req.json();
    if (!text || !String(text).trim()) {
      return NextResponse.json(
        { success: false, message: "No speech text provided." },
        { status: 400 },
      );
    }

    const english =
      sourceLang && sourceLang !== "en"
        ? await indicTranslate(String(text))
        : String(text);
    const { extracted, engine } = await extractVoiceProductDetails(english);

    const { result: imgResult, aiGenerated } = await getProductImage(
      extracted.productName || "",
      extracted.category || "",
    );

    // NEWLY ADDED
    const imageUrl = imageResultToUrl(imgResult);
    return NextResponse.json({
      success: true,
      engine,
      extracted: {
        productName: extracted.productName || "",
        category: extracted.category || "General",
        price: Number(extracted.price) || 0,
        discountedPrice:
          Number(extracted.discountedPrice) || Number(extracted.price) || 0,
        totalStock: Number(extracted.totalStock) || 0,
        description: extracted.description || "",
        brand: extracted.brand || "",
        // imageUrl: imageResultToUrl(imgResult),
        imageUrl: imageUrl.startsWith("/uploads")
          ? `${process.env.NEXT_PUBLIC_API_URL}${imageUrl}`
          : imageUrl,
        aiGenerated,
        disclaimer: DISCLAIMER,
      },
    });
  } catch (err: any) {
    console.error("[voice-product-parse]", err);
    return NextResponse.json(
      { success: false, message: err.message || "Could not understand that." },
      { status: 500 },
    );
  }
}
