"""
Indian language → English translation service using deep-translator (Google Translate).
Includes pre-translation abbreviation expansion and post-translation grocery normalization.
Port 8400.
"""

import csv
import logging
import os
import re

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

PORT = int(os.getenv("PORT", "8400"))

# ── User dictionary  (dictionary.csv) ────────────────────────────────────────
# Format: lang,native_phrase,english_name
# Lines starting with # are comments.  Loaded once at startup.
# Longer phrases are matched before shorter ones (sorted by length desc)
# so "కొబ్బరి నూనె" wins over "నూనె" alone.

_DICT: dict[str, list[tuple[str, str]]] = {}   # lang → [(native, english), ...]

def _load_dictionary() -> None:
    path = os.path.join(os.path.dirname(__file__), "dictionary.csv")
    if not os.path.exists(path):
        logger.warning("dictionary.csv not found — skipping")
        return
    with open(path, encoding="utf-8") as f:
        for row in csv.reader(f):
            if not row or row[0].startswith("#"):
                continue
            if len(row) < 3:
                continue
            lang, native, english = row[0].strip(), row[1].strip(), row[2].strip()
            if lang and native and english:
                _DICT.setdefault(lang, []).append((native, english))
    # Sort each language list: longest phrase first → avoids partial matches
    for lang in _DICT:
        _DICT[lang].sort(key=lambda t: len(t[0]), reverse=True)
    total = sum(len(v) for v in _DICT.values())
    logger.info(f"Dictionary loaded: {total} entries across {list(_DICT.keys())}")

_load_dictionary()


def apply_dictionary(text: str, lang: str, token_map: dict) -> str:
    """Replace known native phrases with numeric tokens before Google Translate."""
    entries = _DICT.get(lang, [])
    if not entries:
        return text
    result = text
    for native, english in entries:
        if native in result:
            # Use a stable token derived from the entry index
            token = f"__D{abs(hash(native)) % 99999:05d}__"
            result = result.replace(native, token)
            token_map[token] = english
    return result

LANG_NAMES = {
    "hi": "Hindi", "ta": "Tamil", "te": "Telugu", "kn": "Kannada",
    "ml": "Malayalam", "bn": "Bengali", "gu": "Gujarati", "pa": "Punjabi",
    "mr": "Marathi", "or": "Odia", "as": "Assamese", "ur": "Urdu",
    "ne": "Nepali", "si": "Sinhala", "sa": "Sanskrit", "en": "English",
}

# ── Pre-translation abbreviation expansion ────────────────────────────────────
# Patterns use re.UNICODE; no \b around Tamil chars since word-boundary
# behaviour for non-ASCII is unreliable.  We match the abbreviated form
# anywhere in the string (case-sensitive, since Tamil is case-independent).

TAMIL_ABBR = [
    # ── Dals ──
    ('து\\.\\s*பருப்பு',   'துவரம் பருப்பு'),   # து. பருப்பு → Toor dal
    ('து\\s+பருப்பு',      'துவரம் பருப்பு'),
    ('உ\\.\\s*பருப்பு',    'உளுத்தம் பருப்பு'), # Urad dal
    ('க\\.\\s*பருப்பு',    'கடலை பருப்பு'),     # Chana dal
    ('பா\\.\\s*பருப்பு',   'பாசிப் பருப்பு'),   # Moong dal
    ('ம\\.\\s*பருப்பு',    'மசூர் பருப்பு'),    # Masoor dal
    # ── Oils ──
    ('தே\\.\\s*எண்ணெய்',  'தேங்காய் எண்ணெய்'), # தே.எண்ணெய் → Coconut oil
    ('த\\.\\s*எண்ணெய்',   'தேங்காய் எண்ணெய்'), # த.எண்ணெய்  → Coconut oil
    ('க\\.\\s*எண்ணெய்',   'கடலை எண்ணெய்'),     # க.எண்ணெய்  → Groundnut oil
    ('சூ\\.\\s*எண்ணெய்',  'சூரியகாந்தி எண்ணெய்'), # சூ.எண்ணெய் → Sunflower oil
    ('நல்\\.\\s*எண்ணெய்', 'நல்லெண்ணெய்'),      # நல்.எண்ணெய் → Sesame oil
    # ── Flour ──
    ('க\\.\\s*மாவு',       'கோதுமை மாவு'),      # Wheat flour
    ('மி\\.\\s*மாவு',      'மிளகாய் மாவு'),     # Chilli powder
]

HINDI_ABBR = [
    ('अ\\.\\s*दाल',        'अरहर दाल'),
    ('उ\\.\\s*दाल',        'उड़द दाल'),
    ('मू\\.\\s*दाल',       'मूंग दाल'),
    ('च\\.\\s*दाल',        'चना दाल'),
    ('मस\\.\\s*दाल',       'मसूर दाल'),
    ('स\\.\\s*तेल',        'सरसों का तेल'),
    ('न\\.\\s*तेल',        'नारियल तेल'),
]

TELUGU_ABBR = [
    # ── Dals ──
    ('క\\.\\s*పప్పు',     'కందిపప్పు'),      # Toor dal
    ('మి\\.\\s*పప్పు',    'మినుముల పప్పు'),  # Urad dal
    ('ప\\.\\s*పప్పు',     'పెసర పప్పు'),     # Moong dal
    ('స\\.\\s*పప్పు',     'సెనగ పప్పు'),     # Chana dal
    ('మ\\.\\s*పప్పు',     'మసూర్ పప్పు'),    # Masoor dal
    # ── Oils ──
    ('క\\.\\s*నూనె',      'కొబ్బరి నూనె'),   # Coconut oil
    ('వే\\.\\s*నూనె',     'వేరుశెనగ నూనె'), # Groundnut oil
    ('న\\.\\s*నూనె',      'నువ్వుల నూనె'),   # Sesame oil
    ('ప\\.\\s*నూనె',      'పొద్దుతిరుగుడు నూనె'), # Sunflower oil
    # ── Fractions (written abbr) ──
    ('అ\\.\\s*కిలో',      'అరకిలో'),         # 1/2 kg
    ('పా\\.\\s*కిలో',     'పావు కిలో'),      # 1/4 kg
]

ABBR_RULES: dict = {
    "ta": TAMIL_ABBR,
    "hi": HINDI_ABBR,
    "te": TELUGU_ABBR,
}


# ── Protect/restore: terms Google commonly mistranslates ─────────────────────
# These are applied BEFORE translation; placeholders survive through Google
# Translate untouched (they look like English), then get restored afterwards.
# Format: (source_pattern, placeholder_token, final_english_name)

TAMIL_PROTECT = [
    # ── Fractions — convert before translation so numbers stay intact ─────────
    # "முக்கால்" = 3/4, "அரை" = 1/2, "கால்" = 1/4
    (r'முக்கால்\s*கிலோ',          '__34KG__',   '3/4 kg'),
    (r'முக்கால்',                  '__34__',     '3/4'),
    (r'அரை\s*கிலோ',               '__12KG__',   '1/2 kg'),
    (r'(?<!\w)அரை(?!\w)',          '__12__',     '1/2'),
    (r'கால்\s*கிலோ',              '__14KG__',   '1/4 kg'),
    (r'(?<!\w)கால்(?!\w)',         '__14__',     '1/4'),

    # ── Whole beans / payaru (பயறு) — must come BEFORE dal rules ─────────────
    # "பாசிப்பயறு" = whole Green Gram (NOT Moong Dal which is split "பாசிப் பருப்பு")
    (r'பாசிப்\s*பயறு',           '__P001__',  'Green Gram'),
    # "தட்டைப்பயறு" = Black-eyed Pea / Cowpea
    (r'தட்டைப்\s*பயறு',          '__P002__',  'Black-eyed Peas'),
    # "கொள்ளு" = Horse Gram
    (r'கொள்ளு',                  '__P003__',  'Horse Gram'),
    # "காராமணி" = Black-eyed Pea (alternate name)
    (r'காராமணி',                 '__P002__',  'Black-eyed Peas'),
    # "மொச்சை" = Field Beans / Mochai
    (r'மொச்சை',                  '__P004__',  'Field Beans (Mochai)'),
    # "சோயா" = Soya Bean
    (r'சோயா\s*(?:பீன்|மொச்சை)?', '__P005__', 'Soya Beans'),

    # ── Household items ────────────────────────────────────────────────────────
    # "மூரம்" / "முறம்" = Winnowing Tray (traditional bamboo flat basket)
    (r'மூரம்',                     '__H001__', 'Winnowing Tray (Muram)'),
    (r'முறம்',                     '__H001__', 'Winnowing Tray (Muram)'),

    # ── Oils ──────────────────────────────────────────────────────────────────
    # "தேங்காய் எண்ணெய்" = Coconut Oil
    (r'தேங்காய்\s+எண்ணெய்',         '__P006__', 'Coconut Oil'),
    # "கடலை எண்ணெய்" = Groundnut Oil (Google may say "Peanut oil")
    (r'கடலை\s+எண்ணெய்',             '__P007__', 'Groundnut Oil'),
    # "சூரியகாந்தி எண்ணெய்" = Sunflower Oil
    (r'சூரியகாந்தி\s+எண்ணெய்',      '__P008__', 'Sunflower Oil'),
    # "நல்லெண்ணெய்" = Sesame / Gingelly Oil
    (r'நல்லெண்ணெய்',                '__P009__', 'Sesame Oil (Gingelly)'),

    # ── Split dals (பருப்பு) ───────────────────────────────────────────────────
    # "கடலை பருப்பு" — Google says "Kabuli Chana" (wrong, it's Chana Dal split)
    (r'கடலை\s+பருப்பு',          '__P010__', 'Chana Dal'),
    # "பாசிப் பருப்பு" — Google says "algae lentils" (!); it's Moong Dal
    (r'பாசிப்?\s+பருப்பு',        '__P011__', 'Moong Dal'),
    # "துவரம் பருப்பு" — Google can say "Dhole" or "Duvaram"
    (r'துவரம்\s+பருப்பு',         '__P012__', 'Toor Dal'),
    # "உளுத்தம் பருப்பு"
    (r'உளுத்தம்\s+பருப்பு',       '__P013__', 'Urad Dal'),
    # "மசூர் பருப்பு"
    (r'மசூர்\s+பருப்பு',          '__P014__', 'Masoor Dal'),
]

HINDI_PROTECT = [
    # Fractions
    (r'पौना\s*(?:किलो|kg)?',       '__34KG__',  '3/4 kg'),
    (r'(?<!\w)पौना(?!\w)',          '__34__',    '3/4'),
    (r'आधा\s*(?:किलो|kg)?',        '__12KG__',  '1/2 kg'),
    (r'(?<!\w)आधा(?!\w)',           '__12__',    '1/2'),
    (r'पाव\s*(?:किलो|kg)?',        '__14KG__',  '1/4 kg'),
    (r'(?<!\w)पाव(?!\w)',           '__14__',    '1/4'),
    # Dals
    (r'चना\s+दाल',  '__H010__', 'Chana Dal'),
    (r'मूंग\s+दाल', '__H011__', 'Moong Dal'),
    (r'अरहर\s+दाल', '__H012__', 'Toor Dal'),
    (r'उड़द\s+दाल',  '__H013__', 'Urad Dal'),
    (r'मसूर\s+दाल', '__H014__', 'Masoor Dal'),
]

TELUGU_PROTECT = [
    # ── Fractions / quantities ────────────────────────────────────────────────
    # "కిలోన్నర" / "కిలో ఒన్నర" = 1.5 kg (one and a half kilo)
    (r'కిలోన్నర',                       '__T150__', '1.5 kg'),
    (r'కిలో\s*ఒన్నర',                   '__T150__', '1.5 kg'),
    # "ముప్పావు కిలో" = 3/4 kg
    (r'ముప్పావు\s*కిలో',                '__T34KG__', '3/4 kg'),
    (r'ముప్పావు',                        '__T34__',   '3/4'),
    # "అరకిలో" / "అర కిలో" = 1/2 kg
    (r'అరకిలో',                         '__T12KG__', '1/2 kg'),
    (r'అర\s*కిలో',                      '__T12KG__', '1/2 kg'),
    (r'(?<![అ-ఱ])అర(?![అ-ఱ])',         '__T12__',   '1/2'),
    # "పావు కిలో" = 1/4 kg
    (r'పావు\s*కిలో',                    '__T14KG__', '1/4 kg'),
    (r'(?<![అ-ఱ])పావు(?![అ-ఱ])',       '__T14__',   '1/4'),

    # ── Split dals (పప్పు) ────────────────────────────────────────────────────
    (r'కంది\s*పప్పు',                   '__T010__', 'Toor Dal'),
    (r'కందిపప్పు',                      '__T010__', 'Toor Dal'),
    (r'మినప\s*పప్పు',                   '__T011__', 'Urad Dal'),
    (r'మినుముల\s*పప్పు',                '__T011__', 'Urad Dal'),
    (r'పెసర\s*పప్పు',                   '__T012__', 'Moong Dal'),
    (r'సెనగ\s*పప్పు',                   '__T013__', 'Chana Dal'),
    (r'చనగ\s*పప్పు',                    '__T013__', 'Chana Dal'),
    (r'మసూర్\s*పప్పు',                  '__T014__', 'Masoor Dal'),

    # ── Whole grains / legumes ────────────────────────────────────────────────
    (r'పెసలు',                          '__T020__', 'Green Gram'),
    (r'మినుములు',                       '__T021__', 'Urad (Whole)'),
    (r'అలసందలు',                        '__T022__', 'Black-eyed Peas'),
    (r'కందులు',                         '__T023__', 'Toor (Whole)'),
    (r'బొబ్బర్లు',                      '__T024__', 'Black-eyed Peas'),
    (r'సోయాబీన్స్?',                    '__T025__', 'Soya Beans'),

    # ── Oils ──────────────────────────────────────────────────────────────────
    (r'కొబ్బరి\s*నూనె',                 '__T030__', 'Coconut Oil'),
    (r'వేరుశెనగ\s*నూనె',               '__T031__', 'Groundnut Oil'),
    (r'వేరుశనగ\s*నూనె',                '__T031__', 'Groundnut Oil'),
    (r'నువ్వుల\s*నూనె',                 '__T032__', 'Sesame Oil (Gingelly)'),
    (r'పొద్దుతిరుగుడు\s*నూనె',         '__T033__', 'Sunflower Oil'),
    (r'ఆవాల\s*నూనె',                    '__T034__', 'Mustard Oil'),
    (r'పామాయిల్',                       '__T035__', 'Palm Oil'),

    # ── Rice & grains ─────────────────────────────────────────────────────────
    (r'బాస్మతి\s*బియ్యం',              '__T040__', 'Basmati Rice'),
    (r'సన్న\s*బియ్యం',                  '__T041__', 'Fine Rice'),
    (r'రాగులు',                         '__T042__', 'Ragi (Finger Millet)'),
    (r'జొన్నలు',                        '__T043__', 'Sorghum (Jowar)'),
    (r'సజ్జలు',                         '__T044__', 'Pearl Millet (Bajra)'),

    # ── Spices & condiments ───────────────────────────────────────────────────
    (r'వెల్లుల్లి',                     '__T050__', 'Garlic'),
    (r'అల్లం',                          '__T051__', 'Ginger'),
    (r'పసుపు',                          '__T052__', 'Turmeric'),
    (r'జీలకర్ర',                        '__T053__', 'Cumin Seeds (Jeera)'),
    (r'ధనియాలు',                        '__T054__', 'Coriander Seeds'),
    (r'మెంతులు',                        '__T055__', 'Fenugreek (Methi)'),
    (r'ఆవాలు',                          '__T056__', 'Mustard Seeds'),
    (r'నువ్వులు',                       '__T057__', 'Sesame Seeds'),
    (r'వేరుశనగలు',                      '__T058__', 'Peanuts (Groundnuts)'),
    (r'మిరపకాయ',                        '__T059__', 'Red Chilli'),
    (r'పచ్చిమిర్చి',                    '__T060__', 'Green Chilli'),
    (r'కరివేపాకు',                      '__T061__', 'Curry Leaves'),
    (r'కొత్తిమీర',                      '__T062__', 'Coriander Leaves'),

    # ── Vegetables ────────────────────────────────────────────────────────────
    (r'ఉల్లిపాయ',                       '__T070__', 'Onion'),
    (r'టమాట[ాా]?',                      '__T071__', 'Tomato'),
    (r'బెండకాయ',                        '__T072__', 'Okra (Ladies Finger)'),
    (r'వంకాయ',                          '__T073__', 'Brinjal'),
    (r'కాకరకాయ',                        '__T074__', 'Bitter Gourd'),
    (r'సొరకాయ',                         '__T075__', 'Bottle Gourd'),
    (r'పొట్లకాయ',                       '__T076__', 'Snake Gourd'),
    (r'చిక్కుడు',                       '__T077__', 'Cluster Beans'),
    (r'మునగకాయ',                        '__T078__', 'Drumstick (Moringa)'),
    (r'అరటికాయ',                        '__T079__', 'Raw Banana'),
    (r'ముల్లంగి',                       '__T080__', 'Radish'),
    (r'క్యారెట్',                       '__T081__', 'Carrot'),
    (r'బంగాళాదుంప',                     '__T082__', 'Potato'),
    (r'వెల్లుల్లి\s*రేకులు',            '__T083__', 'Garlic Cloves'),

    # ── Dairy / sugar ─────────────────────────────────────────────────────────
    (r'బెల్లం',                         '__T090__', 'Jaggery (Vellam)'),
    (r'నెయ్యి',                         '__T091__', 'Ghee (Clarified Butter)'),
    (r'పెరుగు',                         '__T092__', 'Curd (Yoghurt)'),
    (r'వెన్న',                          '__T093__', 'Butter'),

    # ── Household items ───────────────────────────────────────────────────────
    (r'చీపురు',                         '__T100__', 'Broom'),
    (r'బకెట్',                          '__T101__', 'Bucket'),
    (r'సబ్బు',                          '__T102__', 'Soap'),
    (r'వంట\s*సోడా',                     '__T103__', 'Baking Soda'),
    # Winnowing tray — two Telugu names
    (r'చెరిగిపారేసే\s*బుట్ట',           '__T104__', 'Winnowing Tray'),
    (r'(?<![అ-ఱ])చేట(?![అ-ఱ])',        '__T104__', 'Winnowing Tray'),
    # Furniture / general items
    (r'కుర్చీ',                         '__T105__', 'Chair'),
    (r'బల్ల',                           '__T106__', 'Table'),
    (r'మంచం',                           '__T107__', 'Bed'),
    # డబ్బా = box / tin / container
    (r'డబ్బా',                          '__T108__', 'Box'),
    (r'టిన్\s*డబ్బా',                   '__T109__', 'Tin Container'),
    # Branded cleaning products — protect so spelling stays correct
    (r'లైజోల్\s*బాటిల్',               '__T110__', 'Lizol bottle'),
    (r'లైజోల్',                         '__T111__', 'Lizol'),
    (r'డెట్టాల్',                       '__T112__', 'Dettol'),
    (r'హార్పిక్',                       '__T113__', 'Harpic'),
    (r'కోలిన్స్',                       '__T114__', 'Colin (Glass Cleaner)'),
    (r'సర్ఫ్\s*ఎక్సెల్',               '__T115__', 'Surf Excel'),
    (r'అరియల్',                         '__T116__', 'Ariel'),
    (r'విమ్\s*బార్',                    '__T117__', 'Vim Bar'),
    (r'విమ్',                           '__T118__', 'Vim'),
]

PROTECT_RULES: dict = {
    "ta": TAMIL_PROTECT,
    "hi": HINDI_PROTECT,
    "te": TELUGU_PROTECT,
}


def protect_terms(text: str, lang: str) -> tuple[str, dict]:
    """Replace known mis-translated source terms with neutral placeholders."""
    rules = PROTECT_RULES.get(lang, [])
    token_map: dict = {}  # placeholder → final English name
    result = text
    for pattern, token, english in rules:
        if re.search(pattern, result):
            result = re.sub(pattern, token, result)
            token_map[token] = english
    if token_map:
        logger.info(f"Protected tokens: {list(token_map.keys())}")
    return result, token_map


def restore_terms(text: str, token_map: dict) -> str:
    """Put the correct English names back in place of placeholders."""
    result = text
    for token, english in token_map.items():
        result = result.replace(token, english)
    return result


def expand_abbreviations(text: str, lang: str) -> str:
    rules = ABBR_RULES.get(lang, [])
    if not rules:
        return text
    result = text
    for pattern, replacement in rules:
        result = re.sub(pattern, replacement, result)
    if result != text:
        logger.info(f"Abbreviation expansion:\n{result[:200]}")
    return result


# ── Post-translation grocery normalization ────────────────────────────────────
# Applied AFTER Google Translate.  Handles both:
#  (a) correct translations that use non-Indian-English names (e.g. "pigeon pea")
#  (b) partially-transliterated abbreviations Google outputs (e.g. "Th. lentils")
#
# More-specific patterns FIRST so they win over shorter fallbacks.

GROCERY_NORM = [
    # ── Fraction word → symbol (Google sometimes spells out fractions) ────────
    (r'\bhalf\s+a?\s*',                                    '1/2 '),
    (r'\bquarter\s+a?\s*',                                 '1/4 '),
    (r'\bthree[\s\-]quarter\s+a?\s*',                      '3/4 '),
    # Unicode fraction characters → ASCII
    (r'½',                                                 '1/2'),
    (r'¼',                                                 '1/4'),
    (r'¾',                                                 '3/4'),
    (r'⅓',                                                 '1/3'),
    (r'⅔',                                                 '2/3'),

    # ── Toor Dal — all variants Google Translate can produce ──────────────────
    # Transliterated forms of "துவரம்" that Google outputs
    (r'(?:dhole|duvaram?|tuvaram?|thuvaram?|thuvarai?)\s+(?:dal|lentil|pulse|gram|paruppu)s?', 'Toor Dal'),
    (r'(?:dhole|duvaram?|tuvaram?|thuvaram?|thuvarai?)\s+paruppu',                             'Toor Dal'),
    # Abbreviated fall-through ("Th. lentils")
    (r'Th\.?\s+(?:lentil|dal|pulse|gram)s?',         'Toor Dal'),
    (r'thu\.?\s+(?:lentil|dal|pulse|gram)s?',        'Toor Dal'),
    # Standard English names
    (r'toor\s+(?:dal|lentil|pulse|gram)s?',          'Toor Dal'),
    (r'tuvar\s+(?:dal|lentil|pulse|gram)s?',         'Toor Dal'),
    (r'arhar\s+(?:dal|lentil|pulse|gram)s?',         'Toor Dal'),
    (r'pigeon\s*peas?\s*(?:dal|lentils?)?',          'Toor Dal'),
    (r'pigeonpea\s*(?:dal|lentil|pulse)s?',          'Toor Dal'),

    # ── Urad Dal ──────────────────────────────────────────────────────────────
    # Transliterated: "Urutam", "Ulutham", "Uzhunnu"
    (r'(?:urutam|ulutham|uzhunnu|udad)\s+(?:dal|lentil|pulse|gram|paruppu)s?', 'Urad Dal'),
    (r'\bU\.?\s+(?:lentil|dal|pulse|gram)s?',        'Urad Dal'),
    (r'urad\s+(?:dal|lentil|pulse|gram)s?',          'Urad Dal'),
    (r'black\s+gram\s*(?:dal|lentil|pulse)s?',       'Urad Dal'),
    (r'black\s+gram',                                 'Urad Dal'),

    # ── Chana Dal ─────────────────────────────────────────────────────────────
    # Transliterated: "Kadalai" → chickpea but split form = Chana Dal
    (r'(?:kadalai|kadala)\s+(?:paruppu|dal|lentil)s?',  'Chana Dal'),
    (r'\bK\.?\s+(?:lentil|dal|pulse|gram)s?',            'Chana Dal'),
    (r'chana\s+(?:dal|lentil|pulse|gram)s?',             'Chana Dal'),
    (r'bengal\s+gram\s*(?:dal|lentil|pulse)s?',          'Chana Dal'),
    (r'split\s+chickpea\s*(?:dal|lentil)s?',             'Chana Dal'),
    (r'chickpea\s+lentils?',                              'Chana Dal'),
    (r'bengal\s+gram',                                    'Chana Dal'),

    # ── Whole beans — protect correct names BEFORE dal rules ─────────────────
    # "பாசிப்பயறு" / "green gram" (whole) must NOT become Moong Dal
    (r'green\s+gram(?!\s+(?:dal|lentil|pulse))',          'Green Gram'),
    (r'whole\s+mung\s+beans?',                            'Green Gram'),
    # Black-eyed pea / cowpea
    (r'black[\s\-]?eyed\s+peas?',                         'Black-eyed Peas'),
    (r'\bcowpeas?\b',                                      'Black-eyed Peas'),
    (r'\blobiya\b',                                        'Black-eyed Peas'),
    # Horse gram
    (r'horse\s+gram',                                      'Horse Gram'),
    (r'\bkulthi\b',                                        'Horse Gram'),
    # Field beans — \b prevents backtracking; lookaheads stop double-replacement
    (r'field\s+beans\b(?!\s*\()',                          'Field Beans (Mochai)'),
    (r'\bmochai\b(?!\s*\))',                               'Field Beans (Mochai)'),
    # Soya
    (r'soy(?:a|bean)?\s*beans?',                          'Soya Beans'),

    # ── Moong Dal (split) — only when explicitly a dal/lentil ─────────────────
    (r'(?:paasi|pasi)\s+(?:paruppu|dal|lentil|gram)s?',  'Moong Dal'),
    (r'algae\s+(?:lentil|dal|pulse|gram)s?',             'Moong Dal'),
    (r'[Pp]a\.?\s+(?:lentil|dal|pulse|gram)s?',          'Moong Dal'),
    (r'moong\s+(?:dal|lentil|pulse|gram)s?',             'Moong Dal'),
    (r'mung\s+(?:dal|lentil|pulse)s?',                   'Moong Dal'),
    (r'green\s+gram\s+(?:dal|lentil|pulse)s?',           'Moong Dal'),

    # ── Masoor Dal ────────────────────────────────────────────────────────────
    # Google outputs "Masur dal" (single o) — catch that too
    (r'masur\s+(?:dal|lentil|pulse)s?',                  'Masoor Dal'),
    (r'masoor\s+(?:dal|lentil|pulse)s?',                 'Masoor Dal'),
    (r'\bM\.?\s+(?:lentil|dal|pulse|gram)s?',            'Masoor Dal'),
    (r'red\s+lentils?',                                   'Masoor Dal'),
    (r'pink\s+lentils?',                                  'Masoor Dal'),

    # ── Other legumes ─────────────────────────────────────────────────────────
    (r'rajma\s*(?:beans?)?',                             'Rajma'),
    (r'kidney\s+beans?',                                 'Rajma'),
    (r'kabuli\s+chana',                                  'Kabuli Chana'),
    (r'white\s+chickpeas?',                              'Kabuli Chana'),
    (r'moth\s+(?:bean|dal|lentil)s?',                   'Moth Dal'),
    # Whole chickpea (not split/dal) — only when no dal context
    (r'chickpeas?(?!\s+(?:dal|lentil|flour))',           'Kabuli Chana'),

    # ── Rice ──────────────────────────────────────────────────────────────────
    (r'basmati\s+rice',                                  'Basmati Rice'),
    (r'sona\s*masoori\s+rice',                           'Sona Masoori Rice'),
    (r'samba\s+rice',                                    'Samba Rice'),
    (r'ponni\s+rice',                                    'Ponni Rice'),
    (r'parboiled\s+rice',                                'Parboiled Rice'),

    # ── Flours — use negative lookahead to prevent double-replacement ─────────
    (r'wheat\s+flour(?!\s*\()',                          'Wheat Flour (Atta)'),
    (r'\batta\b(?!\s*\))',                               'Wheat Flour (Atta)'),
    (r'\bmaida\b(?!\s*\))',                              'All-Purpose Flour (Maida)'),
    (r'\bbesan\b(?!\s*\))',                              'Chickpea Flour (Besan)'),
    (r'chickpea\s+flour(?!\s*\()',                       'Chickpea Flour (Besan)'),
    (r'gram\s+flour(?!\s*\()',                           'Chickpea Flour (Besan)'),
    (r'rice\s+flour',                                    'Rice Flour'),
    (r'ragi\s+flour',                                    'Ragi (Finger Millet) Flour'),
    (r'corn\s+flour',                                    'Corn Flour'),

    # ── Oils ──────────────────────────────────────────────────────────────────
    (r'coconut\s+oil',                                   'Coconut Oil'),
    (r'groundnut\s+oil',                                 'Groundnut Oil'),
    (r'peanut\s+oil',                                    'Groundnut Oil'),
    (r'sunflower\s+oil',                                 'Sunflower Oil'),
    (r'mustard\s+oil',                                   'Mustard Oil'),
    (r'sesame\s+oil',                                    'Sesame Oil (Gingelly)'),
    (r'gingelly\s+oil',                                  'Sesame Oil (Gingelly)'),

    # ── Spices ────────────────────────────────────────────────────────────────
    (r'chilli?\s+powder',                                'Red Chilli Powder'),
    (r'turmeric\s+powder',                               'Turmeric Powder'),
    (r'coriander\s+powder',                              'Coriander Powder'),
    (r'cumin\s+powder',                                  'Cumin Powder'),
    (r'garam\s+masala',                                  'Garam Masala'),
    (r'sambar\s+powder',                                 'Sambar Powder'),
    (r'rasam\s+powder',                                  'Rasam Powder'),
    (r'pepper\s+powder',                                 'Black Pepper Powder'),
    (r'fenugreek\s+(?:seeds?|powder)',                   'Fenugreek (Methi)'),
    (r'\bmethi\b',                                       'Fenugreek (Methi)'),
    (r'mustard\s+seeds?',                                'Mustard Seeds'),
    (r'cumin\s+seeds?',                                  'Cumin Seeds (Jeera)'),
    (r'\bjeera\b',                                       'Cumin Seeds (Jeera)'),
    (r'\bcardamom\b',                                    'Cardamom (Elaichi)'),
    (r'\belaichi\b',                                     'Cardamom (Elaichi)'),
    (r'star\s+anise',                                    'Star Anise'),
    (r'\bcinnamon\b',                                    'Cinnamon (Dalchini)'),
    (r'bay\s+leaves?',                                   'Bay Leaves'),
    (r'\basafoetida\b',                                  'Asafoetida (Hing)'),
    (r'\bhing\b',                                        'Asafoetida (Hing)'),

    # ── Sugar / Jaggery ───────────────────────────────────────────────────────
    (r'\bjaggery\b(?!\s*\()',                              'Jaggery (Vellam)'),
    (r'\bvellam\b(?!\s*\))',                             'Jaggery (Vellam)'),
    (r'\bgur\b',                                         'Jaggery (Vellam)'),

    # ── Vegetables ────────────────────────────────────────────────────────────
    (r'\bdrumstick\b',                                   'Drumstick (Murungakkai)'),
    (r'\bbrinjal\b(?!\s*\()',                             'Brinjal (Eggplant)'),
    (r'bitter\s+gourd',                                  'Bitter Gourd (Karela)'),
    (r'bottle\s+gourd',                                  'Bottle Gourd (Lauki)'),
    (r'ridge\s+gourd',                                   'Ridge Gourd (Turai)'),
    (r'snake\s+gourd',                                   'Snake Gourd'),
    (r'ash\s+gourd',                                     'Ash Gourd (Winter Melon)'),
    (r'broad\s+beans?',                                  'Broad Beans (Mochai)'),
    (r'cluster\s+beans?',                                'Cluster Beans (Guar)'),
    (r'raw\s+banana',                                    'Raw Banana (Vazhakkai)'),
    (r'\byam\b',                                         'Yam (Senai Kilangu)'),
    (r'\bcolocasia\b',                                   'Colocasia (Arbi)'),
    (r'\btaro\b',                                        'Colocasia (Arbi)'),

    # ── Dairy ─────────────────────────────────────────────────────────────────
    (r'\bpaneer\b',                                      'Paneer (Cottage Cheese)'),
    (r'\bghee\b(?!\s*\()',                               'Ghee (Clarified Butter)'),
    (r'khoa[y]?',                                        'Khoa (Dried Milk Solids)'),

    # ── Household / kitchen items ─────────────────────────────────────────────
    (r'\bmuram\b',                                       'Winnowing Tray (Muram)'),
    (r'\bwinning\s+tray\b',                              'Winnowing Tray (Muram)'),  # OCR misread
    (r'\bkolam\s+powder\b',                              'Kolam Powder (Rangoli)'),
    (r'\bsarakku\b',                                     'Groceries'),

    # ── Dry fruits ────────────────────────────────────────────────────────────
    (r'cashew\s*(?:nuts?)?',                             'Cashew Nuts'),
    (r'\balmonds?\b',                                    'Almonds (Badam)'),
    (r'\bbadam\b',                                       'Almonds (Badam)'),
    (r'\braisins?\b',                                    'Raisins (Kismis)'),
    (r'\bkismis\b',                                      'Raisins (Kismis)'),
]

# Pre-compile all patterns for speed
_COMPILED_NORMS = [(re.compile(p, re.IGNORECASE), r) for p, r in GROCERY_NORM]


def normalize_grocery(text: str) -> str:
    lines = text.splitlines()
    out = []
    for line in lines:
        for compiled, replacement in _COMPILED_NORMS:
            line = compiled.sub(replacement, line)
        out.append(line)
    return "\n".join(out)


# ── App ────────────────────────────────────────────────────────────────────────

app = FastAPI(title="Indian Language Translator")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


class TranslateRequest(BaseModel):
    text: str
    src_lang: str = ""


class TranslateResponse(BaseModel):
    translated: str
    src_lang: str
    skipped: bool = False


@app.get("/health")
def health():
    return {"status": "ok", "engine": "deep-translator/google+grocery-norm"}


@app.post("/translate", response_model=TranslateResponse)
def translate(req: TranslateRequest):
    from deep_translator import GoogleTranslator
    from langdetect import detect, LangDetectException

    text = req.text.strip()
    if not text:
        return TranslateResponse(translated="", src_lang="", skipped=True)

    src = req.src_lang or ""
    if not src:
        try:
            src = detect(text)
        except LangDetectException:
            src = "auto"

    if src == "en":
        return TranslateResponse(translated=normalize_grocery(text), src_lang="eng_Latn", skipped=True)

    lang_name = LANG_NAMES.get(src, src)
    logger.info(f"Translating from {lang_name} ({src}) → English")

    # Step 1: expand abbreviations (e.g. "து. பருப்பு" → "துவரம் பருப்பு")
    expanded = expand_abbreviations(text, src)

    # Step 2a: apply user dictionary (exact phrase → token)
    token_map: dict = {}
    dict_applied = apply_dictionary(expanded, src, token_map)

    # Step 2b: protect terms Google commonly mistranslates
    protected, protect_tokens = protect_terms(dict_applied, src)
    token_map.update(protect_tokens)

    try:
        translator = GoogleTranslator(source=src if src != "auto" else "auto", target="en")
        if len(protected) <= 4900:
            raw = translator.translate(protected)
        else:
            chunks = [protected[i:i+4900] for i in range(0, len(protected), 4900)]
            raw = "\n".join(translator.translate(c) for c in chunks)

        logger.info(f"Raw translation: {(raw or '')[:200]}")

        # Step 3: normalize grocery terms (tokens are still placeholders — safe)
        normalized = normalize_grocery(raw or protected)

        # Step 4: restore protected tokens (exact names, skip norm re-matching)
        translated = restore_terms(normalized, token_map)
        logger.info(f"After normalization: {translated[:200]}")

        return TranslateResponse(translated=translated, src_lang=src, skipped=False)

    except Exception as e:
        logger.error(f"Translation error: {e}")
        raise HTTPException(500, f"Translation failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
