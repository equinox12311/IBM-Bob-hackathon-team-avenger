# cortex-bot — Telegram bot (text + voice capture)
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Bot is long-running; no port to expose (uses Telegram polling or webhook)
CMD ["python", "-m", "cortex_bot"]
