# Chrome Extension 联系人查询助手 - 架构设计文档

## 📋 项目概述

### 背景与需求

企业用户在使用内部系统时经常需要查询联系人信息，传统方式需要：
1. 从当前系统复制关键信息
2. 切换到联系人查询系统
3. 粘贴并搜索
4. 再切换回原系统使用

这种方式效率低下且容易出错。本项目通过 Chrome Extension 实现无缝集成，让用户在不离开当前页面的情况下快速查询和使用联系人信息。

### 核心价值

- **无缝集成**：不需要切换系统，保持工作流连续性
- **智能识别**：自动识别页面中的关键信息
- **快速查询**：一键查询，结果即时展示
- **便捷使用**：支持快速复制、批量处理

## 🏗️ 系统架构

### 整体架构图

```
┌────────────────────────────────────────────────────────────┐
│                      Chrome Browser                         │
│                                                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                   内部系统网页                        │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  DOM Content (Tables, Forms, etc.)          │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  │                          ↕                           │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │  Content Script                              │    │  │
│  │  │  - DOM 监听和分析                            │    │  │
│  │  │  - 数据提取和识别                            │    │  │
│  │  │  - UI 注入和渲染                             │    │  │
│  │  └─────────────────────────────────────────────┘    │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Service Worker (Background)                         │  │
│  │  - API 通信管理                                      │  │
│  │  - 缓存管理                                          │  │
│  │  - 状态同步                                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Extension Popup                                     │  │
│  │  - 快速搜索                                          │  │
│  │  - 设置管理                                          │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
                           ↕ HTTPS API
┌────────────────────────────────────────────────────────────┐
│                    Next.js Application                      │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  API Routes                                          │  │
│  │  - /api/contacts/search                              │  │
│  │  - /api/contacts/batch                               │  │
│  │  - /api/extension/auth                               │  │
│  └──────────────────────────────────────────────────────┘  │
│                          ↕                                  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Excel Data Service                                  │  │
│  │  - 文件读取和解析                                    │  │
│  │  - 数据索引和搜索                                    │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

### 技术栈

**Chrome Extension**
- Manifest V3
- Content Scripts (原生 JavaScript)
- Service Worker (后台服务)
- Chrome Storage API (配置存储)
- Chrome Runtime API (消息通信)

**后端服务**
- Next.js 15 (API Routes)
- TypeScript
- Excel 数据服务
- JWT 认证

## 📁 项目结构

```
chrome-extension/
├── manifest.json                 # Extension 配置清单
├── background/
│   └── service-worker.js        # 后台服务脚本
├── content/
│   ├── main.js                  # 内容脚本主入口
│   ├── detector.js              # 页面元素检测器
│   ├── extractor.js             # 数据提取器
│   ├── ui/
│   │   ├── floating-button.js  # 悬浮按钮
│   │   ├── sidebar.js           # 侧边栏
│   │   ├── inline-results.js    # 行内结果
│   │   └── quick-card.js        # 快速卡片
│   └── styles/
│       └── content.css          # 注入样式
├── popup/
│   ├── popup.html               # 弹出窗口页面
│   ├── popup.js                 # 弹出窗口脚本
│   └── popup.css                # 弹出窗口样式
├── options/
│   ├── options.html             # 设置页面
│   ├── options.js               # 设置脚本
│   └── options.css              # 设置样式
├── icons/
│   ├── icon-16.png             # 工具栏图标
│   ├── icon-48.png             # 扩展管理图标
│   └── icon-128.png            # 商店图标
└── lib/
    ├── api.js                   # API 通信模块
    ├── storage.js               # 存储管理
    └── utils.js                 # 工具函数
```

## 🔧 核心功能模块

### 1. 内容检测与提取

**智能表格识别**
```javascript
// detector.js
class TableDetector {
  // 检测页面中的表格
  detectTables() {
    const tables = document.querySelectorAll('table');
    return Array.from(tables).map(table => ({
      element: table,
      headers: this.extractHeaders(table),
      keyColumns: this.identifyKeyColumns(table),
      dataRows: this.extractDataRows(table)
    }));
  }

  // 识别关键列（姓名、电话、邮箱等）
  identifyKeyColumns(table) {
    const patterns = {
      name: /姓名|名字|用户|name|user/i,
      phone: /电话|手机|tel|mobile|phone/i,
      email: /邮箱|邮件|email|mail/i,
      dept: /部门|科室|department|dept/i,
      title: /职位|职务|岗位|title|position/i
    };
    // 实现列识别逻辑
  }
}
```

**文本选择监听**
```javascript
// extractor.js
class TextExtractor {
  constructor() {
    this.setupSelectionListener();
  }

  setupSelectionListener() {
    document.addEventListener('mouseup', () => {
      const selection = window.getSelection().toString().trim();
      if (selection && this.isValidQuery(selection)) {
        this.showQueryButton(selection);
      }
    });
  }
}
```

### 2. UI 组件

**悬浮按钮**
- 自动出现在表格旁
- 点击触发查询
- 显示匹配数量

**侧边栏**
- 完整搜索结果
- 支持过滤和排序
- 批量操作

**行内展示**
- 最小化干扰
- 快速预览
- 一键复制

**快捷卡片**
- 悬停显示
- 关键信息展示
- 快速操作

### 3. API 通信

**认证机制**
```javascript
// api.js
class APIClient {
  constructor() {
    this.baseURL = 'https://your-domain.com/api';
    this.token = null;
  }

  async authenticate() {
    const { apiKey } = await chrome.storage.sync.get('apiKey');
    const response = await fetch(`${this.baseURL}/extension/auth`, {
      method: 'POST',
      headers: { 'X-API-Key': apiKey }
    });
    const { token } = await response.json();
    this.token = token;
  }

  async searchContacts(query, options = {}) {
    const response = await fetch(`${this.baseURL}/contacts/search`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ query, ...options })
    });
    return response.json();
  }
}
```

### 4. 消息通信

```javascript
// Content Script -> Service Worker
chrome.runtime.sendMessage({
  type: 'SEARCH_CONTACT',
  payload: { query: '张三' }
});

// Service Worker -> Content Script
chrome.tabs.sendMessage(tabId, {
  type: 'SEARCH_RESULT',
  payload: { results: [...] }
});
```

## 🔌 API 设计

### 搜索接口

**POST /api/contacts/search**
```typescript
interface SearchRequest {
  query: string;          // 搜索关键词
  mode: 'smart' | 'exact' | 'fuzzy';
  fields?: string[];      // 指定搜索字段
  limit?: number;         // 结果数量限制
}

interface SearchResponse {
  results: Contact[];
  total: number;
  suggestion?: string;    // 搜索建议
}
```

### 批量查询接口

**POST /api/contacts/batch**
```typescript
interface BatchSearchRequest {
  queries: Array<{
    id: string;
    query: string;
    fields?: string[];
  }>;
}

interface BatchSearchResponse {
  results: Array<{
    id: string;
    matches: Contact[];
  }>;
}
```

### 认证接口

**POST /api/extension/auth**
```typescript
interface AuthRequest {
  apiKey: string;
}

interface AuthResponse {
  token: string;
  expiresIn: number;
  permissions: string[];
}
```

## 🎯 使用场景

### 场景 1：单个查询
1. 用户选中页面中的姓名
2. 出现查询按钮
3. 点击查询
4. 显示联系人卡片
5. 复制需要的信息

### 场景 2：表格增强
1. 检测到包含姓名的表格
2. 在表格旁显示"增强"按钮
3. 点击后自动查询所有姓名
4. 在每行末尾添加联系信息

### 场景 3：批量处理
1. 框选多行数据
2. 触发批量查询
3. 显示所有结果
4. 支持导出或批量复制

## 🔒 安全设计

### 权限最小化
```json
{
  "permissions": [
    "activeTab",      // 仅当前标签页
    "storage",        // 存储配置
    "contextMenus"    // 右键菜单
  ],
  "host_permissions": [
    "https://your-api-domain.com/*"
  ]
}
```

### 数据安全
- API Key 加密存储
- Token 定期刷新
- 敏感数据不缓存
- HTTPS 通信

### 隐私保护
- 不收集用户浏览数据
- 查询历史本地存储
- 可选的数据同步

## 📈 性能优化

### 缓存策略
```javascript
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.maxSize = 100;
    this.ttl = 5 * 60 * 1000; // 5分钟
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.data;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }
}
```

### 懒加载
- 按需加载 UI 组件
- 延迟初始化非关键功能
- 虚拟滚动长列表

### 防抖与节流
```javascript
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}
```

## 🚀 部署计划

### Phase 1: MVP (1周)
- [x] 架构设计
- [ ] 基础 Extension 结构
- [ ] 选中文本查询
- [ ] 简单结果显示
- [ ] API 集成

### Phase 2: 核心功能 (2周)
- [ ] 表格自动识别
- [ ] 批量查询
- [ ] 多种展示模式
- [ ] 缓存优化

### Phase 3: 增强功能 (2周)
- [ ] 自定义规则
- [ ] 高级搜索
- [ ] 数据导出
- [ ] 使用统计

### Phase 4: 智能化 (持续)
- [ ] 机器学习优化
- [ ] 智能推荐
- [ ] 跨系统关联

## 📊 成功指标

- **效率提升**：查询时间减少 80%
- **用户满意度**：NPS > 8
- **使用率**：日活跃用户 > 70%
- **性能**：响应时间 < 500ms

## 🔄 维护计划

### 版本管理
- 主版本：重大功能更新
- 次版本：功能增强
- 补丁版本：Bug 修复

### 监控与反馈
- 错误追踪
- 使用分析
- 用户反馈收集

### 持续改进
- 定期代码审查
- 性能优化
- 安全更新

## 📚 参考资源

- [Chrome Extension 开发文档](https://developer.chrome.com/docs/extensions/mv3/)
- [Next.js API Routes](https://nextjs.org/docs/api-routes/introduction)
- [Web Extensions API](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions)

---

最后更新：2024年12月