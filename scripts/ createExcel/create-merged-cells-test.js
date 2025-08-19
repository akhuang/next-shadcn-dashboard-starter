const XLSX = require('xlsx');

console.log('📊 创建包含合并单元格的测试文件...');

// 创建新的工作簿
const wb = XLSX.utils.book_new();

// 创建数据
const data = [
  ['合并的标题', '', '', '普通列D', '普通列E'],
  ['子标题1', '子标题2', '子标题3', '子标题4', '子标题5'],
  ['数据1-1', '数据1-2', '数据1-3', '数据1-4', '数据1-5'],
  ['合并行数据', '', '数据2-3', '数据2-4', '数据2-5'],
  ['', '', '数据3-3', '数据3-4', '数据3-5'],
  ['数据4-1', '数据4-2', '数据4-3', '合并单元格', ''],
  ['数据5-1', '数据5-2', '数据5-3', '', '']
];

// 创建工作表
const ws = XLSX.utils.aoa_to_sheet(data);

// 设置合并单元格
ws['!merges'] = [
  // A1:C1 - 合并第一行的前三列
  { s: { r: 0, c: 0 }, e: { r: 0, c: 2 } },

  // A4:B5 - 合并A4到B5的区域（2x2的合并）
  { s: { r: 3, c: 0 }, e: { r: 4, c: 1 } },

  // D6:E7 - 合并D6到E7的区域
  { s: { r: 5, c: 3 }, e: { r: 6, c: 4 } }
];

// 添加工作表到工作簿
XLSX.utils.book_append_sheet(wb, ws, '合并单元格测试');

// 创建第二个工作表 - 更复杂的合并
const data2 = [
  ['公司报表', '', '', '', ''],
  ['部门', '第一季度', '', '第二季度', ''],
  ['', '1月', '2月', '1月', '2月'],
  ['销售部', '100', '150', '200', '250'],
  ['技术部', '80', '90', '110', '120'],
  ['总计', '180', '240', '310', '370']
];

const ws2 = XLSX.utils.aoa_to_sheet(data2);

// 设置更复杂的合并
ws2['!merges'] = [
  // A1:E1 - 标题行
  { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },

  // A2:A3 - 部门列标题
  { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },

  // B2:C2 - 第一季度
  { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } },

  // D2:E2 - 第二季度
  { s: { r: 1, c: 3 }, e: { r: 1, c: 4 } }
];

XLSX.utils.book_append_sheet(wb, ws2, '报表示例');

// 创建第三个工作表 - 极端情况
const data3 = [];
for (let i = 0; i < 20; i++) {
  const row = [];
  for (let j = 0; j < 10; j++) {
    row.push(`单元格${i}-${j}`);
  }
  data3.push(row);
}

const ws3 = XLSX.utils.aoa_to_sheet(data3);

// 创建多个随机合并
ws3['!merges'] = [
  // 大型合并区域
  { s: { r: 0, c: 0 }, e: { r: 2, c: 3 } },

  // 垂直合并
  { s: { r: 5, c: 0 }, e: { r: 10, c: 0 } },

  // 水平合并
  { s: { r: 12, c: 1 }, e: { r: 12, c: 8 } },

  // 小型合并
  { s: { r: 15, c: 5 }, e: { r: 16, c: 6 } }
];

XLSX.utils.book_append_sheet(wb, ws3, '极端合并测试');

// 写入文件
XLSX.writeFile(wb, '/tmp/test-contacts/合并单元格测试文件.xlsx');

console.log('✅ 合并单元格测试文件已创建！');
console.log('📁 文件位置: /tmp/test-contacts/合并单元格测试文件.xlsx');
console.log('');
console.log('📋 包含的测试场景:');
console.log('  1. Sheet1: 基本合并测试');
console.log('     - 标题行合并 (A1:C1)');
console.log('     - 2x2区域合并 (A4:B5)');
console.log('     - 另一个2x2合并 (D6:E7)');
console.log('');
console.log('  2. Sheet2: 报表示例');
console.log('     - 完整标题行合并');
console.log('     - 多级表头合并');
console.log('');
console.log('  3. Sheet3: 极端情况');
console.log('     - 大型合并区域 (3x4)');
console.log('     - 垂直长条合并');
console.log('     - 水平长条合并');
console.log('');
console.log('⚠️ 注意: 当前系统已经能够读取合并单元格数据');
console.log('   合并的值会被复制到所有被合并的单元格中');
