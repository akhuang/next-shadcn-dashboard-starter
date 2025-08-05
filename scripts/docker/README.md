# Docker 部署配置

## 快速开始

1. **直接启动服务**：
   ```bash
   ../deploy.sh -b -u
   ```

2. **修改配置**（可选）：
   ```bash
   vim .env
   ```

## 环境配置说明

**重要**：这是**生产环境**配置，与开发环境（根目录 `.env`）分离：

- **开发环境**：使用根目录 `.env`（Sentry 禁用，Clerk keyless 模式）
- **生产环境**：使用 `scripts/docker/.env`（Sentry 启用，需要真实 API keys）

### Docker 配置
- `HTTP_PORT`: HTTP 端口，默认 8088
- `HTTPS_PORT`: HTTPS 端口，默认 8443
- `COMPOSE_PROJECT_NAME`: Docker 项目名称

### 生产环境应用配置
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: Clerk 公钥（生产环境需要真实值）
- `CLERK_SECRET_KEY`: Clerk 私钥（生产环境需要真实值）
- `NEXT_PUBLIC_SENTRY_DSN`: Sentry DSN（生产环境启用错误追踪）
- `SENTRY_AUTH_TOKEN`: Sentry 认证令牌

## 常用命令

```bash
# 构建并启动
../deploy.sh -b -u

# 重启服务
../deploy.sh -r

# 查看日志
../deploy.sh -l

# 查看状态
../deploy.sh -s

# 停止服务
../deploy.sh -d

# 清理资源
../deploy.sh -c
```

## 访问地址

- HTTP: http://localhost:${HTTP_PORT}
- 默认: http://localhost:8088

## 故障排除

1. **端口冲突**：修改 `.env` 文件中的 `HTTP_PORT`
2. **权限问题**：确保 Docker 有权限访问项目目录
3. **网络问题**：检查防火墙和网络设置