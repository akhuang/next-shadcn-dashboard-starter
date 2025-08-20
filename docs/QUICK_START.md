# 快速启动指南

## 🚀 一键启动（推荐）

最简单的方式，只需一个命令：

```bash
pnpm dev:full
```

这将自动：
1. ✅ 启动 Redis 和 PostgreSQL
2. ✅ 初始化数据库
3. ✅ 创建测试数据
4. ✅ 启动 Excel 监控服务
5. ✅ 启动 Next.js 开发服务器

然后访问：http://localhost:3000/dashboard/navigation

## 📦 首次安装

如果是第一次运行项目：

```bash
# 1. 安装依赖
pnpm install

# 2. 安装 Excel 监控服务依赖
cd excel-monitor-service && npm install && cd ..

# 3. 复制环境变量
cp env.example.txt .env

# 4. 运行一键启动
pnpm dev:full
```

## 🛠️ 分步启动（手动控制）

如果你想分开控制各个服务：

### 终端 1：启动数据库服务
```bash
# 使用 Homebrew (macOS)
brew services start redis
brew services start postgresql@16

# 或使用 Docker
docker run -d -p 6379:6379 redis:7-alpine
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=postgres postgres:16-alpine
```

### 终端 2：初始化数据库
```bash
# 首次运行
pnpm db:push
pnpm db:seed

# 创建测试数据
node scripts/create-navigation-excel.js
```

### 终端 3：启动 Excel 监控
```bash
cd excel-monitor-service
npm run dev
```

### 终端 4：启动 Next.js
```bash
pnpm dev
```

## 🎯 命令说明

| 命令 | 说明 |
|------|------|
| `pnpm dev:full` | 一键启动所有服务（推荐） |
| `pnpm dev` | 仅启动 Next.js |
| `pnpm services:setup` | 初始化开发环境 |
| `pnpm db:studio` | 打开 Prisma Studio 查看数据 |
| `pnpm monitor:dev` | 单独启动 Excel 监控 |

## 📝 Excel 监控服务

在 `excel-monitor-service` 目录下：

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动增强版监控（监控导航+联系人） |
| `npm run dev:basic` | 启动基础版监控（仅联系人） |
| `npm run dev:watch` | 启动监控并自动重启 |

## 🔍 检查服务状态

```bash
# 检查 Redis
redis-cli ping

# 检查 PostgreSQL
pg_isready

# 查看数据库
pnpm db:studio
```

## ⚙️ 环境变量

关键配置（`.env` 文件）：

```env
# 数据库
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/navigation_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Excel 监控目录
NAVIGATION_EXCEL_DIR=/tmp/test-navigation
EXCEL_WATCH_DIR=/tmp/test-contacts
```

## 🛑 停止服务

如果使用 `pnpm dev:full`，按 `Ctrl+C` 会自动停止所有服务。

手动停止：
```bash
# macOS Homebrew
brew services stop redis
brew services stop postgresql@16

# Docker
docker stop dev-redis dev-postgres
docker rm dev-redis dev-postgres
```

## 📚 测试流程

1. 访问 http://localhost:3000/dashboard/navigation
2. 点击"模拟登录"
3. 点击任意系统链接（记录访问）
4. 点击星标图标（添加收藏）
5. 查看"最近访问"和"我的收藏"

## 🔧 故障排查

### Redis 连接失败
```bash
# macOS
brew install redis
brew services start redis

# Linux
sudo apt install redis-server
sudo systemctl start redis
```

### PostgreSQL 连接失败
```bash
# macOS
brew install postgresql@16
brew services start postgresql@16
createdb navigation_db

# Linux
sudo apt install postgresql
sudo systemctl start postgresql
sudo -u postgres createdb navigation_db
```

### 端口被占用
```bash
# 查看占用端口的进程
lsof -i:3000  # Next.js
lsof -i:5432  # PostgreSQL
lsof -i:6379  # Redis

# 结束进程
kill -9 <PID>
```

## 🎉 完成！

现在你可以开始使用内部导航系统了！