#!/bin/bash
# Nginx Template 重新加载脚本
# 解决修改 template 后需要强制重新渲染配置文件的问题

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="${SCRIPT_DIR}/docker-compose.yml"

echo "🔄 重新加载 Nginx 模板配置..."

# 检查 docker-compose 文件是否存在
if [[ ! -f "$COMPOSE_FILE" ]]; then
    echo "❌ Docker Compose 文件不存在: $COMPOSE_FILE"
    exit 1
fi

# 检查容器是否正在运行
if ! docker-compose -f "$COMPOSE_FILE" ps nginx | grep -q "Up"; then
    echo "⚠️  Nginx 容器未运行，正在启动..."
    docker-compose -f "$COMPOSE_FILE" up -d nginx
    exit 0
fi

echo "1️⃣ 删除已渲染的配置文件..."
docker-compose -f "$COMPOSE_FILE" exec nginx rm -f /etc/nginx/conf.d/default.conf

echo "2️⃣ 重新渲染模板..."
docker-compose -f "$COMPOSE_FILE" exec nginx /docker-entrypoint.d/20-envsubst-on-templates.sh

echo "3️⃣ 测试新配置..."
if docker-compose -f "$COMPOSE_FILE" exec nginx nginx -t; then
    echo "✅ 配置文件语法正确"
else
    echo "❌ 配置文件语法错误，请检查模板"
    exit 1
fi

echo "4️⃣ 重新加载 Nginx..."
docker-compose -f "$COMPOSE_FILE" exec nginx nginx -s reload

echo "✅ Nginx 配置重新加载完成！"

# 可选：显示当前活动的配置
echo ""
echo "📋 当前活动的 Nginx 配置预览："
docker-compose -f "$COMPOSE_FILE" exec nginx head -20 /etc/nginx/conf.d/default.conf