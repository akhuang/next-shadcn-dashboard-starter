# 内部导航系统 - 完整架构实现指南

## 系统架构

```
用户界面 (Next.js)
    ↓
API Routes
    ↓
Prisma ORM
    ↓
PostgreSQL (用户数据 + 导航数据)
    ↑
同步服务 ← Redis ← Excel Monitor Service ← Excel 文件
```

## 快速开始

### 1. 启动服务

```bash
# 启动 PostgreSQL 和 Redis
pnpm dev:services

# 等待服务就绪
docker ps
```

### 2. 配置环境变量

复制 `.env.example` 并配置：

```bash
cp env.example.txt .env
```

关键配置：
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/navigation_db?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
NAVIGATION_EXCEL_DIR=/tmp/test-navigation
```

### 3. 初始化数据库

```bash
# 生成 Prisma Client
pnpm db:generate

# 运行数据库迁移
pnpm db:push

# 运行种子数据（创建测试用户和示例数据）
pnpm db:seed
```

### 4. 启动 Excel 监控服务

```bash
cd excel-monitor-service
./start-enhanced.sh
```

### 5. 创建测试数据

```bash
# 创建导航 Excel 文件
node scripts/create-navigation-excel.js
```

### 6. 同步数据到数据库

```bash
# 使用 curl 触发同步
curl -X POST http://localhost:3000/api/navigation/sync
```

### 7. 启动开发服务器

```bash
pnpm dev
```

访问 http://localhost:3000/dashboard/navigation

## 功能特性

### 用户功能
- ✅ **模拟登录** - 点击"模拟登录"按钮创建测试用户
- ✅ **收藏管理** - 点击星标收藏常用系统
- ✅ **访问记录** - 自动记录最近访问的系统
- ✅ **访问统计** - 显示每个系统的访问次数

### 数据管理
- ✅ **Excel 同步** - 自动监控 Excel 文件变化
- ✅ **数据持久化** - PostgreSQL 存储用户数据
- ✅ **缓存优化** - Redis 缓存提升性能

## API 端点

### 认证相关
- `POST /api/auth/mock-login` - 模拟登录
- `GET /api/auth/mock-login` - 获取当前用户
- `DELETE /api/auth/mock-login` - 登出

### 导航数据
- `GET /api/navigation/items` - 获取所有导航项
- `POST /api/navigation/items` - 批量导入导航项
- `GET /api/navigation/user` - 获取用户数据（收藏+访问记录）

### 用户操作
- `POST /api/navigation/favorites` - 添加收藏
- `DELETE /api/navigation/favorites?itemId=xxx` - 取消收藏
- `POST /api/navigation/visits` - 记录访问
- `DELETE /api/navigation/visits` - 清空访问记录

### 数据同步
- `POST /api/navigation/sync` - 从 Redis 同步到 PostgreSQL
- `GET /api/navigation/sync` - 查看同步状态

## 数据库表结构

### users 表
- 用户基本信息
- 支持 AD 域用户关联

### navigation_items 表
- 导航项信息
- 从 Excel 同步

### navigation_favorites 表
- 用户收藏记录
- 用户与导航项的多对多关系

### navigation_visits 表
- 用户访问记录
- 包含访问次数和最后访问时间

## 运维管理

### 查看数据库

```bash
# 连接 PostgreSQL
pnpm db:psql

# 或使用 Prisma Studio（图形界面）
pnpm db:studio
```

### 查看 Redis 数据

```bash
# 连接 Redis CLI
pnpm redis:cli

# 查看导航数据
GET navigation:data

# 查看用户数据
GET navigation:user:{userId}
```

### 日志查看

```bash
# PostgreSQL 日志
docker logs nextjs-postgres

# Redis 日志
docker logs nextjs-redis

# Excel Monitor 服务日志
# 查看终端输出
```

## 故障排查

### 问题：收藏/访问记录不工作

1. 检查是否已登录
   ```bash
   curl http://localhost:3000/api/auth/mock-login
   ```

2. 检查数据库连接
   ```bash
   pnpm db:psql
   \dt  # 列出所有表
   ```

3. 检查数据
   ```sql
   SELECT * FROM users;
   SELECT * FROM navigation_items;
   SELECT * FROM navigation_favorites;
   SELECT * FROM navigation_visits;
   ```

### 问题：数据不同步

1. 检查 Redis 数据
   ```bash
   pnpm redis:cli
   GET navigation:data
   ```

2. 手动触发同步
   ```bash
   curl -X POST http://localhost:3000/api/navigation/sync
   ```

3. 检查同步状态
   ```bash
   curl http://localhost:3000/api/navigation/sync
   ```

### 问题：Excel 文件更新不生效

1. 检查监控服务是否运行
2. 查看监控目录是否正确
3. 检查文件权限
4. 查看服务日志

## 生产部署

### 环境变量

```env
# 生产数据库
DATABASE_URL="postgresql://user:pass@host:5432/db?schema=public"

# Redis 集群
REDIS_HOST=redis.company.com
REDIS_PORT=6379
REDIS_PASSWORD=your-password

# Excel 监控目录
NAVIGATION_EXCEL_DIR=/data/navigation
```

### Docker 部署

使用 `scripts/docker/docker-compose.yml` 进行完整部署：

```bash
cd scripts/docker
docker-compose up -d
```

### 数据迁移

```bash
# 生产环境迁移
pnpm prisma migrate deploy

# 导入现有数据
pnpm db:seed
```

## 扩展开发

### 添加新字段

1. 修改 `prisma/schema.prisma`
2. 运行 `pnpm db:push`
3. 更新相关 API 和组件

### 集成 AD 认证

1. 更新 User 模型的 adUsername 字段
2. 实现 AD 认证逻辑
3. 替换模拟登录

### 定时同步

创建定时任务：

```typescript
// src/lib/sync-scheduler.ts
setInterval(async () => {
  await fetch('/api/navigation/sync', { method: 'POST' });
}, 60 * 60 * 1000); // 每小时同步
```

## 相关文档

- [Prisma 文档](https://www.prisma.io/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [PostgreSQL 文档](https://www.postgresql.org/docs/)
- [Excel 监控服务文档](./NAVIGATION_EXCEL_SETUP.md)