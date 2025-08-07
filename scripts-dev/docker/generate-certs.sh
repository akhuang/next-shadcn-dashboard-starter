#!/bin/bash

# 生成自签名 SSL 证书脚本
# 用于开发和测试环境，支持 IP 地址访问

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
SERVER_IP="${3:-}"  # 可选的服务器 IP

print_message "生成自签名 SSL 证书..." "$YELLOW"
print_message "域名: $DOMAIN" "$YELLOW"
print_message "有效期: $DAYS 天" "$YELLOW"

# 构建 SAN (Subject Alternative Names)
SAN="DNS:$DOMAIN,DNS:*.$DOMAIN,IP:127.0.0.1,IP:::1"

# 自动检测可能的 IP 地址
detected_ips=""

# 尝试获取本机所有非 localhost 的 IP
if command -v ip >/dev/null 2>&1; then
    # Linux 系统
    detected_ips=$(ip -4 addr show | grep -oP '(?<=inet\s)\d+(\.\d+){3}' | grep -v '127.0.0.1' | head -5)
elif command -v ifconfig >/dev/null 2>&1; then
    # macOS 或其他 Unix 系统
    detected_ips=$(ifconfig | grep 'inet ' | awk '{print $2}' | grep -v '127.0.0.1' | head -5)
fi

# 添加检测到的 IP
for ip in $detected_ips; do
    if [ -n "$ip" ]; then
        SAN="$SAN,IP:$ip"
        print_message "检测到 IP: $ip" "$GREEN"
    fi
done

# 如果提供了额外的服务器 IP，也添加进去
if [ -n "$SERVER_IP" ]; then
    SAN="$SAN,IP:$SERVER_IP"
    print_message "指定的服务器 IP: $SERVER_IP" "$YELLOW"
fi

# 添加常见的内网 IP 段（可选）
# 这样即使 IP 变化也能工作
SAN="$SAN,IP:192.168.1.1,IP:192.168.1.100,IP:192.168.0.1,IP:192.168.0.100,IP:10.0.0.1,IP:10.0.0.100,IP:172.17.0.1"

# 生成私钥和证书
openssl req -x509 -nodes -days "$DAYS" \
    -newkey rsa:2048 \
    -keyout "$CERT_DIR/portal.key" \
    -out "$CERT_DIR/portal.crt" \
    -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Dashboard/OU=IT/CN=$DOMAIN" \
    -addext "subjectAltName=$SAN"

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