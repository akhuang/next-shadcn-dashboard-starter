# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Next.js 15 + React 19 的管理仪表板模板，使用了以下技术栈：

- **框架**: Next.js 15 App Router
- **语言**: TypeScript
- **样式**: Tailwind CSS v4 + shadcn/ui
- **认证**: Clerk（支持无密钥模式）
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **表格**: Tanstack Table
- **错误追踪**: Sentry

## 常用开发命令

```bash
# 安装依赖（注意：项目使用 pnpm 且配置了 legacy-peer-deps=true）
pnpm install

# 开发服务器（使用 Turbopack）
pnpm run dev

# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start

# 代码检查
pnpm run lint
pnpm run lint:fix
pnpm run lint:strict

# 代码格式化
pnpm run format
pnpm run format:check
```

## 项目结构

项目采用基于功能的组织结构：

- `src/app/` - Next.js App Router 路由
  - `(auth)/` - 认证相关页面
  - `dashboard/` - 仪表板主要功能页面
    - `overview/` - 使用了 Parallel Routes（并行路由）
    - `product/` - 产品管理（包含表格和表单）
    - `kanban/` - 看板功能
    - `embedded/` - 嵌入式仪表板集成
- `src/components/` - 共享组件
  - `ui/` - shadcn/ui 组件
  - `layout/` - 布局组件（侧边栏、头部等）
- `src/features/` - 功能模块（每个功能独立组织）
  - `[feature]/components/` - 功能特定组件
  - `[feature]/actions/` - Server Actions
  - `[feature]/schemas/` - Zod 验证模式
  - `[feature]/utils/` - 功能特定工具函数
- `src/lib/` - 核心工具和配置
- `src/hooks/` - 自定义 Hooks
- `src/stores/` - Zustand 状态存储

## 重要开发约定

### 路径别名

- `@/*` 对应 `./src/*`
- `~/*` 对应 `./public/*`

### 组件开发

- 使用 shadcn/ui 组件库，配置文件在 `components.json`
- 样式使用 Tailwind CSS，遵循项目中的格式化配置
- 新组件应参考现有组件的编写模式

### 表单处理

- 使用 React Hook Form + Zod 进行表单验证
- 表单 Schema 放在 `features/[feature]/schemas/` 目录
- 参考 `src/features/products/components/product-form.tsx` 的实现模式

### 数据表格

- 使用 Tanstack Table + shadcn/ui 的 DataTable 组件
- 支持服务端搜索、过滤和分页（通过 Nuqs 管理 URL 参数）
- 参考 `src/features/products/components/product-tables/` 的实现

### 状态管理

- 使用 Zustand 进行客户端状态管理
- Store 文件放在 `src/stores/` 或功能特定的 `utils/store.ts`
- 参考看板功能的状态管理实现

### Git Hooks

- 项目配置了 Husky + lint-staged
- pre-commit: 运行 lint-staged（格式化代码）
- pre-push: 运行构建检查

### 环境配置

- 复制 `env.example.txt` 为 `.env.local`
- Clerk 认证支持无密钥模式，可以立即开始开发
- Sentry 错误追踪需要配置相应的环境变量

## 开发注意事项

1. **使用 pnpm**: 项目使用 pnpm 作为包管理器，已配置 `legacy-peer-deps=true`
2. **React 19**: 项目使用 React 19，注意兼容性问题
3. **Turbopack**: 开发环境默认启用 Turbopack 以提升性能
4. **并行路由**: Overview 页面使用了 Next.js 的并行路由功能，各部分独立加载和错误处理
5. **Server Actions**: 优先使用 Server Actions 处理服务端逻辑
6. **类型安全**: 严格使用 TypeScript，确保类型安全

## Docker 生产部署

项目已配置完整的 Docker 生产部署方案：

### 快速部署

```bash
# 构建并启动所有服务
./scripts/deploy.sh -b -u

# 查看服务状态
./scripts/deploy.sh -s

# 重启服务
./scripts/deploy.sh -r
```

### 部署架构

- **多阶段 Dockerfile**: 优化镜像大小，生产构建
- **Nginx 反向代理**: 处理静态文件缓存、负载均衡、SSL终止
- **Docker Compose**: 容器编排，包含健康检查和资源限制
- **部署脚本**: 自动化部署流程

### 相关文件

- `scripts/deploy.sh` - 自动化部署脚本
- `scripts/docker/Dockerfile` - 多阶段构建配置
- `scripts/docker/docker-compose.yml` - 容器编排配置
- `scripts/docker/nginx/portal.conf` - Nginx 反向代理配置
- `scripts/docker/generate-certs.sh` - SSL 证书生成脚本
- `docs/DOCKER_DEPLOYMENT.md` - 详细部署文档

**重要提示**: 部署前需要在 `next.config.ts` 中添加 `output: 'standalone'` 配置。
