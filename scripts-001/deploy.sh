#!/bin/bash

# 部署脚本 - Next.js Dashboard with Nginx
# 使用方法: ./scripts/deploy.sh [选项]

# 切换到脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/docker" || exit 1

# 测试用：设置容器名称前缀
export COMPOSE_PROJECT_NAME="test001"

set -e

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
    
    # 更新 Next.js 配置以支持 standalone 输出
    if ! grep -q "output: 'standalone'" next.config.ts; then
        print_message "更新 next.config.ts 配置..." "$YELLOW"
        # 这里需要手动更新 next.config.ts
    fi
    
    docker-compose -f docker-compose.yml build --no-cache
    print_message "✓ Docker 镜像构建完成" "$GREEN"
}

# 启动容器
start_containers() {
    print_message "启动容器..." "$BLUE"
    docker-compose -f docker-compose.yml up -d
    print_message "✓ 容器启动完成" "$GREEN"
    
    print_message "\n等待服务就绪..." "$BLUE"
    sleep 5
    
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
    
    # 检查 Next.js 应用
    if curl -sf http://localhost:3000 > /dev/null; then
        print_message "✓ Next.js 应用运行正常" "$GREEN"
    else
        print_message "✗ Next.js 应用无响应" "$RED"
    fi
    
    # 检查 Nginx
    if curl -sf http://localhost/health > /dev/null; then
        print_message "✓ Nginx 运行正常" "$GREEN"
    else
        print_message "✗ Nginx 无响应" "$RED"
    fi
    
    print_message "\n访问地址: http://localhost" "$GREEN"
}

# 显示容器状态
show_status() {
    print_message "容器状态:" "$BLUE"
    docker-compose -f docker-compose.yml ps
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