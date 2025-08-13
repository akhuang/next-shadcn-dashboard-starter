# 内部导航页使用指南

## 功能特性

内部导航页是一个集中管理企业内部系统链接的导航门户，提供以下功能：

### 核心功能

- 🔗 **链接管理** - 分类展示内部系统链接，包含标题、描述和图标
- ⭐ **收藏功能** - 可以收藏常用链接，方便快速访问
- 🕐 **最近访问** - 自动记录最近访问的8个链接
- 📱 **响应式设计** - 支持网格和列表两种视图模式
- 🎨 **主题适配** - 与系统主题保持一致

### 数据持久化

- 收藏链接和最近访问记录保存在浏览器本地存储中
- 数据不会随着刷新页面而丢失
- 清除浏览器缓存会清空这些数据

## 配置说明

### 配置文件位置

导航链接配置有两种方式：

1. **硬编码配置** (适合固定的内部系统)

   - 文件路径: `src/constants/navigation-links.ts`
   - 使用 TypeScript，支持类型检查和代码提示

2. **JSON 配置** (适合需要频繁修改的场景)
   - 文件路径: `src/config/navigation-config.json`
   - 纯 JSON 格式，易于编辑和维护

### 配置结构

```typescript
interface NavigationLink {
  id: string; // 唯一标识符
  title: string; // 链接标题
  description: string; // 链接描述
  url: string; // 链接地址
  icon?: string; // 图标名称（可选）
  isExternal?: boolean; // 是否外部链接（默认 true）
}

interface NavigationCategory {
  id: string; // 分类唯一标识符
  title: string; // 分类标题
  description?: string; // 分类描述（可选）
  links: NavigationLink[]; // 该分类下的链接列表
  icon?: string; // 分类图标（可选）
}
```

### 支持的图标

系统使用 Lucide React 图标库，常用图标包括：

- `Globe` - 地球
- `Code` - 代码
- `Database` - 数据库
- `GitBranch` - Git分支
- `Shield` - 盾牌
- `Monitor` - 显示器
- `Users` - 用户
- `Settings` - 设置
- `Cloud` - 云
- `Package` - 包
- `Cpu` - CPU
- `Gauge` - 仪表盘
- `FileText` - 文件

### 自定义配置示例

修改 `src/constants/navigation-links.ts`:

```typescript
// 添加新的常用链接
export const frequentlyUsedLinks: NavigationLink[] = [
  {
    id: 'my-system',
    title: '我的系统',
    description: '系统描述',
    url: 'https://my-system.company.com',
    icon: Monitor,
    isExternal: true
  }
  // ... 其他链接
];

// 添加新的分类
export const navigationCategories: NavigationCategory[] = [
  {
    id: 'custom-category',
    title: '自定义分类',
    description: '分类描述',
    icon: Settings,
    links: [
      {
        id: 'custom-link',
        title: '自定义链接',
        description: '链接描述',
        url: 'https://custom.company.com',
        icon: Globe,
        isExternal: true
      }
    ]
  }
  // ... 其他分类
];
```

## 使用说明

### 访问导航页

1. 导航页已设置为系统默认首页
2. 也可以通过侧边栏的"内部导航"菜单访问
3. 快捷键: `N + N` 快速跳转到导航页

### 功能使用

1. **切换视图**: 点击右上角的网格/列表图标切换视图模式
2. **收藏链接**: 鼠标悬停在链接卡片上，点击星星图标收藏
3. **访问链接**: 点击卡片即可打开链接（外部链接会在新标签页打开）
4. **查看最近访问**: 页面底部显示最近访问的8个链接
5. **清空记录**: 点击"最近访问"区域的"清空"按钮清除历史记录

### 快速定制

如果需要快速替换为您的内部系统链接：

1. 打开 `src/constants/navigation-links.ts`
2. 替换示例 URL 为您的实际系统地址
3. 修改标题和描述为实际系统名称
4. 保存文件后刷新页面即可生效

## 注意事项

1. **URL 格式**: 确保所有 URL 都是完整的（包含 https:// 或 http://）
2. **唯一 ID**: 每个链接的 ID 必须唯一，否则可能导致收藏功能异常
3. **图标引入**: 如果使用新图标，需要先从 lucide-react 导入
4. **本地存储**: 收藏和历史记录存储在浏览器本地，不会同步到其他设备

## 故障排除

### 链接无法打开

- 检查 URL 是否正确
- 确认是否需要 VPN 或内网访问
- 检查浏览器是否阻止了弹出窗口

### 收藏功能不工作

- 检查浏览器是否启用了本地存储
- 清除浏览器缓存后重试
- 确保链接 ID 唯一

### 图标不显示

- 确认图标名称正确
- 检查是否正确导入了图标组件
- 查看控制台是否有错误信息
