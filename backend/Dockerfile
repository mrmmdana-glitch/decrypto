FROM python:3.11-slim

WORKDIR /app

# Build context is backend/ — all paths are relative to it
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

# Exec+shell form: guarantees $PORT expands at runtime
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
