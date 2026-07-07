FROM ollama/ollama:latest

# Install curl for health checks
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Write startup script using printf (Windows CRLF safe)
RUN printf '#!/bin/bash\n\
set -e\n\
export OLLAMA_HOST=0.0.0.0:11434\n\
export OLLAMA_MODELS=/data/.ollama/models\n\
mkdir -p "${OLLAMA_MODELS}"\n\
\n\
# Start Ollama in background\n\
ollama serve &\n\
OLLAMA_PID=$!\n\
\n\
# Wait for API to be ready\n\
echo "Waiting for Ollama..."\n\
until curl -sf http://localhost:11434/api/tags > /dev/null 2>&1; do\n\
    sleep 2\n\
done\n\
echo "Ollama is ready."\n\
\n\
# OCR is now handled by PaddleOCR service — llava removed\n\
\n\
# Pull Qwen 2.5 (translation: any language -> English)\n\
if ! ollama list | grep -q "qwen2.5"; then\n\
    echo "Pulling qwen2.5:7b..."\n\
    ollama pull qwen2.5:7b\n\
fi\n\
\n\
# x/flux2-klein requires Apple MLX and cannot run on Linux — removed\n\
\n\
echo "All models loaded. Serving..."\n\
wait $OLLAMA_PID\n' > /start-ollama.sh

RUN chmod +x /start-ollama.sh

EXPOSE 11434
ENTRYPOINT ["/start-ollama.sh"]