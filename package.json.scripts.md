# 测试数据生成脚本说明

## 已整合完成

原先散乱的测试文件生成脚本已经整合为一个统一脚本：

```bash
# 生成所有测试数据
node scripts/create-unified-test-data.js
```

## 清理的旧脚本

以下脚本可以删除（功能已整合）：

```bash
rm scripts/create-test-excel.js
rm scripts/create-large-test-data.js  
rm scripts/create-extreme-test-data.js
rm scripts/create-more-test-data.js
# create-abnormal-excel.js - 保留（特殊异常测试）
# create-merged-cells-test.js - 保留（专门测试合并单元格）
# create-irregular-table-test.js - 保留（不规则表格测试）
# create-discontinuous-merge-test.js - 保留（不连续合并测试）
```