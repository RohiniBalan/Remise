// Shared OCR / AI-recognition / image-generation helpers used by every
// product-scan Next.js route (`smart-product-upload`, `smart-bulk-scan`,
// `smart-bulk-product-scan`). Extracted from `smart-product-upload/route.ts`
// and `smart-bulk-scan/route.ts` verbatim (no behavior change) so the new
// bulk-product route can reuse the exact same OCR/translation/category-
// guessing/image-generation pipeline instead of duplicating it.

export const GATEWAY =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
export const INDICTRANS_URL = (
  process.env.INDICTRANS_URL || "http://localhost:8400"
).replace(/\/$/, "");
// No self-hosted model needed — Pollinations.ai is free, no API key, runs FLUX
export const POLLINATIONS_URL = "https://image.pollinations.ai/prompt";

export const DISCLAIMER =
  "Note: Product image is for representation purposes only. Actual product may appear slightly different from what you see.";

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ── Prompts ────────────────────────────────────────────────────────────────

// Single-product raw OCR (stage 1 of the Google+IndicTrans2 pipeline).
export const GOOGLE_OCR_PRODUCT_PROMPT = `You are an OCR engine. Read every piece of text visible in this product image exactly as printed.
Output only the raw text — preserve the original language and script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Marathi, Odia, or English).
List the text line by line from top to bottom as it appears on the product. Do NOT translate. Do NOT describe the image.`;

// Multi-item shopping/purchase-list raw OCR.
export const GOOGLE_OCR_LIST_PROMPT = `You are an OCR engine scanning a handwritten or printed shopping list / purchase order.
Read every line exactly as written. Preserve the original language and script (Tamil, Hindi, Telugu, Kannada, Malayalam, Bengali, Gujarati, Punjabi, Marathi, Odia, or English).
Output each line on its own line, top to bottom. Do NOT translate. Do NOT describe. Do NOT skip lines.`;

// Used by Gemini/Claude vision (single product; they handle vision + translation in one shot).
export const PRODUCT_VISION_PROMPT = `This image contains product details. Extract and translate ALL text into English.
Reply ONLY with a raw JSON object — no markdown, no code fences:
{"productName":"<product name>","category":"<one of: Groceries, Dairy, Beverages, Snacks, Beauty & Skincare, Household, Electronics, Clothing, Vegetables, Fruits, Medicine, Stationery, General>","price":<MRP as number>,"discountedPrice":<sale price as number, same as price if not shown>,"validTill":"<YYYY-MM-DD or null>","description":"<2-3 sentence description in English>","brand":"<brand name or empty string>","imageKeyword":"<2-3 word English keyword>"}`;

export const PRODUCT_CATEGORIES =
  "Groceries, Dairy, Beverages, Snacks, Beauty & Skincare, Household, Electronics, Clothing, Vegetables, Fruits, Medicine, Stationery, General";

// ── Text-parsing helpers (no LLM) ───────────────────────────────────────────

export function extractPrices(text: string): number[] {
  const prices: number[] = [];
  let m: RegExpExecArray | null;
  // "Price - 40Rs", "MRP: 45", "₹40", "Rs 40", "40Rs", "40/-"
  const labeled =
    /(?:₹|Rs\.?\s*|MRP\s*[:\-]?\s*|(?:Discount\s+)?Price\s*[:\-]?\s*|Offer\s*[:\-]?\s*|Sale\s*[:\-]?\s*)(\d[\d,]*(?:\.\d{1,2})?)\s*(?:Rs\.?|₹)?/gi;
  while ((m = labeled.exec(text)) !== null)
    prices.push(parseFloat(m[1].replace(/,/g, "")));
  // "40Rs" — number immediately followed by Rs
  const numRs = /\b(\d[\d,]*(?:\.\d{1,2})?)\s*Rs\.?(?!\d)/gi;
  while ((m = numRs.exec(text)) !== null)
    prices.push(parseFloat(m[1].replace(/,/g, "")));
  // "40/-"
  const slash = /\b(\d[\d,]+)\s*\/\s*-/g;
  while ((m = slash.exec(text)) !== null)
    prices.push(parseFloat(m[1].replace(/,/g, "")));
  if (prices.length === 0) {
    const nums = /\b(\d{2,5}(?:\.\d{1,2})?)\b/g;
    while ((m = nums.exec(text)) !== null) {
      const n = parseFloat(m[1]);
      if (n >= 1 && n <= 99999) prices.push(n);
    }
  }
  return [...new Set(prices)].sort((a, b) => a - b);
}

export function extractDate(text: string): string | null {
  const pats = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2})\b/,
  ];
  for (const re of pats) {
    const m = text.match(re);
    if (!m) continue;
    if (parseInt(m[1]) > 31)
      return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

export function guessCategory(text: string): string {
  const t = text.toLowerCase();
  const map: [string, string[]][] = [
    [
      "Dairy",
      [
        "milk",
        "curd",
        "butter",
        "ghee",
        "paneer",
        "cheese",
        "दूध",
        "दही",
        "मक्खन",
        "घी",
      ],
    ],
    [
      "Beverages",
      ["tea", "coffee", "juice", "drink", "water", "chai", "चाय", "कॉफी"],
    ],
    [
      "Snacks",
      [
        "chips",
        "biscuit",
        "cookie",
        "namkeen",
        "snack",
        "wafer",
        "नमकीन",
        "बिस्कुट",
      ],
    ],
    [
      "Groceries",
      [
        "rice",
        "wheat",
        "flour",
        "dal",
        "oil",
        "sugar",
        "salt",
        "atta",
        "maida",
        "masala",
        "spice",
        "चावल",
        "गेहूं",
        "आटा",
        "दाल",
        "तेल",
        "चीनी",
        "नमक",
      ],
    ],
    [
      "Beauty & Skincare",
      [
        "cream",
        "lotion",
        "soap",
        "shampoo",
        "face wash",
        "moisturizer",
        "serum",
        "साबुन",
        "क्रीम",
      ],
    ],
    [
      "Household",
      [
        "detergent",
        "washing",
        "cleaner",
        "floor",
        "dish",
        "झाड़ू",
        "डिटर्जेंट",
      ],
    ],
    [
      "Electronics",
      [
        "phone",
        "mobile",
        "battery",
        "charger",
        "cable",
        "earphone",
        "bulb",
        "led",
      ],
    ],
    [
      "Clothing",
      [
        "shirt",
        "pant",
        "saree",
        "kurta",
        "dress",
        "cloth",
        "fabric",
        "साड़ी",
        "कुर्ता",
      ],
    ],
    [
      "Vegetables",
      [
        "vegetable",
        "onion",
        "potato",
        "tomato",
        "sabzi",
        "सब्जी",
        "आलू",
        "प्याज",
        "टमाटर",
      ],
    ],
    [
      "Fruits",
      [
        "fruit",
        "apple",
        "mango",
        "banana",
        "orange",
        "फल",
        "आम",
        "सेब",
        "केला",
      ],
    ],
  ];
  for (const [cat, kws] of map)
    if (kws.some((kw) => t.includes(kw))) return cat;
  return "General";
}

export function parseEnglishText(text: string): any {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 1);
  const full = lines.join(" ");

  // Extract named prices: look for lines containing "discount", "offer", "sale" for discounted price
  let mrp = 0,
    discounted = 0;
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
  const nameLine =
    lines.find((l) => l.length >= 3 && !/^[\d\s₹.,\-\/]+$/.test(l)) ||
    "Product";
  const productName = nameLine
    .replace(/\s*[-–]\s*\d[\d.,]*\s*(?:kg|g|ml|l|gm|gms|ltr|pcs|pc)\s*$/i, "")
    .trim();

  const textLines = lines.filter((l) => !/^[\d\s₹.,\-\/]+$/.test(l));
  return {
    productName,
    price: mrp,
    discountedPrice: discounted,
    validTill: extractDate(full),
    category: guessCategory(full),
    description: textLines.slice(0, 4).join(". "),
    brand: "",
    imageKeyword: productName.split(/\s+/).slice(0, 3).join(" "),
  };
}

// ── Bulk list-item parser (name + quantity, no LLM) ─────────────────────────

// Matches: "2 kg", "1/2 kg", "1 1/2 kg", "0.5 kg", "half kg", "quarter kg"
const UNIT_WORDS =
  /kg|g|gm|gms|gram|grams|ml|l|ltr|litre|litres|liter|liters|lt|pcs|pc|piece|pieces|nos|no|packet|packets|pack|packs|box|boxes|dozen|doz|bundle|bundles|bag|bags|bottle|bottles|can|cans|unit|units|set|sets|pair|pairs|kilo|kilos/i;

// Capture: (number_part)(unit_part) — number can be a fraction or word
const UNIT_RE = new RegExp(
  `((?:(?:half|quarter|three[- ]quarter)\\s+)|(?:(?:\\d+\\s+)?\\d+\\/\\d+\\s+)|(?:\\d+(?:[.,]\\d+)?\\s*))(${UNIT_WORDS.source})\\.?\\b`,
  "i",
);

export interface BulkItem {
  name: string;
  quantity: string;
}

export function parseItems(englishText: string): BulkItem[] {
  const lines = englishText
    .split("\n")
    .map((l) => l.trim())
    // drop lines that are purely numbers, headers, or too short — including
    // the list's own title line (e.g. "Grocery List", "Shopping List:"),
    // which OCR reads back as a literal line but isn't itself a product.
    .filter(
      (l) =>
        l.length > 1 &&
        !/^(s\.?no|sl\.?\s*no|no\.|#|item|qty|quantity|total|amount|sr\.?\s*no)\.?\s*$/i.test(
          l,
        ) &&
        !/^(grocery|shopping|purchase|(?:to[\s-]?buy)|items?)\s*list\s*:?\s*$/i.test(
          l,
        ),
    );

  const items: BulkItem[] = [];

  for (const line of lines) {
    // Skip lines that look like headings or totals
    if (
      /^(total|sub\s*total|grand\s*total|tax|gst|bill|invoice|date|name|phone|address)/i.test(
        line,
      )
    )
      continue;

    // Try to extract a quantity with unit from the line
    const unitMatch = UNIT_RE.exec(line);
    let name = line;
    let quantity = "";

    if (unitMatch) {
      quantity = `${unitMatch[1].trim()} ${unitMatch[2].trim()}`;
      name = line
        .replace(unitMatch[0], "")
        .replace(/[\s\-–:,]+$/, "")
        .replace(/^[\s\-–:,]+/, "")
        .trim();
    } else {
      // Trailing fraction or number: "Rice 1/2", "Onion - 3/4", "Dal 2"
      const trailingNum = line.match(
        /^(.+?)[\s\-–:]+(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?)$/,
      );
      if (trailingNum) {
        name = trailingNum[1].trim();
        quantity = trailingNum[2].replace(/\s+/g, ""); // normalise "1 / 2" → "1/2"
      } else {
        name = line;
        quantity = "";
      }
    }

    // Final cleanup: strip leading list markers (1. 2. * - •)
    name = name
      .replace(/^[\d]+[.)]\s*/, "")
      .replace(/^[\*\-–•]\s*/, "")
      .trim();

    if (name.length > 0) {
      items.push({ name, quantity });
    }
  }

  return items;
}

// ── Google Gemini (generic — pass whichever `parts` the caller needs) ───────
// `googleOCR` (image+prompt) and `callGeminiText` (text-only prompt, used by
// the voice-parsing engines below) both build on this shared retry loop
// instead of duplicating it — same models/version-fallback/429-backoff
// behavior either way.

// ORIGINAL CODE
async function callGemini(parts: any[]): Promise<string> {
  const key = process.env.GOOGLE_AI_API_KEY;
  if (!key) throw new Error("GOOGLE_AI_API_KEY not set");

  const body = JSON.stringify({ contents: [{ parts }] });

  for (const model of [
    "gemini-2.5-flash-preview-05-20",
    "gemini-2.5-flash",
    "gemini-2.0-flash",
  ]) {
    for (const version of ["v1", "v1beta"]) {
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${key}`;
      try {
        const res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body,
        });
        if (res.status === 429) {
          await sleep(3000);
          continue;
        }
        if (!res.ok) continue;
        const text = (
          (await res.json()).candidates?.[0]?.content?.parts?.[0]?.text || ""
        ).trim();
        if (text) return text;
      } catch {
        continue;
      }
    }
  }
  throw new Error("Google Gemini unavailable");
}

export async function googleOCR(
  base64: string,
  mediaType: string,
  prompt: string,
): Promise<string> {
  return callGemini([
    { inline_data: { mime_type: mediaType, data: base64 } },
    { text: prompt },
  ]);
}

async function callGeminiText(prompt: string): Promise<string> {
  return callGemini([{ text: prompt }]);
}

function cleanJson(raw: string): string {
  return raw
    .replace(/^```json?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

// ── IndicTrans2 translation ──────────────────────────────────────────────────

export async function indicTranslate(rawText: string): Promise<string> {
  const res = await fetch(`${INDICTRANS_URL}/translate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: rawText }),
    signal: AbortSignal.timeout(60000),
  });
  if (!res.ok) throw new Error(`IndicTrans2 ${res.status}`);
  const { translated } = await res.json();
  return translated;
}

// ── Single-product extraction engines ────────────────────────────────────────

export async function tryGoogleOCRWithIndicTrans2(
  base64: string,
  mediaType: string,
): Promise<any> {
  console.log("[pipeline] stage-1 Google OCR…");
  const rawText = await googleOCR(base64, mediaType, GOOGLE_OCR_PRODUCT_PROMPT);

  console.log("[pipeline] stage-2 IndicTrans2 translation…");
  const translated = await indicTranslate(rawText);

  console.log("[pipeline] stage-3 English text parsing…");
  return parseEnglishText(translated);
}

export async function tryClaude(
  base64: string,
  mediaType: string,
): Promise<any> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: mediaType as any,
              data: base64,
            },
          },
          { type: "text", text: PRODUCT_VISION_PROMPT },
        ],
      },
    ],
  });
  const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  return JSON.parse(
    raw
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim(),
  );
}

// Given just a product NAME (no image — used by bulk product scan, where each
// line item has no per-item sub-image to feed vision), ask Claude for a
// best-guess category/description/brand. Best-effort: callers should fall
// back to `guessCategory(name)` if this throws/is unavailable.
export async function tryClaudeTextEnrich(
  productName: string,
): Promise<{ category: string; description: string; brand: string }> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              `Given only this product name: "${productName}", reply ONLY with a raw JSON object — no markdown, no code fences:\n` +
              `{"category":"<one of: ${PRODUCT_CATEGORIES}>","description":"<1-2 sentence plausible product description in English>","brand":"<brand name if the product name implies one, else empty string>"}`,
          },
        ],
      },
    ],
  });
  const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  return JSON.parse(
    raw
      .replace(/^```json?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim(),
  );
}

// Given a spoken-then-transcribed sentence (already English — callers
// translate non-English text via `indicTranslate` first, same as every
// other text-extraction path in this file), ask Claude to pull structured
// product fields out of it. Mirrors `tryClaudeTextEnrich`'s conventions
// (same PRODUCT_CATEGORIES list, same JSON-only-response contract) but
// additionally extracts price/discountedPrice/totalStock since a spoken
// "Add Product" sentence is expected to include them (unlike a bare product
// name from a scanned list).
export const VOICE_PRODUCT_PROMPT_INSTRUCTIONS =
  `You are helping a store owner add a product by speaking it aloud. Given the transcribed sentence below, extract the product details.\n` +
  `Reply ONLY with a raw JSON object — no markdown, no code fences:\n` +
  `{"productName":"<product name>","category":"<one of: ${PRODUCT_CATEGORIES}>","price":<MRP as number, 0 if not mentioned>,"discountedPrice":<sale price as number, same as price if not mentioned>,"totalStock":<stock quantity as number, 0 if not mentioned>,"description":"<1-2 sentence plausible product description in English>","brand":"<brand name if mentioned, else empty string>"}`;

export async function tryClaudeVoiceProductParse(text: string): Promise<{
  productName: string;
  category: string;
  price: number;
  discountedPrice: number;
  totalStock: number;
  description: string;
  brand: string;
}> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 400,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${VOICE_PRODUCT_PROMPT_INSTRUCTIONS}\n\nTranscribed sentence: "${text}"`,
          },
        ],
      },
    ],
  });
  const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  return JSON.parse(cleanJson(raw));
}

// Gemini variant of the same extraction — tried first (see
// `extractVoiceProductDetails` below), Claude is the fallback engine, same
// two-engines-with-fallback shape as `extractDetails`'s
// google+indictrans2/claude pair for the image OCR path.
export async function tryGeminiVoiceProductParse(text: string): Promise<{
  productName: string;
  category: string;
  price: number;
  discountedPrice: number;
  totalStock: number;
  description: string;
  brand: string;
}> {
  const raw = await callGeminiText(
    `${VOICE_PRODUCT_PROMPT_INSTRUCTIONS}\n\nTranscribed sentence: "${text}"`,
  );
  return JSON.parse(cleanJson(raw));
}

export async function extractVoiceProductDetails(text: string) {
  const engines = [
    { name: "gemini-voice", fn: () => tryGeminiVoiceProductParse(text) },
    { name: "claude-voice", fn: () => tryClaudeVoiceProductParse(text) },
  ];
  for (const e of engines) {
    try {
      return { extracted: await e.fn(), engine: e.name };
    } catch (err: any) {
      console.warn(`[voice-product] ${e.name} failed:`, err.message);
    }
  }
  throw new Error("All voice-parsing engines failed.");
}

// Given a spoken-then-transcribed multi-item shopping sentence (already
// English), ask Claude for a JSON array of {name, quantity} — the same
// shape `parseItems()` produces from OCR'd lines, but via a fresh LLM
// prompt since a natural sentence ("2 kg rice, 1 litre milk and 5
// bananas") has no newlines for `parseItems()`'s line-splitter to work
// with. Items the model can't confidently separate out are flagged
// `needsClarification` instead of being dropped, so the caller can surface
// them as an editable row rather than silently losing part of the order.
export const VOICE_LIST_PROMPT_INSTRUCTIONS =
  `You are helping a customer build a shopping list by speaking it aloud. Given the transcribed sentence below, extract every product the customer mentioned.\n` +
  `Reply ONLY with a raw JSON array — no markdown, no code fences, no extra text:\n` +
  `[{"name":"<item name in English>","quantity":"<quantity with unit as mentioned, e.g. \\"2 kg\\", or empty string if none>","needsClarification":<true if this item's name or quantity is genuinely ambiguous/unclear from the sentence, otherwise false>}]\n` +
  `Split naturally on "and", commas, or other separators. Do not skip anything the customer said, even if unclear — flag it instead.`;

export interface VoiceListItem {
  name: string;
  quantity: string;
  needsClarification: boolean;
}

export async function tryClaudeVoiceListParse(
  text: string,
): Promise<VoiceListItem[]> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) throw new Error("ANTHROPIC_API_KEY not set");
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const res = await new Anthropic({ apiKey: key }).messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `${VOICE_LIST_PROMPT_INSTRUCTIONS}\n\nTranscribed sentence: "${text}"`,
          },
        ],
      },
    ],
  });
  const raw = res.content[0].type === "text" ? res.content[0].text.trim() : "";
  return parseVoiceListJson(cleanJson(raw));
}

function parseVoiceListJson(cleaned: string): VoiceListItem[] {
  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed))
    throw new Error("Voice list parse returned an unexpected format.");
  return parsed
    .map((it: any) => ({
      name: String(it?.name || "").trim(),
      quantity: String(it?.quantity || "").trim(),
      needsClarification: !!it?.needsClarification,
    }))
    .filter((it) => it.name.length > 0);
}

// Gemini variant — tried first, Claude is the fallback engine (same
// two-engine pattern as `extractVoiceProductDetails` above).
export async function tryGeminiVoiceListParse(
  text: string,
): Promise<VoiceListItem[]> {
  const raw = await callGeminiText(
    `${VOICE_LIST_PROMPT_INSTRUCTIONS}\n\nTranscribed sentence: "${text}"`,
  );
  return parseVoiceListJson(cleanJson(raw));
}

export async function extractVoiceListItems(text: string) {
  const engines = [
    { name: "gemini-voice", fn: () => tryGeminiVoiceListParse(text) },
    { name: "claude-voice", fn: () => tryClaudeVoiceListParse(text) },
  ];
  for (const e of engines) {
    try {
      return { extracted: await e.fn(), engine: e.name };
    } catch (err: any) {
      console.warn(`[voice-list] ${e.name} failed:`, err.message);
    }
  }
  throw new Error("All voice-parsing engines failed.");
}

export async function extractDetails(base64: string, mediaType: string) {
  const engines = [
    {
      name: "google+indictrans2",
      fn: () => tryGoogleOCRWithIndicTrans2(base64, mediaType),
    },
    { name: "claude", fn: () => tryClaude(base64, mediaType) },
  ];
  for (const e of engines) {
    try {
      return { extracted: await e.fn(), engine: e.name };
    } catch (err: any) {
      console.warn(`[extract] ${e.name} failed:`, err.message);
    }
  }
  throw new Error("All extraction engines failed.");
}

// ── Image generation ──────────────────────────────────────────────────────────

export type ImageResult =
  | { base64: string; mimeType: string }
  | { url: string };

  //ORIGINAL CODE
export async function generateWithFluxSchnell(
  productName: string,
  category: string,
): Promise<ImageResult | null> {
  // const prompt = encodeURIComponent(
  //   `Professional e-commerce product photo of ${productName}${category ? `, ${category}` : ''}, plain white background, studio lighting, high quality, photorealistic, no text, no watermark`,
  // );
  const prompt = encodeURIComponent(`
Ultra realistic photograph of fresh ${productName}.
${category ? `Category: ${category}.` : ""}
White studio background.
Single product only.
Professional e-commerce product photography.
Natural colors.
High resolution.
No labels.
No logo.
No watermark.
No packaging.
No text.
No illustrations.
Photo only.
`);
  // const url = `${POLLINATIONS_URL}/${prompt}?width=512&height=512&model=flux&nologo=true&seed=${Date.now()}`;

  const seed = Math.floor(Math.random() * 2147483647);

const url = `${POLLINATIONS_URL}/${prompt}?width=512&height=512&model=flux&nologo=true&seed=${seed}`;
  try {
    console.log("Generating image...");
    console.log("Product:", productName);
    console.log("Category:", category);
    console.log("URL:", url);

    const res = await fetch(url, { signal: AbortSignal.timeout(60000) });

    console.log("Status:", res.status);
    console.log("Content-Type:", res.headers.get("content-type"));
    if (!res.ok) return null;
    const arrayBuffer = await res.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString("base64");
    const mimeType = res.headers.get("content-type") || "image/jpeg";
    return { base64, mimeType };
  } catch {
    return null;
  }
}

// ── PNG product card (SVG → sharp → PNG) — always-works fallback ────────────

export const CAT_STYLE: Record<
  string,
  { bg: string; accent: string; light: string; symbol: string }
> = {
  Groceries: {
    bg: "#FFF7ED",
    accent: "#EA580C",
    light: "#FED7AA",
    symbol: "GR",
  },
  Dairy: { bg: "#F0FDF4", accent: "#16A34A", light: "#BBF7D0", symbol: "DA" },
  Beverages: {
    bg: "#EFF6FF",
    accent: "#2563EB",
    light: "#BFDBFE",
    symbol: "BV",
  },
  Snacks: { bg: "#FFFBEB", accent: "#D97706", light: "#FDE68A", symbol: "SN" },
  "Beauty & Skincare": {
    bg: "#FDF4FF",
    accent: "#9333EA",
    light: "#E9D5FF",
    symbol: "BS",
  },
  Household: {
    bg: "#F0F9FF",
    accent: "#0284C7",
    light: "#BAE6FD",
    symbol: "HH",
  },
  Electronics: {
    bg: "#F8FAFC",
    accent: "#475569",
    light: "#CBD5E1",
    symbol: "EL",
  },
  Clothing: {
    bg: "#FFF1F2",
    accent: "#E11D48",
    light: "#FECDD3",
    symbol: "CL",
  },
  Vegetables: {
    bg: "#F0FDF4",
    accent: "#16A34A",
    light: "#BBF7D0",
    symbol: "VG",
  },
  Fruits: { bg: "#FFF7ED", accent: "#EA580C", light: "#FED7AA", symbol: "FR" },
  Medicine: {
    bg: "#F0FDF4",
    accent: "#15803D",
    light: "#A7F3D0",
    symbol: "MD",
  },
  Stationery: {
    bg: "#FEFCE8",
    accent: "#CA8A04",
    light: "#FEF08A",
    symbol: "ST",
  },
};
const DEFAULT_STYLE = {
  bg: "#F8FAFC",
  accent: "#334155",
  light: "#CBD5E1",
  symbol: "PR",
};

function escapeXml(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
function wrapWords(text: string, maxLen: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const c = line ? `${line} ${w}` : w;
    if (c.length > maxLen) {
      if (line) lines.push(line);
      line = w;
    } else line = c;
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

export async function buildProductCard(
  productName: string,
  category: string,
): Promise<ImageResult> {
  const s = CAT_STYLE[category] || DEFAULT_STYLE;
  const lines = wrapWords(productName.toUpperCase(), 14);
  const fs = lines.some((l) => l.length > 11) ? 26 : 32;
  const midY = 240 - (lines.length - 1) * (fs * 0.65);

  const textRows = lines
    .map(
      (l, i) =>
        `<text x="200" y="${Math.round(midY + i * fs * 1.3)}"
      text-anchor="middle" font-family="Arial,sans-serif"
      font-size="${fs}" font-weight="bold" fill="${s.accent}">${escapeXml(l)}</text>`,
    )
    .join("\n");

  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400">
  <rect width="400" height="400" fill="${s.bg}"/>
  <rect x="0" y="0" width="400" height="8" fill="${s.accent}"/>
  <rect x="0" y="392" width="400" height="8" fill="${s.accent}" opacity="0.5"/>
  <rect x="120" y="20" width="160" height="26" rx="13" fill="${s.light}"/>
  <text x="200" y="38" text-anchor="middle"
    font-family="Arial,sans-serif" font-size="11" font-weight="700"
    fill="${s.accent}">${escapeXml((category || "Product").toUpperCase())}</text>
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
    const { default: sharp } = await import("sharp");
    const png = await sharp(Buffer.from(svg))
      .resize(400, 400)
      .png({ compressionLevel: 6 })
      .toBuffer();
    return { base64: png.toString("base64"), mimeType: "image/png" };
  } catch {
    return {
      base64: Buffer.from(svg).toString("base64"),
      mimeType: "image/svg+xml",
    };
  }
}

// ── Shared image library check ────────────────────────────────────────────────

export async function checkSharedLibrary(
  productName: string,
): Promise<ImageResult | null> {
  try {
    const res = await fetch(
      `${GATEWAY}/api/product-images?name=${encodeURIComponent(productName)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.imageUrl) return { url: data.imageUrl };
    }
  } catch {
    /* not found */
  }
  return null;
}

export async function getProductImage(
  productName: string,
  category: string,
): Promise<{ result: ImageResult; aiGenerated: boolean }> {
  // 1. Shared library — reuse existing image uploaded by any store
  const shared = await checkSharedLibrary(productName);
  if (shared) return { result: shared, aiGenerated: false };

  // 2. AI image generation (Pollinations.ai FLUX)
  const generated = await generateWithFluxSchnell(productName, category);
  if (generated) return { result: generated, aiGenerated: true };

  // 3. Generated product card — always works, zero external calls
  return {
    result: await buildProductCard(productName, category),
    aiGenerated: false,
  };
}

export function imageResultToUrl(result: ImageResult): string {
  return "base64" in result
    ? `data:${result.mimeType};base64,${result.base64}`
    : result.url;
}
