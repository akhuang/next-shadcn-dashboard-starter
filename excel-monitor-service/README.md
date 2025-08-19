# Excel Monitor Service

独立的 Excel 文件监控服务，负责监控文件夹中的 Excel 文件变化，并将数据缓存到 Redis 中。

## 功能

- 自动监控指定文件夹中的 Excel 文件
- 解析 Excel 文件（支持 .xlsx, .xls, .xlsm, .xlsb）
- 处理合并单元格
- 将数据分页存储到 Redis
- 文件变化时自动更新缓存

## 开发环境启动

### 前置要求

1. 启动 Redis（如果没有安装，可以用 Docker）:
   ```bash
   # 使用 Docker 启动 Redis
   docker run -d -p 6379:6379 --name redis redis:7-alpine
   
   # 或者使用 Homebrew (macOS)
   brew services start redis
   ```

2. 创建测试数据:
   ```bash
   node ../scripts/create-test-excel.js
   ```

### 启动服务

有三种方式启动服务：

#### 方式 1：使用 npm scripts（推荐）
```bash
cd excel-monitor-service
npm install
npm run dev
```

#### 方式 2：使用启动脚本
```bash
cd excel-monitor-service
./start-dev.sh
```

#### 方式 3：直接运行
```bash
cd excel-monitor-service
REDIS_HOST=localhost EXCEL_WATCH_DIR=/tmp/test-contacts node index.js
```

### 开发模式带文件监控
如果你想在修改代码后自动重启服务：
```bash
# 先安装 nodemon
npm install -D nodemon

# 运行带监控的开发模式
npm run dev:watch
```

## 生产环境部署

生产环境使用 Docker Compose 部署：

```bash
cd scripts/docker
docker-compose up -d
```

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| REDIS_HOST | Redis 主机地址 | localhost |
| REDIS_PORT | Redis 端口 | 6379 |
| REDIS_PASSWORD | Redis 密码 | (空) |
| REDIS_DB | Redis 数据库号 | 0 |
| EXCEL_WATCH_DIR | Excel 文件监控目录 | /tmp/test-contacts |
| NODE_ENV | 运行环境 | development |

## 测试服务

服务启动后，可以通过 Next.js API 验证：

```bash
# 检查缓存状态
curl "http://localhost:3000/api/excel/v3?action=getCacheStatus"

# 获取文件列表
curl "http://localhost:3000/api/excel/v3?action=getFiles"

# 搜索数据
curl "http://localhost:3000/api/excel/v3?action=search&query=test"
```

## 架构说明

```
Excel 文件 → Excel Monitor Service → Redis → Next.js API → 前端
```

- **Excel Monitor Service**: 后台服务，监控文件并更新 Redis
- **Redis**: 数据存储层
- **Next.js API**: 提供 HTTP 接口，从 Redis 读取数据
- **前端**: 通过 Next.js API 获取数据

## 注意事项

- 服务不提供 HTTP API，只负责监控文件和更新 Redis
- 所有数据访问通过 Next.js 的 API Routes 进行
- 开发时确保 Redis 正在运行
- 文件变化会自动触发缓存更新