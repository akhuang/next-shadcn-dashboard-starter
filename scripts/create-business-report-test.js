const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// 创建测试目录
const testDir = '/tmp/reports-business1';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
  console.log(`创建目录: ${testDir}`);
}

// 创建经营报表测试数据
function createBusinessReport() {
  const wb = XLSX.utils.book_new();

  // Sheet1: 销售概览
  const salesOverview = [
    ['销售概览报表', '', '', '', ''],
    ['月份', '销售额(万元)', '订单数', '客单价(元)', '同比增长'],
    ['2024年1月', 120.5, 456, 2642, '15%'],
    ['2024年2月', 98.3, 389, 2528, '-8%'],
    ['2024年3月', 156.8, 612, 2562, '23%'],
    ['2024年4月', 189.2, 745, 2540, '31%'],
    ['2024年5月', 201.6, 802, 2514, '28%'],
    ['2024年6月', 178.9, 698, 2563, '19%'],
    ['2024年7月', 195.4, 756, 2585, '22%'],
    ['2024年8月', 210.8, 823, 2561, '26%']
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(salesOverview);

  // 设置列宽
  ws1['!cols'] = [
    { wch: 15 }, // 月份
    { wch: 15 }, // 销售额
    { wch: 10 }, // 订单数
    { wch: 12 }, // 客单价
    { wch: 10 } // 同比增长
  ];

  // 添加合并单元格（标题）
  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  XLSX.utils.book_append_sheet(wb, ws1, '销售概览');

  // Sheet2: 产品分析
  const productAnalysis = [
    ['产品销售分析', '', '', '', '', ''],
    ['产品编码', '产品名称', '销售数量', '销售额(万元)', '库存', '状态'],
    ['P001', '智能手机A款', 1234, 456.7, 567, '热销'],
    ['P002', '平板电脑B款', 789, 234.5, 234, '正常'],
    ['P003', '笔记本C款', 456, 567.8, 123, '热销'],
    ['P004', '智能手表D款', 2345, 123.4, 890, '正常'],
    ['P005', '无线耳机E款', 3456, 89.2, 1234, '热销'],
    ['P006', '移动电源F款', 1890, 45.6, 567, '库存预警'],
    ['P007', '键盘G款', 678, 34.5, 89, '库存预警'],
    ['P008', '鼠标H款', 1234, 23.4, 456, '正常']
  ];
  const ws2 = XLSX.utils.aoa_to_sheet(productAnalysis);

  ws2['!cols'] = [
    { wch: 12 }, // 产品编码
    { wch: 20 }, // 产品名称
    { wch: 10 }, // 销售数量
    { wch: 15 }, // 销售额
    { wch: 10 }, // 库存
    { wch: 10 } // 状态
  ];

  ws2['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }];

  XLSX.utils.book_append_sheet(wb, ws2, '产品分析');

  // Sheet3: 客户统计
  const customerStats = [
    ['客户统计报表', '', '', '', ''],
    ['客户类型', '客户数量', '订单总数', '总金额(万元)', '平均消费(元)'],
    ['VIP客户', 156, 2345, 678.9, 43461],
    ['普通客户', 1234, 4567, 456.7, 3702],
    ['新客户', 456, 789, 89.2, 1956],
    ['流失客户', 234, 0, 0, 0],
    ['', '', '', '', ''],
    ['总计', 2080, 7701, 1224.8, 5890]
  ];
  const ws3 = XLSX.utils.aoa_to_sheet(customerStats);

  ws3['!cols'] = [
    { wch: 12 }, // 客户类型
    { wch: 12 }, // 客户数量
    { wch: 12 }, // 订单总数
    { wch: 15 }, // 总金额
    { wch: 15 } // 平均消费
  ];

  ws3['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  XLSX.utils.book_append_sheet(wb, ws3, '客户统计');

  // Sheet4: 财务汇总
  const financialSummary = [
    ['财务汇总表', '', '', ''],
    ['项目', '本月', '上月', '环比'],
    ['营业收入', '2,108,000', '1,789,000', '17.8%'],
    ['营业成本', '1,476,000', '1,252,000', '17.9%'],
    ['毛利润', '632,000', '537,000', '17.7%'],
    ['销售费用', '126,400', '107,400', '17.7%'],
    ['管理费用', '105,600', '89,600', '17.9%'],
    ['财务费用', '21,080', '17,890', '17.8%'],
    ['营业利润', '378,920', '322,110', '17.6%'],
    ['所得税', '94,730', '80,528', '17.6%'],
    ['净利润', '284,190', '241,582', '17.6%']
  ];
  const ws4 = XLSX.utils.aoa_to_sheet(financialSummary);

  ws4['!cols'] = [
    { wch: 12 }, // 项目
    { wch: 15 }, // 本月
    { wch: 15 }, // 上月
    { wch: 10 } // 环比
  ];

  ws4['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  XLSX.utils.book_append_sheet(wb, ws4, '财务汇总');

  // 写入文件
  const filePath = path.join(testDir, '2024年8月经营报表.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log(`创建文件: ${filePath}`);
}

// 创建第二个报表文件
function createQuarterlyReport() {
  const wb = XLSX.utils.book_new();

  // 季度对比数据
  const quarterData = [
    ['2024年季度经营对比', '', '', '', ''],
    ['季度', 'Q1实际', 'Q2实际', 'Q3预测', 'Q4预测'],
    ['销售额(万元)', 375.6, 569.7, 586.2, 612.8],
    ['订单数', 1457, 2245, 2277, 2390],
    ['新增客户', 234, 312, 298, 325],
    ['活跃客户', 1580, 1892, 1950, 2080],
    ['毛利率', '35%', '36%', '37%', '38%'],
    ['净利率', '12%', '13%', '13.5%', '14%']
  ];
  const ws1 = XLSX.utils.aoa_to_sheet(quarterData);

  ws1['!cols'] = [
    { wch: 15 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 },
    { wch: 12 }
  ];

  ws1['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }];

  XLSX.utils.book_append_sheet(wb, ws1, '季度对比');

  // 写入文件
  const filePath = path.join(testDir, '2024年季度经营分析.xlsx');
  XLSX.writeFile(wb, filePath);
  console.log(`创建文件: ${filePath}`);
}

// 执行创建
createBusinessReport();
createQuarterlyReport();

console.log('\n经营报表测试文件创建完成！');
console.log(`文件位置: ${testDir}`);
console.log('\n文件列表:');
fs.readdirSync(testDir).forEach((file) => {
  console.log(`  - ${file}`);
});
