const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create test directory
const testDir = '/tmp/test-contacts';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// 创建一个包含各种测试场景的综合 Excel 文件
function createComprehensiveTestExcel() {
  const workbook = XLSX.utils.book_new();

  // ========== Sheet 1: 正常数据表 ==========
  const normalData = [
    ['客户ID', '客户名称', '联系人', '电话', '邮箱', '地址', '备注'],
    [
      'C001',
      '阿里巴巴科技有限公司',
      '马云',
      '13800138000',
      'jack@alibaba.com',
      '杭州市西湖区',
      '重要客户'
    ],
    [
      'C002',
      '腾讯科技',
      '马化腾',
      '13900139000',
      'pony@tencent.com',
      '深圳市南山区',
      'VIP'
    ],
    [
      'C003',
      '字节跳动',
      '张一鸣',
      '13700137000',
      'zhang@bytedance.com',
      '北京市海淀区',
      ''
    ],
    [
      'C004',
      '美团',
      '王兴',
      '13600136000',
      'wang@meituan.com',
      '北京市朝阳区',
      '新客户'
    ],
    [
      'C005',
      '京东集团',
      '刘强东',
      '13500135000',
      'liu@jd.com',
      '北京市亦庄',
      '长期合作'
    ]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(normalData);
  XLSX.utils.book_append_sheet(workbook, ws1, '正常数据');

  // ========== Sheet 2: 复杂合并单元格 ==========
  const mergeData = [
    ['销售报表', '', '', '', '', '', '2024年度'], // 标题跨列合并
    ['大区', '省份', '城市', 'Q1', 'Q2', 'Q3', 'Q4'],
    ['华北', '北京', '北京市', '1000', '1200', '1100', '1300'],
    ['', '', '天津市', '800', '850', '900', '950'],
    ['', '河北', '石家庄', '600', '650', '700', '750'],
    ['', '', '唐山', '500', '550', '600', '650'],
    ['', '', '保定', '400', '450', '500', '550'],
    ['华东', '上海', '上海市', '2000', '2200', '2100', '2300'],
    ['', '江苏', '南京', '1500', '1600', '1700', '1800'],
    ['', '', '苏州', '1800', '1900', '2000', '2100'],
    ['', '', '无锡', '1200', '1300', '1400', '1500'],
    ['', '浙江', '杭州', '1600', '1700', '1800', '1900'],
    ['', '', '宁波', '1400', '1500', '1600', '1700'],
    ['华南', '广东', '广州', '2500', '2600', '2700', '2800'],
    ['', '', '深圳', '3000', '3100', '3200', '3300'],
    ['', '', '东莞', '1000', '1100', '1200', '1300'],
    [
      '合计',
      '',
      '',
      '=SUM(D3:D16)',
      '=SUM(E3:E16)',
      '=SUM(F3:F16)',
      '=SUM(G3:G16)'
    ]
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(mergeData);

  // 添加复杂的合并单元格
  ws2['!merges'] = [
    // 标题行合并 (A1:F1)
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } },

    // 华北大区合并 (A3:A7)
    { s: { r: 2, c: 0 }, e: { r: 6, c: 0 } },
    // 北京省份合并 (B3:B4)
    { s: { r: 2, c: 1 }, e: { r: 3, c: 1 } },
    // 河北省份合并 (B5:B7)
    { s: { r: 4, c: 1 }, e: { r: 6, c: 1 } },

    // 华东大区合并 (A8:A13)
    { s: { r: 7, c: 0 }, e: { r: 12, c: 0 } },
    // 江苏省份合并 (B9:B11)
    { s: { r: 8, c: 1 }, e: { r: 10, c: 1 } },
    // 浙江省份合并 (B12:B13)
    { s: { r: 11, c: 1 }, e: { r: 12, c: 1 } },

    // 华南大区合并 (A14:A16)
    { s: { r: 13, c: 0 }, e: { r: 15, c: 0 } },
    // 广东省份合并 (B14:B16)
    { s: { r: 13, c: 1 }, e: { r: 15, c: 1 } },

    // 合计行合并 (A17:C17)
    { s: { r: 16, c: 0 }, e: { r: 16, c: 2 } }
  ];

  XLSX.utils.book_append_sheet(workbook, ws2, '复杂合并单元格');

  // ========== Sheet 3: 异常数据 ==========
  const abnormalData = [
    ['测试各种异常情况', '', '', '', ''],
    ['列1', '列2', '列3', '列4', '列5'],
    ['正常文本', 123456, true, new Date('2024-01-01'), '=1+1'],
    ['', '', '', '', ''], // 空行
    [null, undefined, NaN, Infinity, -Infinity], // 特殊值
    [
      '超长文本' + '测试'.repeat(100),
      '特殊字符!@#$%^&*()',
      '中文测试',
      '😀表情符号😎',
      ''
    ],
    ['  前后空格  ', '\t制表符\t', '\n换行符\n', '\\反斜杠\\', '"引号"'],
    [
      '<script>alert("XSS")</script>',
      'SELECT * FROM users',
      '../../etc/passwd',
      'cmd.exe /c dir',
      ''
    ],
    ['0', '00', '000', '0000', '00000'], // 前导零
    ['1.1', '1.11', '1.111', '1.1111', '1.11111'], // 小数
    ['1e10', '1E-10', '-1.23e45', '', ''], // 科学计数法
    ['TRUE', 'FALSE', 'true', 'false', '#N/A'], // 布尔值和错误值
    ['2024-01-01', '2024/01/01', '01-01-2024', '01/01/2024', 'Jan 1, 2024'], // 日期格式
    ['13:30:00', '1:30 PM', '13:30', '13:30:59', ''], // 时间格式
    ['¥1,234.56', '$1,234.56', '€1.234,56', '1234.56', '1,234,567.89'] // 货币格式
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(abnormalData);

  // 添加一些不规则的合并
  ws3['!merges'] = [
    // 标题跨列合并
    { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
    // 不规则合并 - 跨行跨列
    { s: { r: 5, c: 2 }, e: { r: 7, c: 3 } },
    // 单个单元格"合并"（测试边界情况）
    { s: { r: 10, c: 1 }, e: { r: 10, c: 1 } }
  ];

  XLSX.utils.book_append_sheet(workbook, ws3, '异常数据测试');

  // ========== Sheet 4: 不规则表格 ==========
  const irregularData = [];

  // 创建不规则数据 - 每行列数不同
  irregularData.push(['A1', 'B1']);
  irregularData.push(['A2', 'B2', 'C2', 'D2']);
  irregularData.push(['A3']);
  irregularData.push(['A4', 'B4', 'C4', 'D4', 'E4', 'F4', 'G4']);
  irregularData.push([]); // 空行
  irregularData.push(['A6', '', '', 'D6']); // 中间有空单元格
  irregularData.push(['表格标题']);
  irregularData.push(['子标题1', '子标题2', '子标题3']);
  irregularData.push(['数据1', '数据2', '数据3']);
  irregularData.push(['']);

  // 在中间位置添加一些数据
  for (let i = 10; i < 20; i++) {
    const row = [];
    for (let j = 0; j < Math.floor(Math.random() * 10) + 1; j++) {
      row.push(`Cell${i}-${j}`);
    }
    irregularData.push(row);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(irregularData);

  // 添加各种不规则的合并单元格
  ws4['!merges'] = [
    // 标题跨多列但不是从第一列开始
    { s: { r: 6, c: 0 }, e: { r: 6, c: 2 } },
    // 交叉合并（会被处理成不交叉）
    { s: { r: 10, c: 1 }, e: { r: 12, c: 3 } },
    { s: { r: 11, c: 2 }, e: { r: 13, c: 4 } },
    // 大面积合并
    { s: { r: 15, c: 0 }, e: { r: 19, c: 9 } }
  ];

  XLSX.utils.book_append_sheet(workbook, ws4, '不规则表格');

  // ========== Sheet 5: 极端边界测试 ==========
  const extremeData = [['极端边界测试'], ['单个字符']];

  // 创建一个非常宽的表（100列）
  const wideRow = [];
  for (let i = 0; i < 100; i++) {
    wideRow.push(`列${i + 1}`);
  }
  extremeData.push(wideRow);

  // 创建一些稀疏数据
  for (let i = 0; i < 50; i++) {
    const row = new Array(100).fill('');
    // 随机填充一些单元格
    for (let j = 0; j < 5; j++) {
      const colIndex = Math.floor(Math.random() * 100);
      row[colIndex] = `数据${i}-${colIndex}`;
    }
    extremeData.push(row);
  }

  const ws5 = XLSX.utils.aoa_to_sheet(extremeData);

  // 添加一些极端的合并
  ws5['!merges'] = [
    // 超宽合并
    { s: { r: 0, c: 0 }, e: { r: 0, c: 99 } },
    // 超高合并
    { s: { r: 3, c: 0 }, e: { r: 52, c: 0 } },
    // 右下角的合并
    { s: { r: 45, c: 90 }, e: { r: 52, c: 99 } }
  ];

  XLSX.utils.book_append_sheet(workbook, ws5, '极端边界测试');

  // ========== Sheet 6: 公式和引用 ==========
  const formulaData = [
    ['公式测试表', '', '', ''],
    ['数值A', '数值B', '公式结果', '说明'],
    [10, 20, '=A3+B3', '加法'],
    [100, 25, '=A4-B4', '减法'],
    [7, 8, '=A5*B5', '乘法'],
    [100, 4, '=A6/B6', '除法'],
    [2, 10, '=POWER(A7,B7)', '幂运算'],
    [1, 100, '=SUM(A3:A8)', '求和'],
    ['', '', '=AVERAGE(B3:B8)', '平均值'],
    ['', '', '=MAX(A3:B8)', '最大值'],
    ['', '', '=MIN(A3:B8)', '最小值'],
    ['文本1', '文本2', '=CONCATENATE(A12,B12)', '文本连接'],
    ['测试', '', '=LEN(A13)', '文本长度'],
    ['', '', '=NOW()', '当前时间'],
    ['', '', '=TODAY()', '今天日期'],
    ['错误测试', '', '=1/0', '#DIV/0! 错误'],
    ['', '', '=VLOOKUP("不存在",A:B,2,0)', '#N/A 错误']
  ];

  const ws6 = XLSX.utils.aoa_to_sheet(formulaData);

  // 设置一些单元格格式
  ws6['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }];

  XLSX.utils.book_append_sheet(workbook, ws6, '公式和引用');

  // ========== Sheet 7: 多层级数据 ==========
  const hierarchicalData = [
    ['组织架构', '', '', '', '', ''],
    ['一级部门', '二级部门', '三级部门', '员工姓名', '职位', '入职日期'],
    ['技术中心', '研发部', '前端组', '张三', '高级工程师', '2020-01-15'],
    ['', '', '', '李四', '中级工程师', '2021-03-20'],
    ['', '', '', '王五', '初级工程师', '2022-06-10'],
    ['', '', '后端组', '赵六', '架构师', '2019-05-01'],
    ['', '', '', '钱七', '高级工程师', '2020-08-15'],
    ['', '测试部', 'QA组', '孙八', '测试经理', '2018-11-20'],
    ['', '', '', '周九', '高级测试', '2020-12-01'],
    ['', '', '自动化组', '吴十', '自动化工程师', '2021-07-15'],
    ['市场中心', '销售部', '华北区', '郑一', '销售总监', '2017-03-10'],
    ['', '', '', '陈二', '销售经理', '2019-09-20'],
    ['', '', '华东区', '林三', '销售经理', '2018-06-15'],
    ['', '', '', '黄四', '销售专员', '2021-11-30'],
    ['', '市场部', '品牌组', '刘五', '品牌经理', '2019-04-10'],
    ['', '', '推广组', '徐六', '推广专员', '2022-01-20'],
    ['行政中心', '人力资源', 'HR', '朱七', 'HR总监', '2016-08-01'],
    ['', '', '', '何八', 'HR经理', '2018-12-15'],
    ['', '财务部', '会计组', '马九', '财务经理', '2017-10-20'],
    ['', '', '出纳组', '罗十', '出纳', '2020-05-30']
  ];

  const ws7 = XLSX.utils.aoa_to_sheet(hierarchicalData);

  // 添加层级合并
  ws7['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 5 } }, // 标题
    { s: { r: 2, c: 0 }, e: { r: 9, c: 0 } }, // 技术中心
    { s: { r: 2, c: 1 }, e: { r: 6, c: 1 } }, // 研发部
    { s: { r: 2, c: 2 }, e: { r: 4, c: 2 } }, // 前端组
    { s: { r: 5, c: 2 }, e: { r: 6, c: 2 } }, // 后端组
    { s: { r: 7, c: 1 }, e: { r: 9, c: 1 } }, // 测试部
    { s: { r: 7, c: 2 }, e: { r: 8, c: 2 } }, // QA组
    { s: { r: 10, c: 0 }, e: { r: 15, c: 0 } }, // 市场中心
    { s: { r: 10, c: 1 }, e: { r: 13, c: 1 } }, // 销售部
    { s: { r: 10, c: 2 }, e: { r: 11, c: 2 } }, // 华北区
    { s: { r: 12, c: 2 }, e: { r: 13, c: 2 } }, // 华东区
    { s: { r: 14, c: 1 }, e: { r: 15, c: 1 } }, // 市场部
    { s: { r: 16, c: 0 }, e: { r: 19, c: 0 } }, // 行政中心
    { s: { r: 16, c: 1 }, e: { r: 17, c: 1 } }, // 人力资源
    { s: { r: 16, c: 2 }, e: { r: 17, c: 2 } }, // HR
    { s: { r: 18, c: 1 }, e: { r: 19, c: 1 } } // 财务部
  ];

  XLSX.utils.book_append_sheet(workbook, ws7, '多层级数据');

  // ========== Sheet 8: 空表和最小数据 ==========
  const emptyData = [
    ['这是一个几乎空的表'],
    [],
    [],
    [],
    ['', '', '', '只有这个单元格有数据']
  ];

  const ws8 = XLSX.utils.aoa_to_sheet(emptyData);
  XLSX.utils.book_append_sheet(workbook, ws8, '空表测试');

  // ========== Sheet 9: 特殊字符和编码测试 ==========
  const encodingData = [
    ['编码测试', 'UTF-8字符', '特殊符号', 'Emoji'],
    ['中文简体', '中文繁體', '日本語', '한국어'],
    ['Русский', 'العربية', 'עברית', 'ไทย'],
    ['α β γ δ', '① ② ③ ④', '☆ ★ ○ ●', '♠ ♥ ♦ ♣'],
    ['℃ ℉ №', '© ® ™', '← → ↑ ↓', '✓ ✗ ✉ ☎'],
    ['😀 😁 😂 🤣', '❤️ 💔 💕 💖', '🌟 🌙 ☀️ ⛅', '🍎 🍊 🍋 🍌'],
    ['零宽字符​测试', '不可见\u200B字符', '控制\u0001字符', 'Tab\t字符'],
    ["单引号'测试", '双引号"测试', '反引号`测试', '换行\n测试']
  ];

  const ws9 = XLSX.utils.aoa_to_sheet(encodingData);
  XLSX.utils.book_append_sheet(workbook, ws9, '特殊字符');

  // ========== Sheet 10: 性能测试 - 大数据量 ==========
  const performanceData = [
    ['性能测试 - 10000行数据'],
    [
      'ID',
      '姓名',
      '部门',
      '职位',
      '工号',
      '邮箱',
      '电话',
      '地址',
      '入职日期',
      '薪资'
    ]
  ];

  // 生成10000行测试数据
  const departments = [
    '技术部',
    '销售部',
    '市场部',
    '人事部',
    '财务部',
    '运营部'
  ];
  const positions = ['经理', '主管', '专员', '工程师', '分析师', '助理'];
  const cities = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '成都',
    '武汉',
    '西安'
  ];

  for (let i = 1; i <= 10000; i++) {
    performanceData.push([
      `EMP${String(i).padStart(5, '0')}`,
      `员工${i}`,
      departments[i % departments.length],
      positions[i % positions.length],
      `${2020000 + i}`,
      `employee${i}@company.com`,
      `${13800000000 + i}`,
      `${cities[i % cities.length]}市第${Math.floor(i / 100) + 1}区${i % 100}号`,
      new Date(
        2020,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
      Math.floor(Math.random() * 50000) + 10000
    ]);
  }

  const ws10 = XLSX.utils.aoa_to_sheet(performanceData);
  XLSX.utils.book_append_sheet(workbook, ws10, '性能测试');

  // 写入文件
  const filePath = path.join(testDir, '综合测试数据.xlsx');
  XLSX.writeFile(workbook, filePath);
  console.log(`✅ 创建测试文件成功: ${filePath}`);

  // 显示文件信息
  const stats = fs.statSync(filePath);
  console.log(`📊 文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`📑 包含工作表:`);
  workbook.SheetNames.forEach((name, index) => {
    console.log(`   ${index + 1}. ${name}`);
  });
}

// 执行创建
console.log('🚀 开始创建综合测试Excel文件...');
createComprehensiveTestExcel();
console.log('✨ 完成！');
