# Docker 部署指南

## 快速部署

### 1. 首次部署

```bash
# 进入部署目录
cd scripts/docker

# 修改端口配置（可选）
vi .env
# HTTP_PORT=8088   # HTTP 端口
# HTTPS_PORT=8443  # HTTPS 端口

# 一键构建并启动
../deploy.sh -b -u
```

访问地址：
- HTTP: `http://localhost:8088` (自动跳转到 HTTPS)
- HTTPS: `https://localhost:8443`

### 2. 常用操作

```bash
# 查看服务状态
../deploy.sh -s

# 查看日志
../deploy.sh -l        # 所有日志
../deploy.sh -l app    # 仅应用日志
../deploy.sh -l nginx  # 仅 Nginx 日志

# 重启服务
../deploy.sh -r

# 停止服务
../deploy.sh -d

# 清理资源
../deploy.sh -c
```

## 配置更新

### 修改 Nginx 配置

Nginx 配置文件：`scripts/docker/nginx/portal.conf`

修改后让配置生效：

```bash
# 方法 1：重启 Nginx 容器（推荐，无需重建）
docker-compose restart nginx

# 方法 2：重新加载配置（最快，无停机）
docker-compose exec nginx nginx -s reload

# 方法 3：完整重启
../deploy.sh -r
```

### 修改应用代码

代码修改后让更改生效：

#### 方法 1：完整重建（最可靠）
```bash
# 重新构建镜像并启动
../deploy.sh -b -u
```

#### 方法 2：快速重建（开发时使用）
```bash
# 只重建应用容器
docker-compose up -d --build app

# 或者分步执行
docker-compose build app
docker-compose up -d app
```

#### 方法 3：开发模式（最快）
如需频繁修改代码，建议使用开发模式：

1. 修改 `docker-compose.yml`，添加代码挂载：
```yaml
services:
  app:
    volumes:
      - ../../:/app  # 挂载源代码
      - /app/node_modules  # 排除 node_modules
      - /app/.next  # 排除构建产物
```

2. 使用开发命令启动：
```bash
docker-compose exec app pnpm run dev
```

## 端口配置

修改 `.env` 文件中的端口：

```bash
HTTP_PORT=9088   # 修改 HTTP 端口
HTTPS_PORT=9443  # 修改 HTTPS 端口
```

修改后重启服务：
```bash
../deploy.sh -r
```

## SSL 证书

### 重新生成证书
```bash
# 删除旧证书
rm -rf certs/

# 生成新证书（自动包含本机 IP）
./generate-certs.sh

# 重启 Nginx
docker-compose restart nginx
```

### 使用自定义证书
将你的证书文件放入 `certs/` 目录：
- `portal.crt` - 证书文件
- `portal.key` - 私钥文件

## 故障排查

### 1. 服务无法启动
```bash
# 查看详细日志
docker-compose logs -f

# 检查端口占用
lsof -i :8088
lsof -i :8443
```

### 2. Next.js 应用错误
```bash
# 进入容器调试
docker-compose exec app sh

# 查看应用日志
docker-compose logs -f app
```

### 3. Nginx 配置错误
```bash
# 测试配置文件
docker-compose exec nginx nginx -t

# 查看错误日志
docker-compose exec nginx cat /var/log/nginx/error.log
```

## 性能优化

### 1. 启用构建缓存
```bash
# 使用缓存构建（默认）
docker-compose build

# 强制重建（不使用缓存）
docker-compose build --no-cache
```

### 2. 资源限制
在 `docker-compose.yml` 中配置：
```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
```

### 3. 多副本部署
```bash
# 扩展应用副本数
docker-compose up -d --scale app=3
```

注意：需要配置 Nginx 负载均衡。