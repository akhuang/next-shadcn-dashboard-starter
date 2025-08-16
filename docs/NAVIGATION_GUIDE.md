# 内部导航系统使用指南

## 📋 功能概述

内部导航系统是一个企业级的系统导航门户，为用户提供快速访问内部系统和工具的统一入口。

### 核心特性

- **65+ 预配置链接**: 覆盖9大分类的企业常用系统
- **智能搜索**: 支持按标题和描述实时搜索
- **收藏管理**: 收藏常用链接，快速访问
- **访问历史**: 自动记录最近访问的8个系统
- **双视图模式**: 网格视图和列表视图自由切换
- **响应式设计**: 完美适配桌面端和移动端
- **数据持久化**: 使用 Zustand + localStorage 保存用户偏好

## 🚀 快速使用

### 访问方式

1. **默认首页**: 系统已设置导航页为默认首页
2. **侧边栏菜单**: 点击"内部导航"菜单项
3. **快捷键**: 按 `N + N` 快速跳转
4. **直接访问**: `/dashboard/navigation`

### 基本操作

| 功能 | 操作说明 |
|------|---------|
| 搜索系统 | 在顶部搜索框输入关键词 |
| 切换视图 | 点击右上角网格/列表图标 |
| 收藏链接 | 鼠标悬停显示星星，点击收藏 |
| 访问系统 | 点击卡片打开（外部链接新标签页） |
| 查看历史 | 页面底部显示最近8个访问记录 |
| 清空记录 | 点击最近访问区域的"清空"按钮 |

## ⚙️ 配置指南

### 配置文件位置

系统支持两种配置方式：

1. **TypeScript 配置** (推荐，支持类型检查)
   ```
   src/constants/navigation-links.ts
   ```

2. **JSON 配置** (易于编辑)
   ```
   src/config/navigation-config.json
   ```

### 数据结构

```typescript
// 链接定义
interface NavigationLink {
  id: string;           // 唯一标识符
  title: string;        // 链接标题
  description: string;  // 链接描述
  url: string;         // 链接地址
  icon?: string;       // 图标名称（可选）
  isExternal?: boolean; // 是否外部链接（默认 true）
}

// 分类定义
interface NavigationCategory {
  id: string;                  // 分类唯一标识符
  title: string;               // 分类标题
  description?: string;        // 分类描述（可选）
  links: NavigationLink[];     // 该分类下的链接列表
  icon?: string;              // 分类图标（可选）
}
```

### 添加自定义链接

编辑 `src/constants/navigation-links.ts`：

```typescript
// 添加到常用链接
export const frequentlyUsedLinks: NavigationLink[] = [
  {
    id: 'my-system',
    title: '我的系统',
    description: '系统描述信息',
    url: 'https://my-system.company.com',
    icon: 'Monitor',
    isExternal: true
  }
  // ... 其他链接
];

// 添加新分类
export const navigationCategories: NavigationCategory[] = [
  {
    id: 'custom-tools',
    title: '自定义工具',
    description: '团队自定义工具集',
    icon: 'Settings',
    links: [
      {
        id: 'tool-1',
        title: '工具名称',
        description: '工具描述',
        url: 'https://tool.company.com',
        icon: 'Globe'
      }
    ]
  }
  // ... 其他分类
];
```

## 📦 预配置的系统分类

| 分类 | 系统数量 | 主要系统 |
|------|----------|----------|
| **开发工具** | 7个 | GitLab, SonarQube, Nexus, Harbor, CodeReview |
| **运维平台** | 9个 | Jenkins, Prometheus, Grafana, Kubernetes, Rancher |
| **文档协作** | 7个 | Confluence, Wiki, API文档, Swagger UI, GitBook |
| **项目管理** | 8个 | Jira, Redmine, Teams, Slack, Trello |
| **数据服务** | 8个 | phpMyAdmin, Redis, Elasticsearch, Kibana, MongoDB |
| **云服务** | 7个 | AWS, 阿里云, 腾讯云, 华为云, Azure |
| **安全管理** | 5个 | HashiCorp Vault, Keycloak, Fortify, Splunk |
| **媒体资源** | 4个 | CDN管理, 对象存储, 图片处理, 视频处理 |
| **支持与帮助** | 5个 | 服务台, 知识库, 常见问题, 培训平台 |

## 🎨 支持的图标

系统使用 Lucide React 图标库，常用图标：

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
- `HelpCircle` - 帮助
- `MessageSquare` - 消息

完整图标列表请访问 [Lucide Icons](https://lucide.dev/icons)

## 🔧 故障排除

### 常见问题

**链接无法打开**
- 检查 URL 格式是否完整（包含 https:// 或 http://）
- 确认是否需要 VPN 或内网访问
- 检查浏览器是否阻止了弹出窗口

**收藏功能不工作**
- 检查浏览器是否启用了本地存储
- 清除浏览器缓存后重试
- 确保每个链接的 ID 唯一

**图标不显示**
- 确认图标名称正确（区分大小写）
- 检查是否正确导入了图标组件
- 查看控制台是否有错误信息

**搜索无结果**
- 检查搜索关键词拼写
- 尝试使用部分关键词
- 确认链接配置文件已保存

## 💾 数据存储

- **存储位置**: 浏览器 localStorage
- **存储内容**: 收藏链接ID、访问历史、视图偏好
- **数据隔离**: 每个浏览器独立存储，不同步
- **清除方式**: 清除浏览器缓存会删除所有数据

## 🚀 性能优化

### 布局优化
- 响应式网格最大支持8列
- 紧凑卡片设计，充分利用屏幕空间
- 虚拟滚动优化长列表性能

### 响应式断点
| 屏幕尺寸 | 网格列数 |
|----------|----------|
| < 640px | 2列 |
| 640px+ | 3列 |
| 768px+ | 4列 |
| 1024px+ | 6列 |
| 1280px+ | 8列 |

## 📝 注意事项

1. **唯一 ID**: 每个链接必须有唯一的 ID
2. **URL 格式**: 确保所有 URL 都是完整的
3. **图标引入**: 使用新图标需要先从 lucide-react 导入
4. **本地存储**: 数据不会同步到其他设备或浏览器
5. **定期维护**: 建议定期检查链接可用性

## 🔮 后续规划

- [ ] 系统状态监控（在线/离线指示器）
- [ ] 访问统计和使用分析
- [ ] 多语言支持（中英文切换）
- [ ] 基于角色的链接权限控制
- [ ] 批量导入/导出链接配置
- [ ] 链接健康度自动检查
- [ ] 个人工作台自定义布局