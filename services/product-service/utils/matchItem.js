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

const MIN_CONFIDENCE = 0.5;

function bestMatchForItem(requestedName, candidateProducts) {
  let best = null;
  let bestScore = 0;
  for (const p of candidateProducts) {
    const s = scoreMatch(requestedName, p.title);
    if (s > bestScore) {
      bestScore = s;
      best = p;
    }
  }
  return bestScore >= MIN_CONFIDENCE ? { product: best, score: bestScore } : null;
}

module.exports = { normalizeTerm, parseQuantity, scoreMatch, bestMatchForItem, MIN_CONFIDENCE };
