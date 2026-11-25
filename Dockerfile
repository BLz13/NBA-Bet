# Multi-stage build: Node for frontend, Python for proxy
# Stage 1: Build frontend with Node
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Python runtime with built frontend
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy Python proxy server
COPY proxy_server.py .

# Use gunicorn directly as entrypoint (production-ready)
# Single sync worker, timeout=60s, binds to PORT env var on IPv6 (dual-stack = IPv4 + IPv6)
# Using shell form for PORT env var expansion
CMD gunicorn --bind [::]:${PORT:-3001} --workers 1 --worker-class sync --timeout 60 --access-logfile - --log-level debug proxy_server:app