# Repository Guidelines

本仓库为基于 Next.js 15 + React 19 的仪表板起步模板，使用 TypeScript、Tailwind CSS v4 与 shadcn/ui。所有脚本使用 `pnpm` 执行。

## 项目结构与模块组织
- `src/app/`：App Router 路由（如 `dashboard/`、`(auth)/`）。
- `src/components/`：通用 UI 与布局组件。
- `src/features/`：按功能分层（`components/`、`actions/`、`schemas/`、`utils/`）。
- `src/lib/`、`src/hooks/`、`src/stores/`、`src/styles/`、`src/types/`。
- `src/test/`：测试初始化与工具（`setup.ts`）。
- `public/` 静态资源；`uploads/` 用户上传文件。
- `scripts/`、`scripts-dev/`：脚本与部署支持（详见 `README.md`）。
- `backend/`：可选的 Python 服务（独立工具链）。

## 构建、测试与本地开发命令
- `pnpm dev`：启动开发服务（Turbopack）。
- `pnpm build`：生产构建；`pnpm start`：启动生产服务。
- `pnpm lint` | `pnpm lint:fix` | `pnpm lint:strict`：ESLint 检查。
- `pnpm format` | `pnpm format:check`：Prettier 格式化与校验。
- `pnpm test` | `pnpm test:ui` | `pnpm test:coverage`：Vitest + JSDOM 测试。

## 代码风格与命名约定
- TypeScript；2 空格缩进；单引号；分号；Prettier 配置见 `.prettierrc`（含 Tailwind 插件）。
- ESLint 基于 `next/core-web-vitals`，规则见 `.eslintrc.json`。
- 路径别名：`@/* -> src/*`，`~/* -> public/*`。
- 组件使用 PascalCase（如 `UserCard.tsx`）；Hook 以 `useX.ts` 命名。
- 功能代码按 `src/features/<feature>/` 就近组织。

## 测试规范
- 框架：Vitest（`vitest.config.ts`），环境 `jsdom`，全局启用；初始化于 `src/test/setup.ts`。
- 用例命名：`*.test.ts(x)`；就近或置于 `src/test/`。
- 组件测试推荐使用 Testing Library；覆盖率以“关键路径可用”为原则。

## 提交与 Pull Request 规范
- 提交信息简洁、祈使、可选作用域：如 `feat(table): add column filters`。
- 推送前执行：`pnpm format`、`pnpm lint`、`pnpm test`。Husky：提交时运行 lint-staged，推送时运行 `pnpm build`。
- PR 需包含：变更说明、关联 Issue、UI 变更截图、是否有破坏性变更与新环境变量；保持最小差异。

## 安全与配置提示
- 本地环境：将 `env.example.txt` 复制为 `.env.local`；敏感信息勿入库。
- Clerk / Sentry / PostHog 等需正确环境变量；Docker/NGINX/SSL 请参考 `docs/` 与 `scripts/`。
