#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 确保目录存在
const outputDir = '/tmp/test-contacts';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🚀 开始生成多格式测试数据文件...\n');

// 工具函数
const utils = {
  randomName: () => {
    const surnames = [
      '张',
      '李',
      '王',
      '赵',
      '刘',
      '陈',
      '杨',
      '黄',
      '周',
      '吴',
      '徐',
      '孙',
      '朱',
      '马',
      '胡',
      '郭',
      '林',
      '何',
      '高',
      '梁'
    ];
    const names = [
      '明',
      '红',
      '强',
      '芳',
      '杰',
      '丽',
      '军',
      '敏',
      '涛',
      '静',
      '伟',
      '秀',
      '娟',
      '勇',
      '艳',
      '辉',
      '刚',
      '桂',
      '英',
      '华'
    ];
    return (
      surnames[Math.floor(Math.random() * surnames.length)] +
      names[Math.floor(Math.random() * names.length)] +
      (Math.random() > 0.5
        ? names[Math.floor(Math.random() * names.length)]
        : '')
    );
  },

  randomCompany: () => {
    const prefixes = [
      '阿里',
      '腾讯',
      '百度',
      '京东',
      '美团',
      '字节',
      '滴滴',
      '小米',
      '华为',
      '中兴',
      '联想',
      '格力',
      '海尔',
      '比亚迪',
      '万科'
    ];
    const suffixes = [
      '科技',
      '集团',
      '有限公司',
      '股份公司',
      '网络科技',
      '信息技术',
      '电子商务',
      '投资控股',
      '实业'
    ];
    return (
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      suffixes[Math.floor(Math.random() * suffixes.length)]
    );
  },

  randomPhone: () => {
    const prefixes = [
      '130',
      '131',
      '132',
      '133',
      '134',
      '135',
      '136',
      '137',
      '138',
      '139',
      '150',
      '151',
      '152',
      '153',
      '155',
      '156',
      '157',
      '158',
      '159',
      '170',
      '171',
      '172',
      '173',
      '175',
      '176',
      '177',
      '178',
      '180',
      '181',
      '182',
      '183',
      '185',
      '186',
      '187',
      '188',
      '189'
    ];
    return (
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      String(Math.floor(Math.random() * 100000000)).padStart(8, '0')
    );
  },

  randomEmail: (name, domain) => {
    const domains = domain
      ? [domain]
      : [
          'qq.com',
          '163.com',
          'gmail.com',
          'outlook.com',
          '126.com',
          'sina.com',
          'hotmail.com',
          'yahoo.com'
        ];
    const selectedDomain = domains[Math.floor(Math.random() * domains.length)];
    const username = name
      ? name.toLowerCase()
      : 'user' + Math.floor(Math.random() * 10000);
    return `${username}${Math.floor(Math.random() * 1000)}@${selectedDomain}`;
  },

  randomDate: (startYear = 2020, endYear = 2024) => {
    const year =
      startYear + Math.floor(Math.random() * (endYear - startYear + 1));
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },

  randomAmount: (min = 1000, max = 100000) =>
    Math.floor(Math.random() * (max - min) + min),

  randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)]
};

// 格式生成器
const formatGenerators = {
  // 1. 复杂合并单元格 - 公司组织架构
  organizationChart: () => {
    const data = [
      ['公司组织架构图', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['总经理', '', '', '', '', '', ''],
      ['张三', '', '', '', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['副总经理', '', '', '副总经理', '', '', ''],
      ['李四', '', '', '王五', '', '', ''],
      ['', '', '', '', '', '', ''],
      ['技术部', '市场部', '销售部', '人事部', '财务部', '运营部', '法务部'],
      ['陈六', '赵七', '孙八', '周九', '吴十', '郑十一', '王十二'],
      ['15人', '12人', '25人', '8人', '10人', '18人', '5人'],
      ['', '', '', '', '', '', ''],
      ['技术组长', '技术组长', '', '销售组长', '销售组长', '销售组长', ''],
      ['前端组', '后端组', '', '华北区', '华东区', '华南区', ''],
      ['5人', '10人', '', '8人', '10人', '7人', '']
    ];

    return {
      data,
      merges: [
        // 标题
        { s: { r: 0, c: 0 }, e: { r: 1, c: 6 } },
        // 总经理
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
        { s: { r: 3, c: 0 }, e: { r: 4, c: 6 } },
        // 副总经理1
        { s: { r: 5, c: 0 }, e: { r: 5, c: 2 } },
        { s: { r: 6, c: 0 }, e: { r: 7, c: 2 } },
        // 副总经理2
        { s: { r: 5, c: 3 }, e: { r: 5, c: 6 } },
        { s: { r: 6, c: 3 }, e: { r: 7, c: 6 } },
        // 技术组长合并
        { s: { r: 12, c: 0 }, e: { r: 12, c: 2 } },
        // 销售组长合并
        { s: { r: 12, c: 3 }, e: { r: 12, c: 6 } }
      ]
    };
  },

  // 2. 财务报表格式（带小计、合计）
  financialReport: () => {
    const quarters = ['第一季度', '第二季度', '第三季度', '第四季度'];
    const months = ['1月', '2月', '3月'];
    const departments = ['技术部', '销售部', '市场部', '运营部', '人事部'];

    const data = [
      ['2024年度财务报表', '', '', '', '', '', '', '', '', '', '', '', '', ''],
      [
        '部门',
        '第一季度',
        '',
        '',
        '小计',
        '第二季度',
        '',
        '',
        '小计',
        '第三季度',
        '',
        '',
        '小计',
        '全年合计'
      ],
      [
        '',
        '1月',
        '2月',
        '3月',
        '',
        '4月',
        '5月',
        '6月',
        '',
        '7月',
        '8月',
        '9月',
        '',
        ''
      ]
    ];

    let yearTotal = 0;
    departments.forEach((dept) => {
      const row = [dept];
      let deptTotal = 0;

      for (let q = 0; q < 3; q++) {
        let qTotal = 0;
        for (let m = 0; m < 3; m++) {
          const amount = utils.randomAmount(50000, 200000);
          row.push(amount);
          qTotal += amount;
          deptTotal += amount;
        }
        row.push(qTotal); // 季度小计
      }
      row.push(deptTotal); // 全年合计
      yearTotal += deptTotal;
      data.push(row);
    });

    // 添加总计行
    const totalRow = ['总计'];
    for (let col = 1; col < 14; col++) {
      if (col === 4 || col === 8 || col === 12) {
        // 小计列
        const sum = data
          .slice(3, 3 + departments.length)
          .reduce((acc, row) => acc + row[col], 0);
        totalRow.push(sum);
      } else if (col === 13) {
        // 全年合计
        totalRow.push(yearTotal);
      } else {
        // 月份数据
        const sum = data
          .slice(3, 3 + departments.length)
          .reduce((acc, row) => acc + row[col], 0);
        totalRow.push(sum);
      }
    }
    data.push(totalRow);

    return {
      data,
      merges: [
        // 标题行
        { s: { r: 0, c: 0 }, e: { r: 0, c: 13 } },
        // 部门列
        { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } },
        // 季度标题
        { s: { r: 1, c: 1 }, e: { r: 1, c: 3 } },
        { s: { r: 1, c: 5 }, e: { r: 1, c: 7 } },
        { s: { r: 1, c: 9 }, e: { r: 1, c: 11 } },
        // 小计和合计列
        { s: { r: 1, c: 4 }, e: { r: 2, c: 4 } },
        { s: { r: 1, c: 8 }, e: { r: 2, c: 8 } },
        { s: { r: 1, c: 12 }, e: { r: 2, c: 12 } },
        { s: { r: 1, c: 13 }, e: { r: 2, c: 13 } }
      ]
    };
  },

  // 3. 不规则表格（空行、空列、不对齐）
  irregularTable: () => {
    const data = [
      ['客户信息表'],
      [], // 空行
      ['编号', '', '姓名', '电话', '', '邮箱', '地址'],
      [
        '001',
        '',
        '张三',
        '13800138000',
        '',
        'zhang@example.com',
        '北京市朝阳区'
      ],
      [], // 空行
      ['002', '', '李四', '', '', 'li@example.com', '上海市浦东新区'],
      ['003', '', '', '13900139000', '', '', '广州市天河区'],
      [], // 空行
      [], // 空行
      ['备注信息：'],
      ['', '这是一个不规则的表格，包含空行和空列'],
      ['', '', '', '部分数据缺失是故意的'],
      [],
      ['004', '', '王五', '15000150000', '', 'wang@example.com'],
      ['', '', '', '', '', '', '深圳市南山区'],
      [],
      ['统计：', '共4条记录']
    ];

    return data;
  },

  // 4. 多层级嵌套表头
  nestedHeaders: () => {
    const data = [
      ['销售业绩统计表', '', '', '', '', '', '', '', '', '', '', ''],
      ['区域', '第一季度', '', '', '', '第二季度', '', '', '', '年度', '', ''],
      [
        '',
        '产品A',
        '',
        '产品B',
        '',
        '产品A',
        '',
        '产品B',
        '',
        '总销量',
        '总金额',
        '平均单价'
      ],
      [
        '',
        '数量',
        '金额',
        '数量',
        '金额',
        '数量',
        '金额',
        '数量',
        '金额',
        '',
        '',
        ''
      ],
      [
        '华北',
        '100',
        '10000',
        '150',
        '22500',
        '120',
        '12000',
        '180',
        '27000',
        '550',
        '71500',
        '130'
      ],
      [
        '华东',
        '200',
        '20000',
        '250',
        '37500',
        '220',
        '22000',
        '280',
        '42000',
        '950',
        '121500',
        '128'
      ],
      [
        '华南',
        '150',
        '15000',
        '200',
        '30000',
        '170',
        '17000',
        '230',
        '34500',
        '750',
        '96500',
        '129'
      ],
      [
        '西南',
        '80',
        '8000',
        '100',
        '15000',
        '90',
        '9000',
        '110',
        '16500',
        '380',
        '48500',
        '128'
      ]
    ];

    return {
      data,
      merges: [
        // 标题
        { s: { r: 0, c: 0 }, e: { r: 0, c: 11 } },
        // 区域列
        { s: { r: 1, c: 0 }, e: { r: 3, c: 0 } },
        // 第一季度
        { s: { r: 1, c: 1 }, e: { r: 1, c: 4 } },
        // 第二季度
        { s: { r: 1, c: 5 }, e: { r: 1, c: 8 } },
        // 年度统计
        { s: { r: 1, c: 9 }, e: { r: 1, c: 11 } },
        // 产品A（Q1）
        { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } },
        // 产品B（Q1）
        { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } },
        // 产品A（Q2）
        { s: { r: 2, c: 5 }, e: { r: 2, c: 6 } },
        // 产品B（Q2）
        { s: { r: 2, c: 7 }, e: { r: 2, c: 8 } },
        // 总销量
        { s: { r: 2, c: 9 }, e: { r: 3, c: 9 } },
        // 总金额
        { s: { r: 2, c: 10 }, e: { r: 3, c: 10 } },
        // 平均单价
        { s: { r: 2, c: 11 }, e: { r: 3, c: 11 } }
      ]
    };
  },

  // 5. 超宽合并单元格
  widemergedCells: () => {
    const data = [];
    // 创建100列
    const headers = [];
    for (let i = 0; i < 100; i++) {
      headers.push(`列${i + 1}`);
    }

    data.push(['超宽表格测试 - 这个标题横跨100列', ...Array(99).fill('')]);
    data.push([
      '分组1（1-20列）',
      ...Array(19).fill(''),
      '分组2（21-40列）',
      ...Array(19).fill(''),
      '分组3（41-60列）',
      ...Array(19).fill(''),
      '分组4（61-80列）',
      ...Array(19).fill(''),
      '分组5（81-100列）',
      ...Array(19).fill('')
    ]);
    data.push(headers);

    // 添加数据行
    for (let row = 0; row < 50; row++) {
      const rowData = [];
      for (let col = 0; col < 100; col++) {
        rowData.push(`R${row + 1}C${col + 1}`);
      }
      data.push(rowData);
    }

    return {
      data,
      merges: [
        // 超宽标题
        { s: { r: 0, c: 0 }, e: { r: 0, c: 99 } },
        // 分组标题
        { s: { r: 1, c: 0 }, e: { r: 1, c: 19 } },
        { s: { r: 1, c: 20 }, e: { r: 1, c: 39 } },
        { s: { r: 1, c: 40 }, e: { r: 1, c: 59 } },
        { s: { r: 1, c: 60 }, e: { r: 1, c: 79 } },
        { s: { r: 1, c: 80 }, e: { r: 1, c: 99 } }
      ]
    };
  },

  // 6. 垂直合并为主的表格
  verticalMerged: () => {
    const data = [
      ['项目进度跟踪表', '', '', '', ''],
      ['项目阶段', '任务名称', '负责人', '开始日期', '结束日期'],
      ['需求分析', '用户调研', '张三', '2024-01-01', '2024-01-15'],
      ['', '需求文档', '李四', '2024-01-10', '2024-01-20'],
      ['', '原型设计', '王五', '2024-01-15', '2024-01-25'],
      ['系统设计', '架构设计', '赵六', '2024-01-20', '2024-02-01'],
      ['', '数据库设计', '钱七', '2024-01-25', '2024-02-05'],
      ['', 'API设计', '孙八', '2024-01-25', '2024-02-05'],
      ['', '界面设计', '周九', '2024-01-30', '2024-02-10'],
      ['开发实施', '前端开发', '吴十', '2024-02-01', '2024-03-01'],
      ['', '后端开发', '郑十一', '2024-02-01', '2024-03-01'],
      ['', '接口联调', '王十二', '2024-02-20', '2024-03-10'],
      ['测试验收', '单元测试', '陈十三', '2024-03-01', '2024-03-15'],
      ['', '集成测试', '林十四', '2024-03-10', '2024-03-20'],
      ['', '用户验收', '黄十五', '2024-03-15', '2024-03-25'],
      ['部署上线', '环境准备', '张十六', '2024-03-20', '2024-03-25'],
      ['', '系统部署', '李十七', '2024-03-25', '2024-03-30'],
      ['', '运维交接', '王十八', '2024-03-28', '2024-03-31']
    ];

    return {
      data,
      merges: [
        // 标题
        { s: { r: 0, c: 0 }, e: { r: 0, c: 4 } },
        // 需求分析阶段
        { s: { r: 2, c: 0 }, e: { r: 4, c: 0 } },
        // 系统设计阶段
        { s: { r: 5, c: 0 }, e: { r: 8, c: 0 } },
        // 开发实施阶段
        { s: { r: 9, c: 0 }, e: { r: 11, c: 0 } },
        // 测试验收阶段
        { s: { r: 12, c: 0 }, e: { r: 14, c: 0 } },
        // 部署上线阶段
        { s: { r: 15, c: 0 }, e: { r: 17, c: 0 } }
      ]
    };
  },

  // 7. 斜对角合并模式
  diagonalPattern: () => {
    const size = 15;
    const data = [];

    // 创建基础数据
    for (let i = 0; i < size; i++) {
      const row = [];
      for (let j = 0; j < size; j++) {
        row.push(`${i}-${j}`);
      }
      data.push(row);
    }

    // 创建斜对角合并
    const merges = [];
    for (let i = 0; i < size - 2; i += 3) {
      // 3x3的合并块沿对角线
      if (i + 2 < size && i + 2 < size) {
        merges.push({ s: { r: i, c: i }, e: { r: i + 2, c: i + 2 } });
      }
    }

    return { data, merges };
  },

  // 8. 特殊字符和格式测试
  specialCharacters: () => {
    const data = [
      ['特殊字符测试表', '', '', ''],
      ['类型', '内容', '说明', '预期结果'],
      ['表情符号', '😀😃😄😁😆', '常见表情', '正常显示'],
      ['数学符号', '∑∏∫√∞≈≠≤≥', '数学运算符', '正常显示'],
      ['货币符号', '￥$€£¥₹₽', '各国货币', '正常显示'],
      ['箭头符号', '←→↑↓↔↕⇐⇒⇑⇓', '方向箭头', '正常显示'],
      ['希腊字母', 'ΑΒΓΔΕΖΗΘαβγδεζηθ', '希腊字母表', '正常显示'],
      ['中文标点', '，。！？；：""\'\'', '中文标点符号', '正常显示'],
      ['特殊空格', '　', '全角空格', '正常显示'],
      ['换行符', '第一行\n第二行\n第三行', '包含换行', '多行显示'],
      ['制表符', '列1\t列2\t列3', '包含制表符', '分隔显示'],
      ['HTML标签', '<div>内容</div>', 'HTML代码', '原样显示'],
      [
        'URL链接',
        'https://www.example.com/path?query=value&param=123',
        '网址',
        '正常显示'
      ],
      ['超长文本', 'A'.repeat(500), '500个字符', '正常显示'],
      ['空值测试', null, 'null值', '空单元格'],
      ['未定义', undefined, 'undefined值', '空单元格'],
      ['布尔真', true, 'true值', 'TRUE'],
      ['布尔假', false, 'false值', 'FALSE'],
      ['零值', 0, '数字0', '0'],
      ['负数', -123.456, '负小数', '-123.456'],
      ['科学计数', 1.23e10, '科学计数法', '12300000000']
    ];

    return data;
  }
};

// 创建Excel文件的辅助函数
function createExcelFile(filename, sheets) {
  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ name, data, merges }) => {
    let worksheet;

    if (Array.isArray(data)) {
      worksheet = XLSX.utils.aoa_to_sheet(data);
    } else if (data.data && data.merges) {
      worksheet = XLSX.utils.aoa_to_sheet(data.data);
      merges = data.merges;
    }

    // 如果有合并单元格信息
    if (merges) {
      worksheet['!merges'] = merges;
    }

    // 设置列宽（对于宽表格）
    if (name.includes('超宽')) {
      const cols = [];
      for (let i = 0; i < 100; i++) {
        cols.push({ wch: 10 });
      }
      worksheet['!cols'] = cols;
    }

    XLSX.utils.book_append_sheet(workbook, worksheet, name);
  });

  const filepath = path.join(outputDir, filename);
  XLSX.writeFile(workbook, filepath);
  console.log(`✓ ${filename}`);
}

// 创建CSV文件
function createCSVFile(filename, data) {
  const csvContent = data
    .map((row) =>
      row
        .map((cell) => {
          // 处理包含逗号、引号或换行的单元格
          if (cell === null || cell === undefined) return '';
          const str = String(cell);
          if (str.includes(',') || str.includes('"') || str.includes('\n')) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        })
        .join(',')
    )
    .join('\n');

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, csvContent, 'utf8');
  console.log(`✓ ${filename}`);
}

// 创建TSV文件
function createTSVFile(filename, data) {
  const tsvContent = data
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          return String(cell).replace(/\t/g, ' ');
        })
        .join('\t')
    )
    .join('\n');

  const filepath = path.join(outputDir, filename);
  fs.writeFileSync(filepath, tsvContent, 'utf8');
  console.log(`✓ ${filename}`);
}

// 生成基础联系人数据
function generateContacts(count) {
  const departments = [
    '技术部',
    '市场部',
    '销售部',
    '人事部',
    '财务部',
    '运营部',
    '产品部',
    '客服部'
  ];
  const positions = [
    '总监',
    '经理',
    '主管',
    '专员',
    '工程师',
    '助理',
    '顾问',
    '分析师'
  ];
  const cities = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '成都',
    '西安',
    '武汉',
    '南京',
    '重庆'
  ];

  const data = [
    [
      '序号',
      '姓名',
      '公司',
      '部门',
      '职位',
      '手机',
      '座机',
      '邮箱',
      '城市',
      '地址',
      '入职日期',
      '备注'
    ]
  ];

  for (let i = 1; i <= count; i++) {
    const name = utils.randomName();
    const company = utils.randomCompany();
    data.push([
      i,
      name,
      company,
      utils.randomChoice(departments),
      utils.randomChoice(positions),
      utils.randomPhone(),
      `010-${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      utils.randomEmail(name),
      utils.randomChoice(cities),
      `${utils.randomChoice(cities)}市某某区某某街道${i}号`,
      utils.randomDate(2018, 2024),
      `联系人${i}的备注信息`
    ]);
  }

  return data;
}

// 主执行函数
console.log('📊 生成复杂格式Excel文件...');

// 1. 组织架构图（复杂合并）
const orgChart = formatGenerators.organizationChart();
createExcelFile('11-组织架构图.xlsx', [
  { name: '组织架构', data: orgChart.data, merges: orgChart.merges }
]);

// 2. 财务报表（带小计合计）
const financialReport = formatGenerators.financialReport();
createExcelFile('12-财务报表.xlsx', [
  {
    name: '年度财务',
    data: financialReport.data,
    merges: financialReport.merges
  }
]);

// 3. 不规则表格
createExcelFile('13-不规则表格.xlsx', [
  { name: '不规则数据', data: formatGenerators.irregularTable() }
]);

// 4. 多层级嵌套表头
const nestedHeaders = formatGenerators.nestedHeaders();
createExcelFile('14-嵌套表头.xlsx', [
  { name: '销售统计', data: nestedHeaders.data, merges: nestedHeaders.merges }
]);

// 5. 超宽合并单元格
const wideMerged = formatGenerators.widemergedCells();
createExcelFile('15-超宽合并.xlsx', [
  { name: '超宽表格', data: wideMerged.data, merges: wideMerged.merges }
]);

// 6. 垂直合并为主
const verticalMerged = formatGenerators.verticalMerged();
createExcelFile('16-垂直合并.xlsx', [
  { name: '项目进度', data: verticalMerged.data, merges: verticalMerged.merges }
]);

// 7. 斜对角合并
const diagonal = formatGenerators.diagonalPattern();
createExcelFile('17-斜对角合并.xlsx', [
  { name: '对角模式', data: diagonal.data, merges: diagonal.merges }
]);

// 8. 特殊字符测试
createExcelFile('18-特殊字符.xlsx', [
  { name: '特殊字符', data: formatGenerators.specialCharacters() }
]);

// 9. 多Sheet综合测试
createExcelFile('19-多Sheet综合.xlsx', [
  { name: '联系人列表', data: generateContacts(100) },
  { name: '组织架构', data: orgChart.data, merges: orgChart.merges },
  {
    name: '财务数据',
    data: financialReport.data,
    merges: financialReport.merges
  },
  { name: '项目进度', data: verticalMerged.data, merges: verticalMerged.merges }
]);

console.log('\n📄 生成其他格式文件...');

// 生成CSV文件
const csvData = generateContacts(500);
createCSVFile('20-联系人数据.csv', csvData);

// 生成包含特殊字符的CSV
const specialCSVData = [
  ['姓名', '描述', '备注'],
  ['张三', '包含,逗号', '正常'],
  ['李四', '包含"引号"', '正常'],
  ['王五', '包含\n换行符', '多行'],
  ['赵六', '包含	制表符', '制表'],
  ['钱七', '"复杂的,组合"测试', '组合']
];
createCSVFile('21-特殊字符.csv', specialCSVData);

// 生成TSV文件
createTSVFile('22-联系人数据.tsv', generateContacts(300));

// 生成超大Excel文件（多Sheet，每个Sheet不同格式）
console.log('\n🔥 生成超大综合测试文件...');
createExcelFile('23-超大综合测试.xlsx', [
  { name: '5000行数据', data: generateContacts(5000) },
  { name: '超宽100列', data: wideMerged.data, merges: wideMerged.merges },
  { name: '复杂合并', data: orgChart.data, merges: orgChart.merges },
  { name: '嵌套表头', data: nestedHeaders.data, merges: nestedHeaders.merges },
  { name: '特殊字符', data: formatGenerators.specialCharacters() }
]);

// 生成空文件和极端情况
console.log('\n⚠️ 生成边界测试文件...');

// 空Excel文件
createExcelFile('24-空文件.xlsx', [{ name: 'Sheet1', data: [[]] }]);

// 只有标题没有数据
createExcelFile('25-仅标题.xlsx', [
  { name: 'Sheet1', data: [['列1', '列2', '列3', '列4', '列5']] }
]);

// 单个单元格
createExcelFile('26-单单元格.xlsx', [{ name: 'Sheet1', data: [['唯一数据']] }]);

// 生成统计信息
console.log('\n' + '='.repeat(60));
console.log('✅ 多格式测试数据生成完成！');
console.log('='.repeat(60));
console.log(`📁 输出目录: ${outputDir}`);
console.log(`📄 文件数量: 26 个文件`);
console.log('');
console.log('📊 格式类型:');
console.log('   ✓ Excel文件 (.xlsx) - 包含多种合并单元格模式');
console.log('   ✓ CSV文件 (.csv) - 包含特殊字符处理');
console.log('   ✓ TSV文件 (.tsv) - Tab分隔格式');
console.log('');
console.log('🧪 测试场景:');
console.log('   ✓ 复杂合并单元格（横向、纵向、斜对角）');
console.log('   ✓ 多层级嵌套表头');
console.log('   ✓ 财务报表格式（小计、合计）');
console.log('   ✓ 不规则表格（空行、空列）');
console.log('   ✓ 超宽表格（100列）');
console.log('   ✓ 特殊字符和编码');
console.log('   ✓ 边界情况（空文件、单单元格）');
console.log('   ✓ 大数据量（5000行）');
console.log('');
console.log('🚀 使用方法:');
console.log('   1. 运行: node scripts/create-multi-format-test-data.js');
console.log('   2. 文件生成在: /tmp/test-contacts/');
console.log('   3. 在应用中测试导入这些文件');
console.log('');
