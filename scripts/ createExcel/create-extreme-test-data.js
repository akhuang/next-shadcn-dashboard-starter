const XLSX = require('xlsx');

console.log('🚀 生成极端测试数据...');

// 1. 创建超长文件名和Sheet名的文件
const longFileName =
  '这是一个非常非常非常长的文件名用于测试系统对超长文件名的处理能力包含中文英文数字和特殊字符2024年最新版本V1.0.0_Final_Release_测试专用版.xlsx';

const wb1 = XLSX.utils.book_new();

// 创建超长Sheet名（Excel限制为31字符）
const extremeLongSheetName1 = '这是超长Sheet名称用于测试31字符限制ABC123';
const extremeLongSheetName2 = 'Very_Long_Sheet_Name_Test_31Chr';
const extremeLongSheetName3 = '🚀💡✨特殊字符Sheet名称测试2024年';

// Sheet 1: 超多列测试（100列）
const manyColumnsHeaders = [];
for (let i = 1; i <= 100; i++) {
  manyColumnsHeaders.push(`第${i}列_Column${i}_测试列名称`);
}

const manyColumnsData = [manyColumnsHeaders];
for (let i = 1; i <= 50; i++) {
  const row = [];
  for (let j = 1; j <= 100; j++) {
    row.push(`R${i}C${j}`);
  }
  manyColumnsData.push(row);
}

const ws1 = XLSX.utils.aoa_to_sheet(manyColumnsData);
XLSX.utils.book_append_sheet(wb1, ws1, extremeLongSheetName1.substring(0, 31));

// Sheet 2: 超多行测试（1000行）
const manyRowsData = [
  ['ID', '姓名', '部门', '职位', '邮箱', '电话', '地址', '备注']
];
for (let i = 1; i <= 1000; i++) {
  manyRowsData.push([
    `ID${String(i).padStart(5, '0')}`,
    `测试用户${i}`,
    `部门${i % 10}`,
    `职位${i % 20}`,
    `user${i}@test.com`,
    `138${String(10000000 + i).substring(1)}`,
    `地址${i}号楼${i % 100}室`,
    `这是第${i}条记录的备注信息`
  ]);
}

const ws2 = XLSX.utils.aoa_to_sheet(manyRowsData);
XLSX.utils.book_append_sheet(wb1, ws2, extremeLongSheetName2.substring(0, 31));

// Sheet 3: 混合异常数据
const mixedData = [
  ['空值测试', '特殊字符', '超长文本', '数字', '日期', '布尔', 'JSON']
];

for (let i = 1; i <= 100; i++) {
  mixedData.push([
    i % 3 === 0 ? null : `值${i}`,
    `!@#$%^&*()_+{}[]|\\:";'<>?,./~\`${i}`,
    `这是一段超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级超级长的文本，用于测试单元格对超长文本的处理能力。这段文本包含了中文、English、数字123、特殊字符!@#等各种内容。第${i}行`,
    Math.pow(10, i % 10),
    new Date(2024, i % 12, (i % 28) + 1).toISOString(),
    i % 2 === 0,
    JSON.stringify({ row: i, data: { nested: { value: i * 100 } } })
  ]);
}

const ws3 = XLSX.utils.aoa_to_sheet(mixedData);
XLSX.utils.book_append_sheet(wb1, ws3, extremeLongSheetName3.substring(0, 31));

// 保存文件（使用较短的文件名以避免文件系统限制）
XLSX.writeFile(wb1, '/tmp/test-contacts/超长文件名测试数据文件2024版.xlsx');

// 2. 创建超宽数据文件（Excel最大列数16384）
const wb2 = XLSX.utils.book_new();

// 创建200列的数据
const wideHeaders = [];
for (let i = 1; i <= 200; i++) {
  wideHeaders.push(`C${i}`);
}

const wideData = [wideHeaders];
for (let i = 1; i <= 100; i++) {
  const row = [];
  for (let j = 1; j <= 200; j++) {
    // 每10列换一种数据类型
    const colType = Math.floor((j - 1) / 10) % 5;
    switch (colType) {
      case 0:
        row.push(`文本${i}-${j}`);
        break;
      case 1:
        row.push(i * j);
        break;
      case 2:
        row.push(((i * j) / 1000).toFixed(3));
        break;
      case 3:
        row.push(i % 2 === j % 2);
        break;
      case 4:
        row.push(i % 10 === 0 ? null : `数据${i}`);
        break;
    }
  }
  wideData.push(row);
}

const wsWide = XLSX.utils.aoa_to_sheet(wideData);
XLSX.utils.book_append_sheet(wb2, wsWide, '超宽表格200列测试');

// 添加一个空Sheet
const wsEmpty = XLSX.utils.aoa_to_sheet([]);
XLSX.utils.book_append_sheet(wb2, wsEmpty, '空Sheet测试');

// 添加只有标题行的Sheet
const wsHeaderOnly = XLSX.utils.aoa_to_sheet([
  ['列1', '列2', '列3', '列4', '列5']
]);
XLSX.utils.book_append_sheet(wb2, wsHeaderOnly, '仅标题行测试');

XLSX.writeFile(wb2, '/tmp/test-contacts/极限宽度测试文件.xlsx');

// 3. 创建包含各种边界情况的文件
const wb3 = XLSX.utils.book_new();

// 单个超大单元格
const hugeCellData = [
  ['普通', '超大单元格'],
  ['正常', Array(1000).fill('重复文本').join(' ')],
  ['数据', '第二个超大单元格：' + Array(500).fill('测试').join('、')]
];

const wsHuge = XLSX.utils.aoa_to_sheet(hugeCellData);
XLSX.utils.book_append_sheet(wb3, wsHuge, '超大单元格测试');

// 全空行和全空列测试
const sparseData2 = [];
for (let i = 0; i < 50; i++) {
  if (i % 10 === 0) {
    // 每10行有一行数据
    sparseData2.push(['数据', '', '', '', '稀疏', '', '', '', '', '测试']);
  } else if (i % 10 === 5) {
    // 中间有一些数据
    sparseData2.push(['', '', '中间数据', '', '', '', '', '', '', '']);
  } else {
    // 全空行
    sparseData2.push(Array(10).fill(''));
  }
}

const wsSparse = XLSX.utils.aoa_to_sheet(sparseData2);
XLSX.utils.book_append_sheet(wb3, wsSparse, '稀疏矩阵测试');

// 数值极限测试
const numberLimitData = [
  ['描述', '数值'],
  ['最大安全整数', Number.MAX_SAFE_INTEGER],
  ['最小安全整数', Number.MIN_SAFE_INTEGER],
  ['正无穷', Infinity],
  ['负无穷', -Infinity],
  ['NaN', NaN],
  ['极小数', 0.000000000001],
  ['极大数', 999999999999999],
  ['科学计数法', 1.23e100],
  ['负科学计数法', -4.56e-100]
];

const wsNumbers = XLSX.utils.aoa_to_sheet(numberLimitData);
XLSX.utils.book_append_sheet(wb3, wsNumbers, '数值极限测试');

XLSX.writeFile(wb3, '/tmp/test-contacts/边界情况测试文件.xlsx');

console.log('✅ 极端测试数据生成完成！');
console.log('');
console.log('📁 生成的文件：');
console.log('  1. 超长文件名测试数据文件2024版.xlsx');
console.log('     - 100列 x 50行的宽表');
console.log('     - 8列 x 1000行的长表');
console.log('     - 混合异常数据表');
console.log('');
console.log('  2. 极限宽度测试文件.xlsx');
console.log('     - 200列 x 100行的超宽表');
console.log('     - 空Sheet');
console.log('     - 仅标题行Sheet');
console.log('');
console.log('  3. 边界情况测试文件.xlsx');
console.log('     - 超大单元格（1000个重复文本）');
console.log('     - 稀疏矩阵（大量空单元格）');
console.log('     - 数值极限（无穷大、NaN等）');
console.log('');
console.log('⚠️ 测试要点：');
console.log('  - Sheet名称31字符限制处理');
console.log('  - 超宽表格水平滚动');
console.log('  - 超长表格垂直滚动性能');
console.log('  - 超大单元格文本截断显示');
console.log('  - 空值和稀疏数据处理');
console.log('  - 特殊数值显示');
