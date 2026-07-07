"""
Self-hosted FLUX.1 Schnell image generation service.
Runs on CUDA (NVIDIA GPU) with automatic CPU offload for lower VRAM cards.
First startup downloads ~24GB model — subsequent starts load from E:/hf_cache.
"""

import base64
import io
import logging
import os
from contextlib import asynccontextmanager

import torch
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from PIL import Image
from diffusers import FluxPipeline

# Redirect HuggingFace cache to E drive before any model downloads
os.environ.setdefault("HF_HOME", r"E:\hf_cache")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

HF_TOKEN = os.getenv("HF_TOKEN", "")
MODEL_ID = "black-forest-labs/FLUX.1-schnell"
PORT     = int(os.getenv("PORT", "8300"))

_pipe: FluxPipeline | None = None


def get_vram_gb() -> float:
    if torch.cuda.is_available():
        return torch.cuda.get_device_properties(0).total_memory / (1024 ** 3)
    return 0.0


@asynccontextmanager
async def lifespan(app: FastAPI):
    global _pipe
    if not HF_TOKEN:
        raise RuntimeError("HF_TOKEN env var is required — set it before starting")

    vram = get_vram_gb()
    logger.info(f"CUDA: {torch.cuda.is_available()}, VRAM: {vram:.1f}GB")
    logger.info(f"Loading {MODEL_ID}…")

    _pipe = FluxPipeline.from_pretrained(MODEL_ID, torch_dtype=torch.bfloat16, token=HF_TOKEN)

    if vram >= 10:
        logger.info("Running fully on GPU")
        _pipe = _pipe.to("cuda")
    else:
        logger.info("Low VRAM — enabling CPU offload")
        _pipe.enable_model_cpu_offload()

    logger.info("FLUX.1 Schnell ready.")
    yield
    # cleanup on shutdown
    _pipe = None


app = FastAPI(title="FLUX.1 Schnell", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class GenerateRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    num_inference_steps: int = 4
    guidance_scale: float = 0.0


class GenerateResponse(BaseModel):
    image: str
    mime_type: str


@app.get("/health")
def health():
    return {
        "status": "ok" if _pipe is not None else "loading",
        "cuda": torch.cuda.is_available(),
        "vram_gb": round(get_vram_gb(), 1),
        "model": MODEL_ID,
    }


@app.post("/generate", response_model=GenerateResponse)
def generate(req: GenerateRequest):
    if _pipe is None:
        raise HTTPException(status_code=503, detail="Model not loaded")

    logger.info(f"Generating: {req.prompt[:80]}…")
    with torch.inference_mode():
        result = _pipe(
            prompt=req.prompt,
            width=req.width,
            height=req.height,
            num_inference_steps=req.num_inference_steps,
            guidance_scale=req.guidance_scale,
            output_type="pil",
        )

    buf = io.BytesIO()
    result.images[0].save(buf, format="PNG")
    b64 = base64.b64encode(buf.getvalue()).decode()
    logger.info("Image generated successfully")
    return GenerateResponse(image=b64, mime_type="image/png")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=PORT, reload=False)
