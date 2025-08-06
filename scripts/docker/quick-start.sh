#!/bin/bash
# 快速启动脚本 - 优化构建时间

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo -e "${BLUE}⚡ 快速启动 Docker 开发环境${NC}"
echo ""

# 1. 检查是否有现有镜像
if docker images | grep -q "nextjs-dashboard-app"; then
    echo -e "${GREEN}✓ 发现已有镜像，跳过构建${NC}"
    SKIP_BUILD=true
else
    echo -e "${YELLOW}ℹ 首次运行，需要构建镜像${NC}"
    SKIP_BUILD=false
fi

# 2. 使用开发配置文件
if [ "$1" == "--prod" ]; then
    echo -e "${BLUE}使用生产环境配置...${NC}"
    COMPOSE_FILE="docker-compose.yml"
else
    echo -e "${BLUE}使用开发环境配置（更快）...${NC}"
    COMPOSE_FILE="docker-compose.dev.yml"
fi

# 3. 启动服务
if [ "$SKIP_BUILD" == true ]; then
    # 直接启动，不重新构建
    docker-compose -f $COMPOSE_FILE up -d
else
    # 首次构建，使用缓存
    docker-compose -f $COMPOSE_FILE up -d --build
fi

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