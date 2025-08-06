# 多阶段构建 - 第一阶段：依赖安装  
# 使用标准 Node.js 镜像，避免 Alpine 的兼容性问题
FROM node:20-slim AS deps

# 配置代理环境变量（从构建参数传入）
ARG HTTP_PROXY
ARG HTTPS_PROXY  
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY:-${http_proxy}}
ENV HTTPS_PROXY=${HTTPS_PROXY:-${https_proxy}}
ENV NO_PROXY=${NO_PROXY:-${no_proxy}}
ENV http_proxy=${http_proxy:-${HTTP_PROXY}}
ENV https_proxy=${https_proxy:-${HTTPS_PROXY}}
ENV no_proxy=${no_proxy:-${NO_PROXY}}
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 安装基础工具（slim 镜像需要）
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# 复制包管理文件
COPY package.json pnpm-lock.yaml ./
COPY .npmrc ./

# 配置 npm 代理和 SSL（如果有代理的话）
RUN if [ -n "$HTTP_PROXY" ]; then npm config set proxy $HTTP_PROXY; fi && \
    if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy $HTTPS_PROXY; fi && \
    npm config set strict-ssl false

# 安装 pnpm 并安装依赖
RUN npm install -g pnpm@latest

# 配置 pnpm 代理和 SSL
RUN if [ -n "$HTTP_PROXY" ]; then pnpm config set proxy $HTTP_PROXY; fi && \
    if [ -n "$HTTPS_PROXY" ]; then pnpm config set https-proxy $HTTPS_PROXY; fi && \
    pnpm config set strict-ssl false

RUN pnpm install --frozen-lockfile

# 多阶段构建 - 第二阶段：构建应用
FROM node:20-slim AS builder
WORKDIR /app

# 配置代理环境变量（从构建参数传入）
ARG HTTP_PROXY
ARG HTTPS_PROXY  
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY:-${http_proxy}}
ENV HTTPS_PROXY=${HTTPS_PROXY:-${https_proxy}}
ENV NO_PROXY=${NO_PROXY:-${no_proxy}}
ENV http_proxy=${http_proxy:-${HTTP_PROXY}}
ENV https_proxy=${https_proxy:-${HTTPS_PROXY}}
ENV no_proxy=${no_proxy:-${NO_PROXY}}
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 复制依赖
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 设置环境变量
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_ENV production

# 配置 npm 和 pnpm 代理设置
RUN if [ -n "$HTTP_PROXY" ]; then npm config set proxy $HTTP_PROXY; fi && \
    if [ -n "$HTTPS_PROXY" ]; then npm config set https-proxy $HTTPS_PROXY; fi && \
    npm config set strict-ssl false

# 构建应用
RUN npm install -g pnpm@latest

# 配置 pnpm 代理和 SSL
RUN if [ -n "$HTTP_PROXY" ]; then pnpm config set proxy $HTTP_PROXY; fi && \
    if [ -n "$HTTPS_PROXY" ]; then pnpm config set https-proxy $HTTPS_PROXY; fi && \
    pnpm config set strict-ssl false

RUN pnpm run build

# 多阶段构建 - 第三阶段：生产运行
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1
ENV NODE_TLS_REJECT_UNAUTHORIZED=0

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 复制必要文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# 如果使用 Sharp 进行图片优化（已在 package.json 中安装）
COPY --from=builder /app/node_modules/sharp ./node_modules/sharp

# 设置正确的权限
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

# 启动应用
CMD ["node", "server.js"]