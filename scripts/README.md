# Excel 测试数据管理脚本

这个目录包含了用于生成和管理 Excel 测试数据的脚本工具集。

## 🎯 主要脚本

### 1. 生成测试数据
```bash
npm run excel:generate
# 或者
node scripts/generate-all-test-data.js
```
**功能**：生成所有类型的测试 Excel 文件
- 📋 联系人数据（员工、客户、供应商）
- 🧭 导航数据（开发工具、框架、服务等分类链接）
- 📊 报表数据（销售、财务、人力资源）
- 🐳 Docker 测试数据
- 📈 大数据测试（1000行记录）
- 🔗 合并单元格测试数据

**输出目录**：
- `/tmp/test-contacts` - 联系人数据
- `/tmp/test-navigation` - 导航数据
- `/tmp/reports-business1` - 业务报表数据
- `./scripts/docker/excel-data` - Docker 环境数据

### 2. 清理测试数据
```bash
npm run excel:clean
# 或者
node scripts/clean-test-data.js
```
**功能**：
- 清理所有测试目录中的 Excel 文件
- 清理 Redis 缓存中的相关数据
- 为重新生成数据做准备

### 3. 启动 Excel 监控服务
```bash
npm run excel:monitor
# 或者
node scripts/start-excel-monitor.js
```
**功能**：
- 启动后台 Excel 文件监控服务
- 自动创建监控目录
- 实时监控文件变化并更新缓存
- 提供日志记录和优雅关闭

**环境变量**：
- `EXCEL_WATCH_DIR` - 联系人数据目录
- `NAVIGATION_EXCEL_DIR` - 导航数据目录  
- `REPORTS_BUSINESS1_DIR` - 报表数据目录
- `REDIS_HOST` - Redis 服务器地址
- `REDIS_PORT` - Redis 端口

### 4. 检查服务状态
```bash
npm run excel:status
# 或者
node scripts/start-excel-monitor.js status
```
**功能**：检查 Excel 监控服务运行状态和 Redis 中的缓存信息

### 5. 查看服务日志
```bash
npm run excel:logs
# 或者
node scripts/start-excel-monitor.js logs
```
**功能**：查看 Excel 监控服务的运行日志

### 6. 一键设置
```bash
npm run excel:setup
```
**功能**：清理 + 生成，一键重置所有测试数据

## 🚀 快速开始

1. **初始化测试数据**：
   ```bash
   npm run excel:setup
   ```

2. **启动监控服务**：
   ```bash
   npm run excel:monitor
   ```

3. **启动前端应用**：
   ```bash
   npm run dev
   ```

4. **访问联系人管理页面**：
   ```
   http://localhost:3001/dashboard/contacts
   ```

## 📊 生成的测试数据类型

### 联系人数据 (`/tmp/test-contacts`)
- **员工信息**：姓名、部门、职位、邮箱、电话、入职日期、状态
- **客户信息**：客户名称、联系人、电话、邮箱、地址、行业、客户等级
- **供应商信息**：供应商名称、联系人、电话、邮箱、产品类型、合作状态
- **大数据测试**：1000行员工记录
- **合并单元格测试**：复杂表格结构

### 导航数据 (`/tmp/test-navigation`)
- **开发工具**：VS Code、GitHub、GitLab、Docker、Kubernetes
- **前端框架**：React、Vue.js、Angular、Next.js、Nuxt.js
- **后端技术**：Node.js、Django、Spring Boot、Express.js、FastAPI
- **数据库**：MongoDB、PostgreSQL、Redis、MySQL、Elasticsearch
- **云服务**：AWS、Azure、Google Cloud、阿里云、腾讯云
- **监控工具**：Grafana、Prometheus、ELK Stack、New Relic、Sentry
- **设计工具**：Figma、Sketch、Adobe XD、Canva
- **学习资源**：MDN、Stack Overflow、GitHub Awesome、FreeCodeCamp、Coursera

### 报表数据 (`/tmp/reports-business1`)
- **销售报表**：日期、销售员、客户、产品、数量、金额、地区
- **财务报表**：月度收入、成本、利润、利润率
- **人力资源报表**：部门人数、薪资、绩效、培训、满意度

### Docker 数据 (`./scripts/docker/excel-data`)
- **产品目录**：产品ID、名称、分类、价格、库存、供应商、状态
- **订单记录**：订单号、客户、产品、数量、金额、日期、状态

## 🔧 高级用法

### 自定义监控目录
```javascript
// 修改 scripts/start-excel-monitor.js 中的配置
const MONITOR_CONFIG = {
  env: {
    EXCEL_WATCH_DIR: '/your/custom/contacts/path',
    NAVIGATION_EXCEL_DIR: '/your/custom/navigation/path',
    REPORTS_BUSINESS1_DIR: '/your/custom/reports/path'
  }
};
```

### 自定义生成数据
```javascript
// 修改 scripts/generate-all-test-data.js 中的 OUTPUT_DIRS
const OUTPUT_DIRS = {
  contacts: '/your/custom/path',
  // ...
};
```

### 添加新的数据源
1. 在 `excel-monitor-service/index-enhanced.js` 中添加新的 MONITOR_CONFIGS
2. 在生成脚本中添加对应的数据生成函数
3. 在前端添加新的 dataSource 支持

## 📝 日志文件

- **监控服务日志**：`/tmp/excel-monitor.log`
- **包含内容**：启动信息、文件处理记录、错误信息、关闭记录

## ⚠️ 注意事项

1. **Redis 依赖**：所有脚本都需要 Redis 服务运行
2. **目录权限**：确保对 `/tmp` 目录有读写权限
3. **端口冲突**：Next.js 默认使用 3000 端口，冲突时会自动使用 3001
4. **监控服务**：同时只能运行一个 Excel 监控服务实例
5. **数据格式**：Excel 文件必须符合预期的列结构才能正确解析

## 🐛 故障排除

### 数据不显示
1. 检查 Excel 监控服务是否运行：`npm run excel:status`
2. 检查 Redis 连接：确保 Redis 服务正常运行
3. 检查测试数据是否存在：查看相应的监控目录
4. 查看服务日志：`npm run excel:logs`

### 服务启动失败
1. 检查端口占用情况
2. 检查 Redis 连接配置
3. 确保监控目录存在并有适当权限
4. 检查 Node.js 版本兼容性

### 缓存不更新
1. 重启监控服务：`Ctrl+C` 然后重新运行 `npm run excel:monitor`
2. 清理并重新生成数据：`npm run excel:setup`
3. 手动清理 Redis 缓存：`npm run excel:clean`

## 📋 TODO

- [ ] 添加 Excel 文件格式验证
- [ ] 支持更多 Excel 文件格式（.xlsb, .csv）
- [ ] 添加数据导入导出功能
- [ ] 支持多语言数据生成
- [ ] 添加性能监控和指标收集
- [ ] 支持集群模式部署