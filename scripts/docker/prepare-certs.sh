#!/bin/bash

# 预生成证书脚本 - 在构建 Docker 镜像前运行
# 这样可以避免在部署时生成证书

set -e

# 颜色定义
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

print_message() {
    echo -e "${2}${1}${NC}"
}

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
CERT_DIR="$SCRIPT_DIR/certs"

# 检查证书是否已存在
if [ -f "$CERT_DIR/portal.crt" ] && [ -f "$CERT_DIR/portal.key" ]; then
    print_message "证书已存在，跳过生成" "$GREEN"
    print_message "如需重新生成，请先删除 $CERT_DIR 目录" "$YELLOW"
    exit 0
fi

# 获取服务器 IP（可从环境变量或参数传入）
SERVER_IP="${1:-${SERVER_IP:-}}"

print_message "准备生成 SSL 证书..." "$YELLOW"

# 如果没有提供 IP，尝试获取本机 IP
if [ -z "$SERVER_IP" ]; then
    print_message "未提供服务器 IP，尝试自动检测..." "$YELLOW"
    
    # 尝试获取非 localhost 的 IP
    if command -v hostname >/dev/null 2>&1; then
        SERVER_IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    fi
    
    # 如果还是没有，使用默认值
    if [ -z "$SERVER_IP" ]; then
        SERVER_IP="192.168.1.100"
        print_message "无法自动检测 IP，使用默认值: $SERVER_IP" "$YELLOW"
    else
        print_message "检测到 IP: $SERVER_IP" "$GREEN"
    fi
fi

# 调用证书生成脚本
"$SCRIPT_DIR/generate-certs.sh" localhost 3650 "$SERVER_IP"

print_message "\n证书已准备就绪！" "$GREEN"
print_message "部署时将自动使用这些证书" "$GREEN"