# 📚 项目文档索引

欢迎查阅 Next.js Dashboard Starter 项目文档！

## 🚀 快速开始

- [**项目概述**](../README.md) - 项目介绍和快速部署指南
- [**环境配置**](../env.example.txt) - 环境变量配置模板
- [**Claude AI 指南**](../CLAUDE.md) - Claude Code 使用说明和项目约定

## 🛠️ 部署与运维

- [**Docker 部署指南**](DOCKER_DEPLOYMENT.md) - 完整的 Docker 容器化部署文档
  - 多环境部署架构
  - SSL/HTTPS 配置
  - Nginx 反向代理
  - 容器管理和维护

- [**自托管分析服务**](ANALYTICS_GUIDE.md) - Plausible Analytics 集成指南
  - 隐私友好的网站分析
  - 自定义事件追踪
  - 数据完全本地化
  - 性能监控配置

## 🔧 功能模块

- [**内部导航系统**](NAVIGATION_GUIDE.md) - 企业内部系统导航门户
  - 65+ 预配置系统链接
  - 搜索、收藏、历史记录
  - 自定义链接配置
  - 响应式布局设计

- [**AD 认证集成**](AD_AUTH_SETUP.md) - Active Directory 认证配置
  - LDAP 连接设置
  - 用户认证流程
  - 权限管理配置

## 📝 开发指南

### 技术栈

- **框架**: Next.js 15 + React 19
- **语言**: TypeScript
- **样式**: Tailwind CSS v4 + shadcn/ui
- **认证**: Clerk（支持无密钥模式）
- **状态管理**: Zustand
- **表单**: React Hook Form + Zod
- **表格**: Tanstack Table
- **分析**: Plausible Analytics（自托管）
- **错误追踪**: Sentry

### 项目结构

```
src/
├── app/           # Next.js App Router
├── components/    # 共享组件
├── features/      # 功能模块
├── lib/          # 工具函数
├── stores/       # Zustand 状态
└── types/        # TypeScript 类型
```

### 开发命令

```bash
# 本地开发
pnpm install      # 安装依赖
pnpm run dev      # 启动开发服务器
pnpm run build    # 构建生产版本
pnpm run lint     # 代码检查

# Docker 部署
./scripts/deploy-env.sh dev -b -u   # 开发环境
./scripts/deploy-env.sh prod -b -u  # 生产环境

# 分析服务
./scripts/deploy-analytics.sh --up  # 启动分析服务
```

## 🔍 特殊配置

### 多环境管理

项目支持开发和生产环境完全隔离：

- **开发环境**: 端口 8089/8445
- **生产环境**: 端口 8088/8444
- **配置文件**: `.env.dev` / `.env.prod`

### iframe 嵌入支持

项目配置了特殊的 Nginx 规则，支持嵌入外部站点：

- 自动处理 X-Frame-Options 限制
- HTTP 站点通过 HTTPS 代理
- Cookie 策略优化

## 📊 监控与分析

- **健康检查**: `/api/health` 端点
- **访问分析**: Plausible Analytics 自托管
- **错误追踪**: Sentry 集成（可选）
- **性能监控**: 实时指标面板

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证

MIT License - 详见 [LICENSE](../LICENSE) 文件

## 🆘 获取帮助

- 查看 [故障排除](../README.md#🔧-故障排查) 章节
- 提交 [GitHub Issue](https://github.com/your-repo/issues)
- 参考示例配置文件

---

最后更新: 2024年12月