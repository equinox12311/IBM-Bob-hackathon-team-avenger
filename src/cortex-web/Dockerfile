# cortex-web — React + Vite UI, served by nginx
# Multi-stage: build the SPA, then serve the static bundle.
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps
COPY package.json pnpm-lock.yaml* package-lock.json* ./
RUN if [ -f pnpm-lock.yaml ]; then \
      npm install -g pnpm && pnpm install --frozen-lockfile; \
    else \
      npm ci || npm install; \
    fi

# Build
COPY . .
RUN npm run build

# --- runtime stage ---
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

# Replace default nginx config to enable SPA fallback
RUN echo 'server { \
    listen 80; \
    root /usr/share/nginx/html; \
    location / { try_files $uri /index.html; } \
}' > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
