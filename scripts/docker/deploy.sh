#!/bin/bash

# Docker Compose 部署脚本
# 用于管理生产环境的 Docker 容器

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 脚本所在目录
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$( cd "$SCRIPT_DIR/../.." && pwd )"

# 环境文件 - 使用项目根目录的 .env
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.local.example"

# Docker Compose 文件
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"

# 日志函数
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查环境文件
check_env() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warning "环境文件不存在，从示例文件创建..."
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            log_info "请编辑 $ENV_FILE 配置你的环境变量"
        else
            log_error "示例环境文件不存在: $ENV_EXAMPLE"
        fi
        exit 1
    fi
    log_success "使用环境文件: $ENV_FILE"
}

# 检查 Docker 和 Docker Compose
check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先安装 Docker"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        log_error "Docker Compose 未安装"
        exit 1
    fi
    
    log_success "Docker 和 Docker Compose 已安装"
}

# 创建必要的目录
create_directories() {
    log_info "创建必要的目录..."
    
    # Excel 数据目录
    mkdir -p "$SCRIPT_DIR/excel-data"
    mkdir -p "$SCRIPT_DIR/navigation-data"
    
    # SSL 证书目录
    mkdir -p "$SCRIPT_DIR/certs"
    
    # 上传目录
    mkdir -p "$PROJECT_ROOT/uploads"
    
    log_success "目录创建完成"
}

# 生成 SSL 证书（如果不存在）
generate_ssl() {
    if [ ! -f "$SCRIPT_DIR/certs/server.crt" ] || [ ! -f "$SCRIPT_DIR/certs/server.key" ]; then
        log_info "生成自签名 SSL 证书..."
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout "$SCRIPT_DIR/certs/server.key" \
            -out "$SCRIPT_DIR/certs/server.crt" \
            -subj "/C=CN/ST=State/L=City/O=Organization/CN=localhost"
        log_success "SSL 证书生成完成"
    else
        log_info "SSL 证书已存在"
    fi
}

# 构建镜像
build_images() {
    log_info "构建 Docker 镜像..."
    
    cd "$SCRIPT_DIR"
    
    # 使用环境文件构建
    docker-compose --env-file "$ENV_FILE" build --no-cache
    
    log_success "镜像构建完成"
}

# 启动服务
start_services() {
    log_info "启动服务..."
    
    cd "$SCRIPT_DIR"
    
    # 使用环境文件启动
    docker-compose --env-file "$ENV_FILE" up -d
    
    log_success "服务启动完成"
}

# 停止服务
stop_services() {
    log_info "停止服务..."
    
    cd "$SCRIPT_DIR"
    
    docker-compose --env-file "$ENV_FILE" down
    
    log_success "服务已停止"
}

# 重启服务
restart_services() {
    stop_services
    start_services
}

# 查看日志
view_logs() {
    cd "$SCRIPT_DIR"
    
    if [ -z "$1" ]; then
        docker-compose --env-file "$ENV_FILE" logs -f --tail=100
    else
        docker-compose --env-file "$ENV_FILE" logs -f --tail=100 "$1"
    fi
}

# 查看服务状态
status() {
    cd "$SCRIPT_DIR"
    
    echo -e "\n${BLUE}服务状态：${NC}"
    docker-compose --env-file "$ENV_FILE" ps
    
    echo -e "\n${BLUE}端口映射：${NC}"
    docker ps --format "table {{.Names}}\t{{.Ports}}" | grep nextjs-dashboard
}

# 清理资源
cleanup() {
    log_warning "这将删除所有容器、镜像和数据卷，是否继续？(y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cd "$SCRIPT_DIR"
        
        docker-compose --env-file "$ENV_FILE" down -v --rmi all
        
        log_success "清理完成"
    else
        log_info "操作已取消"
    fi
}

# 数据库迁移
migrate_db() {
    log_info "运行数据库迁移..."
    
    cd "$SCRIPT_DIR"
    
    # 在应用容器中运行 Prisma 迁移
    docker-compose --env-file "$ENV_FILE" exec app pnpm prisma db push
    docker-compose --env-file "$ENV_FILE" exec app pnpm prisma db seed
    
    log_success "数据库迁移完成"
}

# 备份数据库
backup_db() {
    log_info "备份数据库..."
    
    BACKUP_DIR="$SCRIPT_DIR/backups"
    mkdir -p "$BACKUP_DIR"
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/backup_${TIMESTAMP}.sql"
    
    cd "$SCRIPT_DIR"
    
    # 从环境文件读取数据库配置
    source "$ENV_FILE"
    
    docker-compose --env-file "$ENV_FILE" exec -T postgres pg_dump \
        -U "${POSTGRES_USER:-postgres}" \
        "${POSTGRES_DB:-navigation_db}" > "$BACKUP_FILE"
    
    log_success "数据库备份完成: $BACKUP_FILE"
}

# 恢复数据库
restore_db() {
    if [ -z "$1" ]; then
        log_error "请提供备份文件路径"
        exit 1
    fi
    
    if [ ! -f "$1" ]; then
        log_error "备份文件不存在: $1"
        exit 1
    fi
    
    log_warning "这将覆盖现有数据库，是否继续？(y/N)"
    read -r response
    
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])$ ]]; then
        cd "$SCRIPT_DIR"
        
        # 从环境文件读取数据库配置
        source "$ENV_FILE"
        
        docker-compose --env-file "$ENV_FILE" exec -T postgres psql \
            -U "${POSTGRES_USER:-postgres}" \
            "${POSTGRES_DB:-navigation_db}" < "$1"
        
        log_success "数据库恢复完成"
    else
        log_info "操作已取消"
    fi
}

# 主菜单
show_menu() {
    echo -e "\n${BLUE}=== Docker 部署管理 ===${NC}"
    echo "1. 检查环境"
    echo "2. 构建镜像"
    echo "3. 启动服务"
    echo "4. 停止服务"
    echo "5. 重启服务"
    echo "6. 查看日志"
    echo "7. 查看状态"
    echo "8. 数据库迁移"
    echo "9. 备份数据库"
    echo "10. 恢复数据库"
    echo "11. 清理资源"
    echo "0. 退出"
    echo -e "${YELLOW}请选择操作 [0-11]:${NC} "
}

# 快速部署
quick_deploy() {
    log_info "开始快速部署..."
    
    check_docker
    check_env
    create_directories
    generate_ssl
    build_images
    start_services
    
    # 等待服务启动
    log_info "等待服务启动..."
    sleep 10
    
    migrate_db
    status
    
    log_success "部署完成！"
    echo -e "${GREEN}访问地址：${NC}"
    echo -e "  HTTP:  http://localhost:8088"
    echo -e "  HTTPS: https://localhost:8444"
}

# 命令行参数处理
case "$1" in
    quick|deploy)
        quick_deploy
        ;;
    build)
        check_docker
        check_env
        build_images
        ;;
    start|up)
        check_docker
        check_env
        start_services
        ;;
    stop|down)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    logs)
        view_logs "$2"
        ;;
    status|ps)
        status
        ;;
    migrate)
        migrate_db
        ;;
    backup)
        backup_db
        ;;
    restore)
        restore_db "$2"
        ;;
    cleanup|clean)
        cleanup
        ;;
    *)
        # 交互式菜单
        while true; do
            show_menu
            read -r choice
            
            case $choice in
                1)
                    check_docker
                    check_env
                    ;;
                2)
                    build_images
                    ;;
                3)
                    start_services
                    ;;
                4)
                    stop_services
                    ;;
                5)
                    restart_services
                    ;;
                6)
                    view_logs
                    ;;
                7)
                    status
                    ;;
                8)
                    migrate_db
                    ;;
                9)
                    backup_db
                    ;;
                10)
                    echo "请输入备份文件路径："
                    read -r backup_file
                    restore_db "$backup_file"
                    ;;
                11)
                    cleanup
                    ;;
                0)
                    exit 0
                    ;;
                *)
                    log_error "无效的选择"
                    ;;
            esac
        done
        ;;
esac