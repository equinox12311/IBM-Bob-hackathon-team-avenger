# cortex-api — MCP server + REST/SSE API
# Listens on port 8080 (per submission spec).
FROM python:3.11-slim

WORKDIR /app

# System deps for sqlite-vec
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libsqlite3-dev \
 && rm -rf /var/lib/apt/lists/*

# Python deps
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# App source
COPY . .

# Persistent data directory (volume-mounted in compose)
RUN mkdir -p /app/data
VOLUME ["/app/data"]

EXPOSE 8080

# Replace with the real entrypoint when the API is implemented
CMD ["uvicorn", "cortex_api.server:app", "--host", "0.0.0.0", "--port", "8080"]
