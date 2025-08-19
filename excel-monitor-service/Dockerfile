FROM node:20-alpine

WORKDIR /app

# 设置构建参数（用于代理）
ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY

# Copy package files
COPY package*.json ./

# 配置 npm 代理并安装依赖
RUN if [ -n "$HTTP_PROXY" ]; then npm config set proxy $HTTP_PROXY; fi && \
    if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy $HTTPS_PROXY; fi && \
    npm config set strict-ssl false && \
    npm install && \
    npm config delete proxy && \
    npm config delete https-proxy && \
    npm config set strict-ssl true

# Copy application code
COPY . .

# Create directories for Excel files (contacts and navigation)
RUN mkdir -p /data/contacts /data/navigation && \
    chown -R node:node /data

# Run as non-root user
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "process.exit(0)"

# Start the enhanced service by default
CMD ["node", "index-enhanced.js"]