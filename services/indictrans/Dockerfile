FROM python:3.11-slim AS base

WORKDIR /app
COPY requirements.txt ./
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    libgl1 \
    libglib2.0-0 \
    libsm6 \
    libxrender1 \
    libxext6 \
    && rm -rf /var/lib/apt/lists/* \
    && python -m pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8400
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8400"]
