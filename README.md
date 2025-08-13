# Next.js Dashboard Starter

基于 Next.js 15 + React 19 的现代化管理仪表板模板，支持多环境部署。

## 🚀 快速部署

支持开发和生产环境同时运行，完全隔离的配置和端口：

```bash
# 开发环境（端口: 8089/8445）
./scripts/deploy-env.sh dev -b -u

# 生产环境（端口: 8088/8444）
./scripts/deploy-env.sh prod -b -u

# 查看所有环境状态
./scripts/deploy-env.sh
```

### 访问地址

- **开发环境**: http://localhost:8089 | https://localhost:8445
- **生产环境**: http://localhost:8088 | https://localhost:8444

## 📋 常用操作

### 环境管理

```bash
# 开发环境操作
./scripts/deploy-env.sh dev -s      # 查看状态
./scripts/deploy-env.sh dev -l      # 查看日志
./scripts/deploy-env.sh dev -r      # 重启
./scripts/deploy-env.sh dev -d      # 停止

# 生产环境操作
./scripts/deploy-env.sh prod -s     # 查看状态
./scripts/deploy-env.sh prod -l     # 查看日志
./scripts/deploy-env.sh prod -r     # 重启
./scripts/deploy-env.sh prod -d     # 停止

# 重新加载 Nginx 配置
./scripts/deploy-env.sh dev --reload-nginx
./scripts/deploy-env.sh prod --reload-nginx

# 清理资源
./scripts/deploy-env.sh dev -c
```

### Docker 卷管理

Docker 使用两种类型的卷来存储数据：

#### 1. 绑定挂载（项目文件）

这些直接挂载到本地目录，删除容器不会影响文件：

- `../../uploads:/app/uploads` - 上传文件存储在本地
- `../..:/app` - 源代码挂载（开发环境）
- `./certs:/etc/nginx/certs:ro` - SSL 证书文件

#### 2. 命名卷（Docker 管理）

这些由 Docker 管理，存储在 Docker 数据目录中：

- `nginx-logs` - Nginx 日志
- `nginx-cache` - Nginx 缓存

```bash
# 查看所有卷
docker volume ls

# 查看特定卷详情
docker volume inspect nextjs-dashboard-dev_nginx-logs

# 查看未使用的卷
docker volume ls -f dangling=true

# ⚠️ 谨慎清理未使用的卷（可能包含重要数据）
docker volume prune
```

**注意事项：**

- 清理卷前请确认不包含重要数据
- 命名卷删除后数据无法恢复
- 绑定挂载的文件存储在本地，相对安全
- 建议定期备份重要的卷数据

````

## iframe 嵌入外部站点

### 嵌入 HTTPS 站点

直接在 iframe 中使用 HTTPS URL：

```tsx
<iframe src="https://example.com" />
````

### 嵌入 HTTP 站点

使用 SecureIframe 组件自动处理：

```tsx
import { SecureIframe } from '@/components/secure-iframe';

// 自动通过代理转换 HTTP 为 HTTPS
<SecureIframe
  src='http://192.168.1.100:8080/dashboard'
  className='h-full w-full'
/>;
```

或手动使用代理路径：

```tsx
// 原始: http://192.168.1.100:8080/app
// 代理: /http-proxy/192.168.1.100:8080/app
<iframe src='/http-proxy/192.168.1.100:8080/app' />
```

## 🛠️ 开发方式

### Docker 开发环境（推荐）

```bash
# 启动开发环境
./scripts/deploy-env.sh dev -b -u

# 访问: https://localhost:8445
```

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm run dev

# 访问: http://localhost:3000
```

## ⚙️ 配置管理

### 环境变量配置

环境变量完全隔离：

- **开发环境**: `scripts/docker/.env.dev`
- **生产环境**: `scripts/docker/.env.prod`

### Nginx 配置

Nginx 配置模板：`scripts/docker/nginx/portal.conf.template`

修改模板后重新加载：

```bash
./scripts/deploy-env.sh dev --reload-nginx   # 开发环境
./scripts/deploy-env.sh prod --reload-nginx  # 生产环境
```

### 修改应用代码

代码修改后让更改生效：

#### 方法 1：完整重建（最可靠）

```bash
# 重新构建镜像并启动
./deploy.sh -b -u
```

### 端口配置

默认端口分配：

- **开发环境**: HTTP=8089, HTTPS=8445
- **生产环境**: HTTP=8088, HTTPS=8444

如需修改端口，编辑对应的环境变量文件：

- 开发环境: `scripts/docker/.env.dev`
- 生产环境: `scripts/docker/.env.prod`

修改后重启相应环境：

```bash
./scripts/deploy-env.sh dev -d && ./scripts/deploy-env.sh dev -u
./scripts/deploy-env.sh prod -d && ./scripts/deploy-env.sh prod -u
```

## 🔧 故障排查

### 查看日志

```bash
# 查看特定环境的日志
./scripts/deploy-env.sh dev -l
./scripts/deploy-env.sh prod -l

# 查看特定服务的日志
./scripts/deploy-env.sh dev -l app
./scripts/deploy-env.sh dev -l nginx
```

### 端口冲突

```bash
# 检查端口占用
lsof -i :8089  # 开发环境 HTTP
lsof -i :8445  # 开发环境 HTTPS
lsof -i :8088  # 生产环境 HTTP
lsof -i :8444  # 生产环境 HTTPS
```

### SSL 证书

首次部署时会自动生成自签名证书。如需重新生成：

```bash
cd scripts/docker
rm -rf certs/
./generate-certs.sh

# 重启环境
./scripts/deploy-env.sh dev -r
./scripts/deploy-env.sh prod -r
```

## 🌟 特性

- ✅ **多环境部署**: 开发和生产环境完全隔离
- ✅ **iframe 嵌入**: 支持绕过 X-Frame-Options 限制
- ✅ **Docker 容器化**: 一键构建部署
- ✅ **SSL/HTTPS**: 自动生成自签名证书
- ✅ **Nginx 反向代理**: 静态文件缓存、负载均衡
- ✅ **环境变量隔离**: 独立的配置文件
- ✅ **健康检查**: 容器状态监控
- ✅ **日志管理**: 分环境日志查看

## 📁 项目结构

详细的项目结构和开发指南请参考 `CLAUDE.md` 文件。
