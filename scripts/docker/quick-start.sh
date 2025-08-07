#!/bin/bash
# 快速启动脚本 - 优化构建时间

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}⚡ 快速启动 Docker 开发环境${NC}"
echo ""

# 检查并创建必要文件
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}创建 .env 文件...${NC}"
    # 复制项目根目录的 .env 文件
    if [ -f "../../.env" ]; then
        cp ../../.env .env
        echo -e "${GREEN}✓ 复制项目 .env 文件${NC}"
    else
        cat > .env << 'EOF'
# Docker 环境配置
NODE_ENV=development
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_APP_URL=https://localhost:8443
DATABASE_URL=
HTTP_PORT=8088
HTTPS_PORT=8443
EOF
    fi
fi

# 检查并生成SSL证书
if [ ! -f "certs/portal.crt" ] || [ ! -f "certs/portal.key" ]; then
    echo -e "${YELLOW}生成自签名SSL证书...${NC}"
    ./generate-certs.sh
fi

# 使用配置文件
if [ "$1" == "--prod" ]; then
    echo -e "${BLUE}使用生产环境配置...${NC}"
    COMPOSE_FILE="docker-compose.yml"
else
    echo -e "${BLUE}使用开发环境配置${NC}"
    COMPOSE_FILE="docker-compose.dev.yml"
fi

# 启动服务
echo -e "${BLUE}构建并启动服务...${NC}"
docker-compose -f $COMPOSE_FILE up -d --build

# 4. 等待服务就绪
echo -e "${BLUE}等待服务启动...${NC}"
sleep 5

# 5. 检查状态
docker-compose -f $COMPOSE_FILE ps

echo ""
echo -e "${GREEN}✅ 服务已启动！${NC}"
echo -e "${BLUE}访问地址:${NC}"
echo "  HTTP:  http://localhost:8088"
echo "  HTTPS: https://localhost:8443"
echo ""
echo -e "${YELLOW}提示:${NC}"
echo "  - 查看日志: docker-compose -f $COMPOSE_FILE logs -f"
echo "  - 停止服务: docker-compose -f $COMPOSE_FILE down"
echo "  - 重载Nginx: ../deploy.sh --reload-nginx"