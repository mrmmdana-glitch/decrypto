FROM python:3.11-slim

WORKDIR /app

# Install dependencies first (cached layer)
# Paths are relative to the repo root (Railway build context)
COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ .

EXPOSE 8000

# Shell form so Railway's $PORT env var is expanded at runtime
CMD uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}
