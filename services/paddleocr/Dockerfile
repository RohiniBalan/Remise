FROM python:3.10-slim

WORKDIR /app

# System deps for PaddleOCR (OpenCV, libGL)
RUN apt-get update && apt-get install -y --no-install-recommends \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    libgl1 \
    libgomp1 \
    wget \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download PaddleOCR models at build time so the container starts fast
RUN python - <<'EOF'
from paddleocr import PaddleOCR
import logging
logging.disable(logging.CRITICAL)
for lang in ["en", "hi", "ta", "te", "ka", "ben"]:
    try:
        PaddleOCR(use_angle_cls=True, lang=lang, show_log=False, use_gpu=False)
        print(f"Downloaded model: {lang}")
    except Exception as e:
        print(f"Skipped {lang}: {e}")
EOF

COPY main.py .

EXPOSE 8100

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8100"]
