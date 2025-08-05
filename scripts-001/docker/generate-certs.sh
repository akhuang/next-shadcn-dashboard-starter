#!/bin/bash

# 生成自签名 SSL 证书脚本
# 用于开发和测试环境

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

# 证书目录
CERT_DIR="$(dirname "$0")/certs"

# 创建证书目录
mkdir -p "$CERT_DIR"

# 证书信息
DOMAIN="${1:-localhost}"
DAYS="${2:-3650}"

print_message "生成自签名 SSL 证书..." "$YELLOW"
print_message "域名: $DOMAIN" "$YELLOW"
print_message "有效期: $DAYS 天" "$YELLOW"

# 生成私钥和证书
openssl req -x509 -nodes -days "$DAYS" \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/portal.key" \
    -out "$CERT_DIR/portal.crt" \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Dashboard/OU=IT/CN=$DOMAIN" \
    -addext "subjectAltName=DNS:$DOMAIN,DNS:*.$DOMAIN,IP:127.0.0.1"

# 设置权限
chmod 600 "$CERT_DIR/portal.key"
chmod 644 "$CERT_DIR/portal.crt"

print_message "✓ SSL 证书生成成功！" "$GREEN"
print_message "\n证书文件位置:" "$GREEN"
print_message "  - 证书: $CERT_DIR/portal.crt" "$GREEN"
print_message "  - 私钥: $CERT_DIR/portal.key" "$GREEN"

print_message "\n提示：" "$YELLOW"
print_message "1. 这是自签名证书，浏览器会显示安全警告" "$YELLOW"
print_message "2. 可以将 portal.crt 导入系统/浏览器信任的证书列表" "$YELLOW"
print_message "3. 生产环境建议使用正式的 SSL 证书" "$YELLOW"