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

# Install system dependencies for nba-api
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy Python requirements and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy built frontend from stage 1
COPY --from=frontend-builder /app/dist ./dist

# Copy Python proxy server
COPY proxy-server.py .

# Expose port (Railway sets PORT env var)
EXPOSE 3001

# Run the proxy server (uses PORT env var from Railway)
CMD ["python", "proxy-server.py"]