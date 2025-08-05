# Docker 生产部署指南

本指南说明如何使用 Docker 和 Nginx 部署 Next.js Dashboard 应用到生产环境。

## 架构概述

部署架构使用以下组件：
- **Next.js 应用**: 运行在 Node.js 容器中
- **Nginx**: 作为反向代理，处理静态文件缓存和负载均衡
- **Docker Compose**: 编排多个容器

```
用户请求 -> Nginx (80/443端口) -> Next.js App (3000端口)
```

### 文件结构
```
scripts/
├── deploy.sh              # 部署脚本
└── docker/
    ├── docker-compose.yml # Docker 编排配置
    ├── Dockerfile         # Next.js 应用构建配置
    ├── generate-certs.sh  # SSL 证书生成脚本
    ├── nginx/
    │   └── portal.conf   # Nginx 配置
    └── certs/             # SSL 证书目录
        ├── portal.crt
        └── portal.key
```

## 前置要求

- Docker 20.10+
- Docker Compose 2.0+
- 服务器至少 2GB RAM
- 域名（可选，用于 SSL 配置）

## 快速开始

### 1. 准备环境配置

```bash
# 复制环境配置模板
cp env.example.txt .env.production

# 编辑生产环境变量
vim .env.production
```

### 2. 更新 Next.js 配置

需要在 `next.config.ts` 中添加 standalone 输出模式：

```typescript
const baseConfig: NextConfig = {
  output: 'standalone',  // 添加这一行
  // ... 其他配置
};
```

### 3. 使用部署脚本

```bash
# 构建并启动所有服务
./scripts/deploy.sh -b -u

# 或者分步执行
./scripts/deploy.sh --build      # 仅构建
./scripts/deploy.sh --up          # 启动容器
```

## 部署脚本使用

### 基本命令

```bash
# 查看帮助
./scripts/deploy.sh -h

# 构建镜像
./scripts/deploy.sh -b

# 启动服务
./scripts/deploy.sh -u

# 停止服务
./scripts/deploy.sh -d

# 重启服务
./scripts/deploy.sh -r

# 查看日志
./scripts/deploy.sh -l
./scripts/deploy.sh -l app    # 仅查看应用日志
./scripts/deploy.sh -l nginx  # 仅查看 Nginx 日志

# 查看状态
./scripts/deploy.sh -s

# 清理资源
./scripts/deploy.sh -c
```

### 生产环境部署

```bash
# 使用生产配置构建并启动
./scripts/deploy.sh --production -b -u
```

## 手动部署步骤

如果不使用部署脚本，可以手动执行：

```bash
# 1. 进入 Docker 目录
cd scripts/docker

# 2. 生成 SSL 证书（如果需要）
./generate-certs.sh

# 3. 构建镜像
docker-compose build

# 4. 启动服务（后台运行）
docker-compose up -d

# 5. 查看运行状态
docker-compose ps

# 6. 查看日志
docker-compose logs -f

# 7. 停止服务
docker-compose down
```

## SSL/HTTPS 配置

### 1. 准备 SSL 证书

使用自签名证书（开发/测试环境）：
```bash
cd scripts/docker
./generate-certs.sh localhost 3650
```

或者使用正式 SSL 证书（生产环境）：
```bash
# 将证书文件放在 scripts/docker/certs/ 目录
cp /path/to/your/cert.crt scripts/docker/certs/portal.crt
cp /path/to/your/key.key scripts/docker/certs/portal.key
```

### 2. SSL 配置说明

Nginx 配置文件 `scripts/docker/nginx/portal.conf` 已包含 SSL 支持：

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/nginx/certs/server.crt;
    ssl_certificate_key /etc/nginx/certs/server.key;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;
    
    # 其他配置同 nginx.conf
}

# HTTP 重定向到 HTTPS
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}
```

### 3. 启用 HTTPS

SSL 配置已默认启用，只需确保证书文件存在即可。

## 性能优化

### 1. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

### 2. 健康检查

应用已配置健康检查，可通过以下端点监控：
- Next.js App: `http://localhost:3000/api/health`
- Nginx: `http://localhost/health`

### 3. 日志管理

```bash
# 查看实时日志
docker-compose logs -f

# 导出日志
docker-compose logs > deployment.log

# 清理旧日志
docker run --rm -v nginx-logs:/logs alpine sh -c "find /logs -name '*.log' -mtime +7 -delete"
```

## 监控和维护

### 查看资源使用

```bash
# 查看容器资源使用情况
docker stats

# 查看磁盘使用
docker system df
```

### 备份和恢复

```bash
# 备份数据卷
docker run --rm -v nextjs-dashboard_uploads:/data -v $(pwd):/backup alpine tar czf /backup/uploads-backup.tar.gz -C /data .

# 恢复数据卷
docker run --rm -v nextjs-dashboard_uploads:/data -v $(pwd):/backup alpine tar xzf /backup/uploads-backup.tar.gz -C /data
```

### 更新应用

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建并部署
./scripts/deploy.sh -b -r
```

## 故障排查

### 常见问题

1. **容器无法启动**
   ```bash
   # 查看详细错误日志
   docker-compose logs app
   docker-compose logs nginx
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   sudo lsof -i :80
   sudo lsof -i :443
   ```

3. **构建失败**
   ```bash
   # 清理缓存重新构建
   docker-compose build --no-cache
   ```

4. **权限问题**
   ```bash
   # 修复文件权限
   sudo chown -R 1001:1001 ./uploads
   ```

### 调试模式

在 `docker-compose.yml` 中添加环境变量启用调试：
```yaml
environment:
  - DEBUG=true
  - LOG_LEVEL=debug
```

## 安全建议

1. **定期更新**
   - 定期更新基础镜像
   - 及时修复安全漏洞

2. **限制网络访问**
   - 使用防火墙限制端口访问
   - 配置 Nginx 访问控制

3. **敏感信息管理**
   - 使用 Docker Secrets 管理敏感配置
   - 避免在镜像中硬编码密钥

4. **日志安全**
   - 定期轮转日志文件
   - 避免记录敏感信息

## 生产环境检查清单

- [ ] 环境变量配置正确
- [ ] SSL 证书已配置（如需要）
- [ ] 资源限制已设置
- [ ] 健康检查正常
- [ ] 备份策略已制定
- [ ] 监控告警已配置
- [ ] 日志收集已设置
- [ ] 安全扫描已通过

## 相关资源

- [Next.js 部署文档](https://nextjs.org/docs/deployment)
- [Docker 最佳实践](https://docs.docker.com/develop/dev-best-practices/)
- [Nginx 配置指南](https://nginx.org/en/docs/)