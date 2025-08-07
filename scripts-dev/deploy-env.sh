#!/bin/bash

# 开发环境部署脚本 - Next.js Dashboard with Nginx
# 使用方法: ./deploy-env.sh [选项]

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

# 默认配置
COMPOSE_FILE="docker-compose.yml"
COMPOSE_PROJECT="nextjs-dashboard-dev"

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
    echo "  -s, --status        查看容器状态"
    echo "  -c, --clean         清理未使用的镜像和容器"
    echo "  --reload-nginx      重新加载 Nginx 配置"
    echo ""
    echo "示例:"
    echo "  $0 -b -u            构建并启动"
    echo "  $0 -s               查看状态"
    echo ""
    echo "端口分配:"
    echo "  开发环境: HTTP=8089, HTTPS=8445"
}

# 设置环境
set_environment() {
    load_env_file ".env.dev"
    setup_proxy_vars
    export DEV_HTTP_PORT=${DEV_HTTP_PORT:-8089}
    export DEV_HTTPS_PORT=${DEV_HTTPS_PORT:-8445}
    export DEV_SERVER_PORT=${DEV_SERVER_PORT:-3000}
    print_message "🔧 使用开发环境配置 (端口: $DEV_HTTP_PORT/$DEV_HTTPS_PORT)" "$BLUE"
}

# 检查是否有 docker 子目录
if [ -d "$SCRIPT_DIR/docker" ]; then
    cd "$SCRIPT_DIR/docker" || exit 1
else
    print_message "错误: 找不到 docker 目录" "$RED"
    exit 1
fi

# 函数：加载指定的环境变量文件
load_env_file() {
    local env_file="$1"
    if [ -f "$env_file" ]; then
        echo "加载环境变量文件: $env_file"
        set -a
        source <(grep -v '^#' "$env_file" | grep '=' | sed 's/#.*$//')
        set +a
    else
        echo "警告: 环境变量文件不存在: $env_file"
    fi
}

# 函数：处理代理环境变量（在加载环境文件后调用）
setup_proxy_vars() {
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
}

# 检查 Docker 和 Docker Compose
check_requirements() {
    if ! command -v docker &> /dev/null; then
        print_message "错误: Docker 未安装" "$RED"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_message "错误: Docker Compose 未安装" "$RED"
        exit 1
    fi
}

# 准备证书
prepare_certs() {
    if [ ! -d "./certs" ]; then
        mkdir -p ./certs
    fi
    
    if [ ! -f "./certs/portal.crt" ] || [ ! -f "./certs/portal.key" ]; then
        print_message "生成自签名 SSL 证书..." "$YELLOW"
        if [ -f "./generate-certs.sh" ]; then
            bash ./generate-certs.sh
        else
            openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
                -keyout ./certs/portal.key \
                -out ./certs/portal.crt \
                -subj "/C=CN/ST=Shanghai/L=Shanghai/O=Dashboard/OU=IT/CN=localhost"
        fi
        print_message "✓ SSL 证书已生成" "$GREEN"
    fi
}

# 构建镜像
build_images() {
    print_message "🔨 构建 Docker 镜像 (开发环境)..." "$BLUE"
    
    prepare_certs
    
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" build
    print_message "✓ Docker 镜像构建完成" "$GREEN"
}

# 启动容器
start_containers() {
    print_message "🚀 启动容器 (开发环境)..." "$BLUE"
    
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" up -d
    print_message "✓ 容器启动完成" "$GREEN"
    
    # 显示访问信息
    print_message "\n📌 开发环境访问地址:" "$GREEN"
    print_message "   HTTP:  http://localhost:$DEV_HTTP_PORT" "$YELLOW"
    print_message "   HTTPS: https://localhost:$DEV_HTTPS_PORT" "$YELLOW"
}

# 停止容器
stop_containers() {
    print_message "⏹️ 停止容器 (开发环境)..." "$BLUE"
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" down
    print_message "✓ 容器已停止" "$GREEN"
}

# 重启容器
restart_containers() {
    print_message "🔄 重启容器 (开发环境)..." "$BLUE"
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" restart
    print_message "✓ 容器已重启" "$GREEN"
}

# 查看日志
show_logs() {
    if [ -z "$1" ]; then
        docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" logs -f
    else
        docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" logs -f "$1"
    fi
}

# 重新加载 Nginx 配置
reload_nginx() {
    print_message "🔄 重新加载 Nginx 配置 (开发环境)..." "$BLUE"
    
    container_name="nextjs-dashboard-nginx-dev"
    
    if ! docker ps | grep -q "$container_name"; then
        print_message "⚠️  Nginx 容器未运行" "$YELLOW"
        return 1
    fi
    
    docker exec "$container_name" nginx -s reload
    print_message "✅ Nginx 配置已重新加载" "$GREEN"
}

# 清理
cleanup() {
    print_message "🧹 清理未使用的资源..." "$BLUE"
    
    # 清理悬空镜像
    print_message "  清理悬空镜像..." "$YELLOW"
    docker image prune -f
    
    # 清理未使用的容器
    print_message "  清理停止的容器..." "$YELLOW"
    docker container prune -f
    
    # 清理未使用的网络
    print_message "  清理未使用的网络..." "$YELLOW"
    docker network prune -f
    
    # 清理未使用的卷（谨慎使用）
    # docker volume prune -f
    
    # 显示清理结果
    print_message "✓ 清理完成" "$GREEN"
    
    # 显示剩余镜像
    print_message "\n📦 剩余 Docker 镜像:" "$BLUE"
    docker images | grep -E "nextjs|REPOSITORY" || true
}

# 显示状态
show_status() {
    print_message "\n📊 开发环境状态" "$BLUE"
    print_message "==================" "$BLUE"
    
    print_message "\n📦 容器状态:" "$BLUE"
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps
    
    print_message "\n🏥 健康检查状态:" "$BLUE"
    docker-compose -p "$COMPOSE_PROJECT" -f "$COMPOSE_FILE" ps --format "table {{.Name}}\t{{.Status}}"
    
    print_message "\n📌 开发环境访问地址:" "$GREEN"
    print_message "   HTTP:  http://localhost:$DEV_HTTP_PORT" "$YELLOW"
    print_message "   HTTPS: https://localhost:$DEV_HTTPS_PORT" "$YELLOW"
}

# 主程序
main() {
    check_requirements
    set_environment
    
    # 如果没有参数，显示状态
    if [ $# -eq 0 ]; then
        show_status
        exit 0
    fi
    
    # 处理选项
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -b|--build)
                build_images
                shift
                ;;
            -u|--up)
                start_containers
                shift
                ;;
            -d|--down)
                stop_containers
                shift
                ;;
            -r|--restart)
                restart_containers
                shift
                ;;
            -l|--logs)
                shift
                show_logs "$1"
                exit 0
                ;;
            -s|--status)
                show_status
                shift
                ;;
            -c|--clean)
                cleanup
                shift
                ;;
            --reload-nginx)
                reload_nginx
                shift
                ;;
            *)
                print_message "未知选项: $1" "$RED"
                show_help
                exit 1
                ;;
        esac
    done
}

# 运行主程序
main "$@"