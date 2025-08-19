FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy application code
COPY . .

# Create directory for Excel files
RUN mkdir -p /data/excel-files

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "require('ioredis').createClient().ping().then(() => process.exit(0)).catch(() => process.exit(1))"

# Run as non-root user
USER node

# Start the service
CMD ["node", "index.js"]