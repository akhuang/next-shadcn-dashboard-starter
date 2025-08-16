# 自托管分析服务使用指南

## 概述

本项目集成了自托管的 Plausible Analytics，提供隐私友好的网站分析功能。所有数据都存储在本地服务器，不会发送到任何外部服务。

## 快速开始

### 1. 启动分析服务

```bash
# 启动所有分析相关的 Docker 容器
./scripts/deploy-analytics.sh --up

# 初始化管理员账户（首次使用）
./scripts/deploy-analytics.sh --init
```

### 2. 访问分析面板

- **直接访问**: http://localhost:8000
- **通过应用代理**: https://your-domain/analytics
- **默认账户**: admin@example.com / changeme123

⚠️ **重要**: 首次登录后请立即修改默认密码！

### 3. 配置网站

登录后，在 Plausible 面板中添加你的网站域名，即可开始收集数据。

## 自动追踪的数据

Plausible 会自动追踪以下数据（无需额外配置）：

- 📊 **页面浏览量**: 每个页面的访问次数
- 👥 **唯一访客**: 基于设备指纹（不使用 Cookie）
- 🔗 **访问来源**: 用户从哪里来（搜索引擎、社交媒体、直接访问等）
- ⏱️ **会话时长**: 用户在网站停留的时间
- 📱 **设备信息**: 桌面/移动设备、操作系统、浏览器
- 🌍 **地理位置**: 访客所在国家和城市（基于 IP，匿名化）
- 📈 **实时数据**: 当前在线用户数

## 自定义事件追踪

### 使用内置的追踪函数

项目提供了 `src/lib/analytics.ts` 工具库，可以方便地追踪自定义事件：

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

对于单页应用的路由切换，Plausible 会自动检测并追踪。如需手动触发：

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

## 配置目标和转化

在 Plausible 面板中，你可以设置转化目标：

1. 登录 Plausible 面板
2. 进入网站设置
3. 点击 "Goals" 标签
4. 添加自定义目标（如 "Signup", "Purchase", "Download"）

然后在代码中追踪这些目标：

```typescript
// 用户完成注册时
trackGoal('Signup');

// 用户完成购买时
trackGoal('Purchase', orderAmount);
```

## 环境变量配置

### 本地开发 (`.env.local`)

```env
# 你的网站域名
NEXT_PUBLIC_SITE_DOMAIN=localhost:3000

# 是否启用分析（开发时可以关闭）
NEXT_PUBLIC_ANALYTICS_ENABLED=true
```

### 生产环境 (`scripts/docker/.env.prod`)

```env
# 生产环境域名
NEXT_PUBLIC_SITE_DOMAIN=your-domain.com

# 启用分析
NEXT_PUBLIC_ANALYTICS_ENABLED=true

# Plausible 配置
PLAUSIBLE_BASE_URL=https://your-domain.com/analytics
PLAUSIBLE_SECRET_KEY=<生成一个64字符的随机字符串>
PLAUSIBLE_ADMIN_EMAIL=admin@your-domain.com
PLAUSIBLE_ADMIN_PASSWORD=<安全的密码>
```

## 数据隐私和合规

### 隐私特点

- ✅ **无 Cookie**: 不使用任何 Cookie，无需显示 Cookie 横幅
- ✅ **GDPR 合规**: 默认符合 GDPR 要求，无需用户同意
- ✅ **匿名化**: 不收集任何个人身份信息
- ✅ **数据所有权**: 所有数据存储在你自己的服务器上
- ✅ **开源透明**: Plausible 是完全开源的项目

### 数据存储

所有分析数据存储在 Docker 容器的本地卷中：
- PostgreSQL: 存储配置和聚合数据
- ClickHouse: 存储原始事件数据

### 数据备份

```bash
# 备份分析数据
docker run --rm \
  -v plausible-db-data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/plausible-backup.tar.gz -C /data .

# 恢复数据
docker run --rm \
  -v plausible-db-data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/plausible-backup.tar.gz -C /data
```

## 性能影响

- **追踪脚本大小**: < 1KB (gzipped)
- **请求数量**: 每次页面浏览只发送 1 个请求
- **异步加载**: 不阻塞页面渲染
- **本地服务**: 数据不需要发送到外部服务器，延迟更低

## 故障排查

### 分析数据未显示

1. 检查服务是否运行：
   ```bash
   ./scripts/deploy-analytics.sh --status
   ```

2. 检查环境变量：
   ```bash
   # 确保设置了正确的域名
   echo $NEXT_PUBLIC_SITE_DOMAIN
   ```

3. 查看浏览器控制台是否有错误

### 无法访问分析面板

1. 检查 Docker 容器日志：
   ```bash
   ./scripts/deploy-analytics.sh --logs
   ```

2. 确保端口未被占用：
   ```bash
   lsof -i :8000
   ```

### 重置管理员密码

如果忘记管理员密码，可以通过以下命令重置：

```bash
docker exec -it plausible-analytics sh -c \
  "bin/plausible eval 'Plausible.Auth.User |> Plausible.Repo.get_by(email: \"admin@example.com\") |> Plausible.Auth.User.set_password(\"new_password\") |> Plausible.Repo.update!()'"
```

## 进阶配置

### 启用邮件通知

编辑 `docker-compose.analytics.yml`，添加 SMTP 配置：

```yaml
environment:
  - MAILER_ENABLED=true
  - SMTP_HOST_ADDR=smtp.gmail.com
  - SMTP_HOST_PORT=587
  - SMTP_USER_NAME=your-email@gmail.com
  - SMTP_USER_PWD=your-app-password
  - SMTP_HOST_SSL_ENABLED=true
```

### 自定义追踪脚本

如需更多追踪功能，可以使用扩展版本的脚本：

```typescript
// 在 clarity.tsx 中修改脚本路径
const scriptSrc = selfHosted 
  ? '/js/script.tagged-events.js'  // 支持自定义属性
  : 'https://plausible.io/js/script.js';
```

可用的脚本变体：
- `script.js` - 标准版本
- `script.tagged-events.js` - 支持自定义事件属性
- `script.revenue.js` - 支持收入追踪
- `script.outbound-links.js` - 自动追踪外链

## 相关资源

- [Plausible 官方文档](https://plausible.io/docs)
- [Plausible GitHub](https://github.com/plausible/analytics)
- [事件追踪 API](https://plausible.io/docs/custom-event-goals)
- [配置指南](https://plausible.io/docs/self-hosting-configuration)