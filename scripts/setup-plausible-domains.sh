#!/bin/bash

# 添加常见的开发域名到 Plausible

DOMAINS=(
  "localhost"
  "localhost:3000"
  "localhost:3001"
  "localhost:3002"
  "127.0.0.1:3000"
  "127.0.0.1:3001"
  "127.0.0.1:3002"
)

USER_EMAIL="admin@example.com"

echo "Setting up Plausible domains..."

for domain in "${DOMAINS[@]}"; do
  echo "Adding domain: $domain"
  ./scripts/docker/add-site.sh "$domain" "$USER_EMAIL" 2>/dev/null || true
done

echo "Done! All development domains have been added."