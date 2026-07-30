// Dependency-free fuzzy matcher for mapping a requested shopping-list item
// (e.g. "Rice", translated from any Indian language via the indictrans dictionary)
// to the closest product title a store actually carries.

const UNIT_WORDS = /\b(kg|g|gm|gms|gram|grams|ml|l|ltr|litre|litres|liter|liters|lt|pcs|pc|piece|pieces|nos|no|packet|packets|pack|packs|box|boxes|dozen|doz|bundle|bundles|bag|bags|bottle|bottles|can|cans|unit|units|set|sets|pair|pairs|kilo|kilos)\b/g;

function normalizeTerm(s) {
  return String(s || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(UNIT_WORDS, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function parseQuantity(qtyText) {
  const m = String(qtyText || '').match(/(\d+(?:[.,]\d+)?)/);
  if (!m) return 1;
  const n = parseFloat(m[1].replace(',', '.'));
  return n > 0 ? n : 1;
}

function scoreMatch(requestedName, productTitle) {
  const reqNorm  = normalizeTerm(requestedName);
  const prodNorm = normalizeTerm(productTitle);
  if (!reqNorm || !prodNorm) return 0;
  if (reqNorm === prodNorm) return 1;

  const reqTokens  = reqNorm.split(' ').filter(Boolean);
  const prodTokens = new Set(prodNorm.split(' ').filter(Boolean));
  if (!reqTokens.length || !prodTokens.size) return 0;

  let overlap = 0;
  for (const t of reqTokens) {
    if (prodTokens.has(t)) {
      overlap += 1;
      continue;
    }
    for (const p of prodTokens) {
      if (p.length > 2 && t.length > 2 && (p.includes(t) || t.includes(p))) {
        overlap += 0.5;
        break;
      }
    }
  }
  return Math.min(1, overlap / reqTokens.length);
}

// Exact-ish brand match — normalized equality, or one contains the other
// (handles "Lifebuoy" vs "Lifebuoy Total" style variants).
function brandMatches(requestedBrand, productBrand) {
  const reqB  = normalizeTerm(requestedBrand);
  const prodB = normalizeTerm(productBrand);
  if (!reqB || !prodB) return false;
  return reqB === prodB || prodB.includes(reqB) || reqB.includes(prodB);
}

const MIN_CONFIDENCE = 0.5;

// requestedBrand is optional. When provided:
//   1. Prefer candidates whose brand matches — pick the best title-scoring one among those.
//   2. If none of those clear MIN_CONFIDENCE (or no brand match exists at all),
//      fall back to the best title match from ANY brand, and flag it as substituted.
// Returns { product, score, brandMatched, substituted, requestedBrand } or null.
function bestMatchForItem(requestedName, candidateProducts, requestedBrand) {
  const hasBrandRequest = requestedBrand && String(requestedBrand).trim();

  if (hasBrandRequest) {
    let brandBest = null;
    let brandBestScore = 0;
    for (const p of candidateProducts) {
      if (!brandMatches(requestedBrand, p.brand)) continue;
      const s = scoreMatch(requestedName, p.title);
      if (s > brandBestScore) {
        brandBestScore = s;
        brandBest = p;
      }
    }
    if (brandBest && brandBestScore >= MIN_CONFIDENCE) {
      return { product: brandBest, score: brandBestScore, brandMatched: true, substituted: false };
    }
  }

  // Fallback — best title match regardless of brand
  let best = null;
  let bestScore = 0;
  for (const p of candidateProducts) {
    const s = scoreMatch(requestedName, p.title);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  if (bestScore < MIN_CONFIDENCE) return null;

  return {
    product: best,
    score: bestScore,
    brandMatched: !hasBrandRequest, // no brand was requested, so nothing to substitute
    substituted: !!hasBrandRequest,  // brand was requested but this doesn't match it
    requestedBrand: hasBrandRequest ? requestedBrand : undefined,
  };
}

module.exports = { normalizeTerm, parseQuantity, scoreMatch, brandMatches, bestMatchForItem, MIN_CONFIDENCE };