"""
OCR REST service using EasyOCR.
Reads text top-to-bottom (by bounding box position) so product name
(usually largest text at top) appears first in the output.
"""

import base64
import io
import logging

import numpy as np
import easyocr
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="OCR Service (EasyOCR)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Two readers cover all Indian scripts + English:
#   Reader A — English + Devanagari (Hindi, Marathi, Nepali)
#   Reader B — Dravidian + Bengali scripts (Tamil, Telugu, Kannada, Malayalam, Bengali)
# Running fewer readers = less noise, less duplication.
# ---------------------------------------------------------------------------
READER_CONFIGS = [
    ["en", "hi", "mr"],          # Latin + Devanagari
    ["en", "ta", "te", "kn"],    # Dravidian scripts
    ["en", "ml", "bn"],          # Malayalam + Bengali
]

_readers: list[tuple[list[str], easyocr.Reader]] = []


@app.on_event("startup")
def load_readers():
    for langs in READER_CONFIGS:
        try:
            logger.info(f"Loading EasyOCR reader: {langs}")
            reader = easyocr.Reader(langs, gpu=False, verbose=False)
            _readers.append((langs, reader))
            logger.info(f"Loaded: {langs}")
        except Exception as e:
            logger.warning(f"Could not load reader {langs}: {e}")


# ---------------------------------------------------------------------------
# Models
# ---------------------------------------------------------------------------
class OCRRequest(BaseModel):
    image: str                          # plain base64, no data-URI prefix
    languages: Optional[list[str]] = None


class OCRResponse(BaseModel):
    text: str                           # lines joined, top-to-bottom order
    lines: list[str]
    engines_used: list[str]


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def base64_to_numpy(b64: str) -> np.ndarray:
    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    return np.array(img)


def top_y(bbox) -> float:
    """Return the average top-Y of a bounding box [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]."""
    try:
        return float(min(pt[1] for pt in bbox))
    except Exception:
        return 0.0


def run_reader(langs: list[str], reader: easyocr.Reader, img_np: np.ndarray) -> list[str]:
    """Run one reader and return text lines sorted top-to-bottom."""
    try:
        results = reader.readtext(img_np, detail=1, paragraph=False)
        # Sort by top-Y position so product name (top of label) comes first
        results_sorted = sorted(results, key=lambda r: top_y(r[0]))
        lines = []
        for (bbox, text, conf) in results_sorted:
            text = text.strip()
            if text and conf > 0.35:          # slightly permissive threshold
                lines.append(text)
        return lines
    except Exception as e:
        logger.warning(f"Reader {langs} error: {e}")
        return []


def deduplicate(all_results: list[tuple[list[str], list[str]]]) -> list[str]:
    """
    Merge results from multiple readers.
    Keep insertion order (first reader = en+hi = most reliable for English text).
    Skip a line if it is already covered by a previously added line (case-insensitive).
    """
    seen: set[str] = set()
    merged: list[str] = []
    for (_langs, lines) in all_results:
        for line in lines:
            key = line.lower().strip()
            if key and key not in seen:
                seen.add(key)
                merged.append(line)
    return merged


# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
@app.get("/health")
def health():
    return {
        "status": "ok",
        "readers": [langs for langs, _ in _readers],
    }


@app.post("/ocr", response_model=OCRResponse)
def ocr(req: OCRRequest):
    try:
        img_np = base64_to_numpy(req.image)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid image: {e}")

    all_results: list[tuple[list[str], list[str]]] = []
    engines_used: list[str] = []

    for (langs, reader) in _readers:
        lines = run_reader(langs, reader, img_np)
        all_results.append((langs, lines))
        if lines:
            engines_used.append("+".join(langs))

    merged = deduplicate(all_results)

    if not merged:
        raise HTTPException(status_code=422, detail="No text detected in image")

    logger.info(f"OCR result ({len(merged)} lines): {merged[:5]}")

    return OCRResponse(
        text="\n".join(merged),
        lines=merged,
        engines_used=engines_used,
    )
