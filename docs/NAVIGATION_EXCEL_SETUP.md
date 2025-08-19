# 内部导航系统 Excel 集成指南

## 系统架构

内部导航系统采用了分离的架构设计：

1. **Excel Monitor Service** - 独立的 Node.js 服务，负责监控 Excel 文件变化并更新 Redis
2. **Next.js Web 应用** - 只从 Redis 读取数据，提供用户界面

```
Excel文件 → Excel Monitor Service → Redis → Next.js应用 → 用户界面
```

## 快速开始

### 1. 准备测试数据

```bash
# 创建导航数据的测试 Excel 文件
node scripts/create-navigation-excel.js
```

这会在 `/tmp/test-navigation/navigation.xlsx` 创建一个包含50个系统、8个分类的测试文件。

### 2. 启动 Excel Monitor Service

```bash
# 进入监控服务目录
cd excel-monitor-service

# 安装依赖（如果还没安装）
npm install

# 启动增强版监控服务
./start-enhanced.sh
```

服务会同时监控：
- `/tmp/test-contacts` - 联系人数据
- `/tmp/test-navigation` - 导航数据

### 3. 访问导航页面

启动 Next.js 开发服务器后，访问：
```
http://localhost:3000/dashboard/navigation
```

## Excel 文件格式

导航数据 Excel 文件需要包含以下列：

| 列名 | 说明 | 示例 |
|-----|------|------|
| 类别 | 系统分类 | 开发工具 |
| 名字 | 系统名称 | GitLab |
| 链接 | 系统URL | https://gitlab.company.com |
| 说明 | 系统描述 | 代码仓库管理平台 |

## 功能特性

### 用户个性化
- **最近访问** - 自动记录最近访问的20个系统
- **收藏功能** - 点击星标收藏常用系统
- **访问计数** - 统计每个系统的访问次数

### 数据缓存
- 导航数据缓存24小时
- 用户数据缓存7天
- 自动监控文件变化并更新

### 搜索和筛选
- 实时搜索过滤
- 按分类查看
- 网格/列表视图切换

## 生产环境配置

### 环境变量

在 `.env` 文件中配置：

```env
# Excel Monitor Service
EXCEL_WATCH_DIR=/path/to/contacts/excel
NAVIGATION_EXCEL_DIR=/path/to/navigation/excel
REDIS_HOST=your-redis-host
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
REDIS_DB=0
```

### Docker 部署

1. 使用提供的 `excel-monitor-service/Dockerfile` 构建镜像
2. 挂载 Excel 文件目录到容器
3. 配置 Redis 连接

```bash
docker build -t excel-monitor ./excel-monitor-service
docker run -d \
  -v /path/to/excel:/tmp/test-navigation \
  -e REDIS_HOST=redis \
  excel-monitor
```

## 自定义导航数据

### 修改 Excel 文件

1. 打开 `/tmp/test-navigation/navigation.xlsx`
2. 按照格式添加或修改系统信息
3. 保存文件，系统会自动检测并更新

### 添加新分类

只需在 Excel 中使用新的"类别"名称，系统会自动创建新分类。

### 批量导入

可以从现有系统导出数据，转换为指定格式后导入：

```javascript
// 示例：批量导入脚本
const data = [
  { 类别: '新分类', 名字: '系统1', 链接: 'url1', 说明: '描述1' },
  // ... 更多数据
];

// 使用 xlsx 库创建文件
const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, '导航数据');
XLSX.writeFile(wb, '/tmp/test-navigation/navigation.xlsx');
```

## 监控和运维

### 查看服务状态

Excel Monitor Service 会在 Redis 中记录状态：

```javascript
// Redis 键
monitor:service:status  // 服务运行状态
navigation:last_update  // 最后更新时间
navigation:file_status  // 文件处理状态
```

### 日志查看

服务会输出详细日志：
- 文件变化检测
- 数据处理进度
- 错误信息

### 故障排查

1. **页面无数据**
   - 检查 Excel Monitor Service 是否运行
   - 检查 Redis 连接是否正常
   - 查看服务日志是否有错误

2. **数据不更新**
   - 检查文件路径是否正确
   - 确认文件格式符合要求
   - 查看文件权限

3. **性能问题**
   - 大文件会自动分页处理
   - Redis 缓存减少重复处理
   - 可调整缓存时间

## 扩展开发

### 添加新的数据类型

在 `excel-monitor-service/index-enhanced.js` 中添加新的监控配置：

```javascript
const MONITOR_CONFIGS = {
  // ... 现有配置
  newType: {
    watchDir: process.env.NEW_TYPE_DIR,
    redisPrefix: 'newtype',
    processor: 'custom'
  }
};
```

### 自定义处理器

实现自定义的 Excel 处理逻辑：

```javascript
async function processCustomFile(fileInfo, config) {
  // 自定义处理逻辑
}
```

## 最佳实践

1. **文件管理**
   - 使用版本控制管理 Excel 模板
   - 定期备份重要数据
   - 避免文件过大（建议 < 10MB）

2. **性能优化**
   - 合理设置缓存时间
   - 使用分类减少单页数据量
   - 优化 Excel 文件结构

3. **安全考虑**
   - 限制文件上传权限
   - 验证 URL 格式
   - 定期审计系统访问日志

## 相关文档

- [Excel Monitor Service README](../excel-monitor-service/README.md)
- [Redis 配置指南](./DEVELOPMENT_REDIS_SETUP.md)
- [导航页面组件](../src/features/navigation/components/navigation-excel-page.tsx)