#!/bin/bash

# 部署脚本 - Next.js Dashboard with Nginx
# 使用方法: ./deploy.sh [选项]

# 切换到脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 检查是否有 docker 子目录，如果有就进入
if [ -d "$SCRIPT_DIR/docker" ] && [ -f "$SCRIPT_DIR/docker/docker-compose.yml" ]; then
    cd "$SCRIPT_DIR/docker" || exit 1
elif [ -f "$SCRIPT_DIR/docker-compose.yml" ]; then
    cd "$SCRIPT_DIR" || exit 1
else
    echo "错误: 找不到 docker-compose.yml 文件"
    exit 1
fi

# 加载环境变量
if [ -f ".env" ]; then
    # 只加载非注释行且包含等号的行
    set -a
    source <(grep -v '^#' .env | grep '=' | sed 's/#.*$//')
    set +a
fi

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_message() {
    echo -e "${2}${1}${NC}"
}

# 设置默认值
export HTTP_PORT=${HTTP_PORT:-8088}
export HTTPS_PORT=${HTTPS_PORT:-8443}
export COMPOSE_PROJECT_NAME=${COMPOSE_PROJECT_NAME:-nextjs-dashboard}

# 传递代理环境变量（如果存在，支持大小写）
if [ -n "$HTTP_PROXY" ] || [ -n "$http_proxy" ]; then
    export HTTP_PROXY="${HTTP_PROXY:-$http_proxy}"
    export http_proxy="${http_proxy:-$HTTP_PROXY}"
    print_message "检测到 HTTP 代理: $HTTP_PROXY" "$YELLOW"
fi
if [ -n "$HTTPS_PROXY" ] || [ -n "$https_proxy" ]; then
    export HTTPS_PROXY="${HTTPS_PROXY:-$https_proxy}"
    export https_proxy="${https_proxy:-$HTTPS_PROXY}"
    print_message "检测到 HTTPS 代理: $HTTPS_PROXY" "$YELLOW"
fi
if [ -n "$NO_PROXY" ] || [ -n "$no_proxy" ]; then
    export NO_PROXY="${NO_PROXY:-$no_proxy}"
    export no_proxy="${no_proxy:-$NO_PROXY}"
fi

set -e

# 显示帮助信息
show_help() {
    echo "使用方法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -b, --build         构建 Docker 镜像"
    echo "  -u, --up            启动容器"
    echo "  -d, --down          停止容器"
    echo "  -r, --restart       重启容器"
    echo "  -l, --logs          查看日志"
    echo "  -c, --clean         清理未使用的镜像和容器"
    echo "  -s, --status        查看容器状态"
    echo "  --build-only        仅构建镜像，不启动容器"
    echo "  --production        使用生产环境配置"
    echo ""
    echo "示例:"
    echo "  $0 -b -u            构建并启动"
    echo "  $0 -r               重启所有服务"
    echo "  $0 -l app           查看应用日志"
}

# 检查 Docker 和 Docker Compose
check_requirements() {
    print_message "检查系统要求..." "$BLUE"
    
    if ! command -v docker &> /dev/null; then
        print_message "错误: Docker 未安装" "$RED"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message "错误: Docker Compose 未安装" "$RED"
        exit 1
    fi
    
    print_message "✓ Docker 和 Docker Compose 已安装" "$GREEN"
}

# 检查环境配置文件
check_env() {
    if [ "$PRODUCTION" = true ]; then
        if [ ! -f ".env.production" ]; then
            print_message "警告: .env.production 文件不存在" "$YELLOW"
            print_message "从 env.example.txt 创建 .env.production" "$YELLOW"
            cp env.example.txt .env.production
            print_message "请编辑 .env.production 文件配置环境变量" "$YELLOW"
            exit 1
        fi
    fi
}

# 构建 Docker 镜像
build_images() {
    print_message "开始构建 Docker 镜像..." "$BLUE"
    
    # 检查 Next.js 配置是否支持 standalone 输出
    if grep -q "output: 'standalone'" ../../next.config.ts 2>/dev/null; then
        print_message "✓ Next.js 已配置为 standalone 输出模式" "$GREEN"
    else
        print_message "警告: next.config.ts 未配置 standalone 输出，Docker 构建可能失败" "$YELLOW"
    fi
    
    docker-compose -f docker-compose.yml build --no-cache
    print_message "✓ Docker 镜像构建完成" "$GREEN"
}

# 启动容器
start_containers() {
    print_message "启动容器..." "$BLUE"
    
    # 确保环境变量被正确加载
    source .env 2>/dev/null || true
    
    docker-compose -f docker-compose.yml up -d
    print_message "✓ 容器启动完成" "$GREEN"
    
    print_message "\n等待服务就绪..." "$BLUE"
    sleep 3
    
    # 检查健康状态
    check_health
}

# 停止容器
stop_containers() {
    print_message "停止容器..." "$BLUE"
    docker-compose -f docker-compose.yml down
    print_message "✓ 容器已停止" "$GREEN"
}

# 重启容器
restart_containers() {
    stop_containers
    start_containers
}

# 查看日志
show_logs() {
    if [ -z "$1" ]; then
        docker-compose -f docker-compose.yml logs -f
    else
        docker-compose -f docker-compose.yml logs -f "$1"
    fi
}

# 清理未使用的资源
clean_up() {
    print_message "清理未使用的 Docker 资源..." "$BLUE"
    docker system prune -af --volumes
    print_message "✓ 清理完成" "$GREEN"
}

# 检查服务健康状态
check_health() {
    print_message "\n检查服务状态..." "$BLUE"
    
    # 等待服务启动
    local max_attempts=10
    local attempt=0
    local app_healthy=false
    local nginx_healthy=false
    
    # 检查容器运行状态
    print_message "检查容器状态..." "$YELLOW"
    docker-compose -f docker-compose.yml ps
    
    # 检查 Next.js 应用（通过容器内部网络）
    print_message "\n检查 Next.js 应用..." "$YELLOW"
    while [ $attempt -lt $max_attempts ] && [ "$app_healthy" = false ]; do
        # 尝试直接访问容器 (使用 curl)
        if docker-compose -f docker-compose.yml exec -T app curl -f --connect-timeout 5 --max-time 5 http://localhost:3000/api/health 2>/dev/null; then
            app_healthy=true
            print_message "✓ Next.js 应用运行正常" "$GREEN"
        else
            attempt=$((attempt + 1))
            if [ $attempt -lt $max_attempts ]; then
                print_message "  等待 Next.js 启动... ($attempt/$max_attempts)" "$YELLOW"
                sleep 3
            fi
        fi
    done
    
    if [ "$app_healthy" = false ]; then
        print_message "✗ Next.js 应用无响应" "$RED"
        print_message "  提示: 请检查应用日志 (./deploy.sh -l app)" "$YELLOW"
    fi
    
    # 检查 Nginx
    print_message "\n检查 Nginx 服务..." "$YELLOW"
    attempt=0
    while [ $attempt -lt $max_attempts ] && [ "$nginx_healthy" = false ]; do
        # 使用更宽松的超时设置
        if curl --connect-timeout 5 --max-time 10 -sf http://localhost:${HTTP_PORT}/health > /dev/null 2>&1; then
            nginx_healthy=true
            print_message "✓ Nginx 运行正常 (端口: ${HTTP_PORT})" "$GREEN"
        else
            attempt=$((attempt + 1))
            if [ $attempt -lt $max_attempts ]; then
                print_message "  等待 Nginx 启动... ($attempt/$max_attempts)" "$YELLOW"
                sleep 2
            fi
        fi
    done
    
    if [ "$nginx_healthy" = false ]; then
        print_message "✗ Nginx 无响应 (端口: ${HTTP_PORT})" "$RED"
        print_message "  提示: 请检查 Nginx 日志 (./deploy.sh -l nginx)" "$YELLOW"
        # 尝试检查端口是否被占用
        if lsof -i:${HTTP_PORT} > /dev/null 2>&1; then
            print_message "  注意: 端口 ${HTTP_PORT} 已被占用" "$YELLOW"
        fi
    fi
    
    # 显示访问信息
    if [ "$nginx_healthy" = true ]; then
        print_message "\n✅ 服务已就绪!" "$GREEN"
        print_message "本地访问: http://localhost:${HTTP_PORT}" "$GREEN"
        
        # 获取各种可能的 IP 地址（特别适配 VMware NAT 环境）
        local vm_ip=$(hostname -I 2>/dev/null | awk '{print $1}')
        local eth0_ip=$(ip addr show eth0 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
        local ens33_ip=$(ip addr show ens33 2>/dev/null | grep 'inet ' | awk '{print $2}' | cut -d/ -f1)
        
        # 显示可用的访问地址
        if [ ! -z "$vm_ip" ]; then
            print_message "虚拟机访问: http://${vm_ip}:${HTTP_PORT}" "$GREEN"
        fi
        if [ ! -z "$eth0_ip" ] && [ "$eth0_ip" != "$vm_ip" ]; then
            print_message "网络访问 (eth0): http://${eth0_ip}:${HTTP_PORT}" "$GREEN"
        fi
        if [ ! -z "$ens33_ip" ] && [ "$ens33_ip" != "$vm_ip" ]; then
            print_message "网络访问 (ens33): http://${ens33_ip}:${HTTP_PORT}" "$GREEN"
        fi
        
        print_message "\n💡 VMware NAT 网络提示:" "$YELLOW"
        print_message "  - 确保 VMware 中端口转发已配置（Virtual Network Editor）" "$YELLOW"
        print_message "  - 检查 Ubuntu 防火墙设置: sudo ufw status" "$YELLOW"
        print_message "  - 如需从主机访问，使用虚拟机的 NAT IP 地址" "$YELLOW"
    else
        print_message "\n⚠️  服务可能未完全就绪，请检查日志" "$YELLOW"
    fi
}

# 显示容器状态
show_status() {
    print_message "========================================" "$BLUE"
    print_message "         部署状态检查" "$BLUE"
    print_message "========================================" "$BLUE"
    
    # 显示容器状态
    print_message "\n📦 容器状态:" "$BLUE"
    docker-compose -f docker-compose.yml ps
    
    # 显示容器健康状态
    print_message "\n🏥 健康检查状态:" "$BLUE"
    docker-compose -f docker-compose.yml ps --format "table {{.Name}}\t{{.Status}}"
    
    # 检查服务健康
    check_health
    
    # 显示资源使用情况
    print_message "\n📊 资源使用:" "$BLUE"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" nextjs-dashboard-app nextjs-dashboard-nginx 2>/dev/null || true
    
    # 显示最近的日志
    print_message "\n📝 最近日志 (最后5行):" "$BLUE"
    print_message "--- Next.js App ---" "$YELLOW"
    docker-compose -f docker-compose.yml logs --tail=5 app 2>/dev/null || true
    print_message "--- Nginx ---" "$YELLOW"
    docker-compose -f docker-compose.yml logs --tail=5 nginx 2>/dev/null || true
}

# 主程序
main() {
    # 默认值
    BUILD=false
    UP=false
    DOWN=false
    RESTART=false
    LOGS=false
    CLEAN=false
    STATUS=false
    BUILD_ONLY=false
    PRODUCTION=false
    LOG_SERVICE=""
    
    # 解析参数
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--build)
                BUILD=true
                shift
                ;;
            -u|--up)
                UP=true
                shift
                ;;
            -d|--down)
                DOWN=true
                shift
                ;;
            -r|--restart)
                RESTART=true
                shift
                ;;
            -l|--logs)
                LOGS=true
                if [[ $# -gt 1 && ! "$2" =~ ^- ]]; then
                    LOG_SERVICE=$2
                    shift
                fi
                shift
                ;;
            -c|--clean)
                CLEAN=true
                shift
                ;;
            -s|--status)
                STATUS=true
                shift
                ;;
            --build-only)
                BUILD_ONLY=true
                BUILD=true
                shift
                ;;
            --production)
                PRODUCTION=true
                shift
                ;;
            *)
                print_message "未知选项: $1" "$RED"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 检查系统要求
    check_requirements
    
    # 检查环境配置
    check_env
    
    # 执行操作
    if [ "$BUILD" = true ]; then
        build_images
        if [ "$BUILD_ONLY" = true ]; then
            exit 0
        fi
    fi
    
    if [ "$UP" = true ]; then
        start_containers
    fi
    
    if [ "$DOWN" = true ]; then
        stop_containers
    fi
    
    if [ "$RESTART" = true ]; then
        restart_containers
    fi
    
    if [ "$LOGS" = true ]; then
        show_logs "$LOG_SERVICE"
    fi
    
    if [ "$CLEAN" = true ]; then
        clean_up
    fi
    
    if [ "$STATUS" = true ]; then
        show_status
    fi
    
    # 如果没有指定任何操作，显示帮助
    if [ "$BUILD" = false ] && [ "$UP" = false ] && [ "$DOWN" = false ] && \
       [ "$RESTART" = false ] && [ "$LOGS" = false ] && [ "$CLEAN" = false ] && \
       [ "$STATUS" = false ]; then
        show_help
    fi
}

# 运行主程序
main "$@"