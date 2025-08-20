# 行为分析（PostHog）使用指南

## 概述

本项目集成了 PostHog 前端 SDK，用于用户行为分析与事件追踪。支持云端托管或自建服务。

## 快速开始

### 1. 配置环境变量

在 `.env.local` 或生产环境变量中设置：

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com # 可选，自建请替换为你的域名
```

### 2. 自动用户识别

应用会在客户端初始化 PostHog 后请求 `/api/auth/session`，若用户已登录，将调用 `posthog.identify` 绑定邮箱或用户名，便于用户级别分析。

## 自动追踪的数据

PostHog 可自动或手动采集以下数据：

- 📊 **页面浏览量**: 每个页面的访问次数
- 👥 **唯一访客**: 基于设备指纹（不使用 Cookie）
- 🔗 **访问来源**: 用户从哪里来（搜索引擎、社交媒体、直接访问等）
- ⏱️ **会话时长**: 用户在网站停留的时间
- 📱 **设备信息**: 桌面/移动设备、操作系统、浏览器
- 🌍 **地理位置**: 访客所在国家和城市（基于 IP，匿名化）
- 📈 **实时数据**: 当前在线用户数

## 自定义事件追踪

### 使用内置的追踪函数

项目提供了 `src/lib/analytics.ts` 工具库（基于 PostHog 的 capture），可以方便地追踪自定义事件：

```typescript
import { 
  trackEvent, 
  trackFormSubmit, 
  trackDownload,
  trackOutboundLink,
  trackSearch,
  trackGoal 
} from '@/lib/analytics';

// 追踪表单提交
function handleSubmit() {
  trackFormSubmit('contact-form');
  // ... 表单提交逻辑
}

// 追踪文件下载
function handleDownload() {
  trackDownload('report-2024.pdf');
  // ... 下载逻辑
}

// 追踪搜索
function handleSearch(query: string) {
  trackSearch(query);
  // ... 搜索逻辑
}

// 追踪转化目标（如购买、注册等）
function handlePurchase() {
  trackGoal('Purchase', 99.99);
  // ... 购买逻辑
}

// 追踪自定义事件
function handleCustomAction() {
  trackEvent('Custom Action', {
    category: 'engagement',
    value: 'high'
  });
}
```

### 在 React 组件中使用

```tsx
import { trackEvent } from '@/lib/analytics';

export function ProductCard({ product }) {
  const handleAddToCart = () => {
    // 追踪加入购物车事件
    trackEvent('Add to Cart', {
      product_id: product.id,
      product_name: product.name,
      price: product.price
    });
    
    // 实际的加入购物车逻辑
    addToCart(product);
  };

  return (
    <button onClick={handleAddToCart}>
      加入购物车
    </button>
  );
}
```

### 追踪页面切换（SPA）

对于单页应用，PostHog 支持自动页面浏览采集；如需手动触发：

```typescript
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackPageview } from '@/lib/analytics';

export function RouteTracker() {
  const pathname = usePathname();
  
  useEffect(() => {
    trackPageview();
  }, [pathname]);
  
  return null;
}
```

## 事件与目标

PostHog 支持通过事件 + 属性的方式完成转化分析。在产品侧可使用 `trackGoal` 作为语义化封装，也可创建仪表板或漏斗进行分析。

## 环境变量配置

### 环境变量示例

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

## 数据隐私和合规

### 隐私特点

- ✅ 支持隐私保护与合规配置
- ✅ 支持匿名或实名分析
- ✅ 可选自建，数据可控

### 数据存储

若使用自建 PostHog，请参考其官方部署指引完成数据持久化配置。

## 性能与故障排查

- 确保浏览器未被广告拦截插件拦截 PostHog 网络请求。
- 在浏览器控制台执行 `posthog.debug()` 查看 SDK 状态。
- 检查环境变量 `NEXT_PUBLIC_POSTHOG_KEY` 是否正确配置。
- 若使用自建 PostHog，检查网络连通性与 CORS 设置。

### 事件命名建议

- 使用小写+下划线：`signup`, `file_download`, `outbound_link_click`
- 事件属性尽量结构化：`{ plan: 'pro', amount: 99 }`

## 相关资源

- [PostHog 官方文档](https://posthog.com/docs)
- [posthog-js SDK](https://posthog.com/docs/libraries/js)
