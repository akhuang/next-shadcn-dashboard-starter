# 开发环境 Redis 快速设置指南

## 最简单的方式

### 一行命令启动开发环境
```bash
# 同时启动 Redis 和开发服务器
pnpm dev:full
```

### 分步启动（推荐）
```bash
# 1. 启动 Redis
pnpm redis:start

# 2. 启动开发服务器
pnpm dev

# 3. 访问应用
# 原版本：http://localhost:3000/dashboard/contacts
# 优化版：http://localhost:3000/dashboard/contacts-v3
```

## Redis 管理命令

### 基本操作
```bash
# 检查 Redis 状态
pnpm redis:status

# 查看 Redis 日志
pnpm redis:logs

# 连接到 Redis CLI
pnpm redis:cli

# 停止 Redis
pnpm redis:stop
```

### 常用 Redis CLI 命令
```bash
# 进入 Redis CLI 后可以使用：

# 查看所有键
KEYS excel:*

# 查看文件列表
GET excel:files

# 查看特定文件的 sheets
GET excel:file:测试数据.xlsx:sheets

# 查看缓存状态
GET excel:cache:global_status

# 清空所有缓存
FLUSHDB

# 退出 CLI
exit
```

## 环境变量配置

在项目根目录创建 `.env.local`：
```bash
# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
REDIS_DB=0

# Excel 监控目录
EXCEL_WATCH_DIR=/tmp/test-contacts
EXCEL_WATCH_POLLING=false
EXCEL_WATCH_INTERVAL=1000
```

## 无 Docker 方式（适合本地 Redis）

如果你已经有本地 Redis 安装：

```bash
# 1. 启动本地 Redis
redis-server

# 2. 配置 .env.local
REDIS_HOST=localhost
REDIS_PORT=6379

# 3. 启动开发服务器
pnpm dev
```

## 故障排除

### Redis 启动失败
```bash
# 检查是否有端口冲突
netstat -ln | grep 6379

# 清理旧的容器
docker container prune

# 重新启动
pnpm redis:stop && pnpm redis:start
```

### 缓存问题
```bash
# 清空所有 Excel 缓存
pnpm redis:cli
> FLUSHDB
> exit

# 重启应用让缓存重新生成
```

### 性能调试
```bash
# 监控 Redis 性能
pnpm redis:cli
> MONITOR

# 查看内存使用
> INFO memory
```

## 开发技巧

### 快速清理和重启
```bash
# 一键重置开发环境
pnpm redis:stop && pnpm redis:start && pnpm dev
```

### 批量测试脚本
```bash
# 运行性能测试
node scripts/test-excel-performance.js
```

### 监控缓存状态
```bash
# 实时监控缓存键
pnpm redis:cli
> PSUBSCRIBE excel:*
```

## 生产环境部署

生产环境使用内置的 Redis：

```bash
# 构建和部署
cd scripts/docker
./deploy.sh -b -u

# Redis 会自动启动，无需额外配置
```