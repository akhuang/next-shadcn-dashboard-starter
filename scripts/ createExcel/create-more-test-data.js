const XLSX = require('xlsx');
const path = require('path');

// 创建产品目录文件
const wb3 = XLSX.utils.book_new();

// 产品清单
const productData = [
  ['产品编号', '产品名称', '类别', '单价', '库存', '供应商'],
  ['P001', 'ThinkPad X1 Carbon', '笔记本电脑', '12999', '50', '联想集团'],
  ['P002', 'MacBook Pro 14"', '笔记本电脑', '14999', '30', 'Apple'],
  ['P003', 'Dell UltraSharp 27"', '显示器', '3999', '100', 'Dell'],
  ['P004', '罗技 MX Master 3', '鼠标', '699', '200', '罗技'],
  ['P005', 'Herman Miller Aeron', '办公椅', '8999', '20', 'Herman Miller'],
  ['P006', 'iPhone 15 Pro', '手机', '8999', '80', 'Apple'],
  ['P007', 'Samsung Galaxy S24', '手机', '6999', '60', '三星'],
  ['P008', 'AirPods Pro', '耳机', '1999', '150', 'Apple'],
  ['P009', 'Sony WH-1000XM5', '耳机', '2499', '100', 'Sony'],
  ['P010', 'iPad Pro 12.9"', '平板电脑', '8999', '40', 'Apple']
];

const wsProduct = XLSX.utils.aoa_to_sheet(productData);
XLSX.utils.book_append_sheet(wb3, wsProduct, '电子产品');

// 办公用品
const officeData = [
  ['物品编号', '物品名称', '规格', '单价', '库存数量', '最低库存'],
  ['OF001', 'A4打印纸', '500张/包', '25', '200', '50'],
  ['OF002', '黑色签字笔', '12支/盒', '36', '100', '20'],
  ['OF003', '订书机', '标准型', '45', '50', '10'],
  ['OF004', '文件夹', 'A4规格', '8', '300', '50'],
  ['OF005', '便利贴', '76x76mm', '15', '150', '30']
];

const wsOffice = XLSX.utils.aoa_to_sheet(officeData);
XLSX.utils.book_append_sheet(wb3, wsOffice, '办公用品');

XLSX.writeFile(wb3, '/tmp/test-contacts/产品目录.xlsx');

// 创建项目管理文件
const wb4 = XLSX.utils.book_new();

// 项目列表
const projectData = [
  [
    '项目编号',
    '项目名称',
    '负责人',
    '开始日期',
    '结束日期',
    '状态',
    '预算（万元）'
  ],
  [
    'PRJ001',
    '企业官网改版',
    '张经理',
    '2024-01-01',
    '2024-03-31',
    '进行中',
    '50'
  ],
  [
    'PRJ002',
    'CRM系统升级',
    '李总监',
    '2024-02-15',
    '2024-06-30',
    '进行中',
    '120'
  ],
  [
    'PRJ003',
    '移动APP开发',
    '王主管',
    '2024-03-01',
    '2024-09-30',
    '计划中',
    '200'
  ],
  [
    'PRJ004',
    '数据中心建设',
    '赵总',
    '2023-10-01',
    '2024-02-28',
    '已完成',
    '500'
  ],
  [
    'PRJ005',
    '安全系统升级',
    '刘经理',
    '2024-04-01',
    '2024-07-31',
    '计划中',
    '80'
  ]
];

const wsProject = XLSX.utils.aoa_to_sheet(projectData);
XLSX.utils.book_append_sheet(wb4, wsProject, '项目清单');

// 团队成员
const teamData = [
  ['成员ID', '姓名', '角色', '技能', '项目', '联系方式'],
  [
    'T001',
    '陈开发',
    '前端工程师',
    'React, Vue, TypeScript',
    'PRJ001',
    '13512345678'
  ],
  [
    'T002',
    '林测试',
    '测试工程师',
    '自动化测试, 性能测试',
    'PRJ002',
    '13612345678'
  ],
  ['T003', '黄设计', 'UI设计师', 'Figma, Sketch, PS', 'PRJ001', '13712345678'],
  [
    'T004',
    '周后端',
    '后端工程师',
    'Node.js, Python, Go',
    'PRJ003',
    '13812345678'
  ],
  ['T005', '吴产品', '产品经理', '需求分析, 原型设计', 'PRJ002', '13912345678'],
  [
    'T006',
    '郑运维',
    '运维工程师',
    'Docker, K8s, CI/CD',
    'PRJ004',
    '13012345678'
  ]
];

const wsTeam = XLSX.utils.aoa_to_sheet(teamData);
XLSX.utils.book_append_sheet(wb4, wsTeam, '团队成员');

XLSX.writeFile(wb4, '/tmp/test-contacts/项目管理.xlsx');

// 创建销售数据文件
const wb5 = XLSX.utils.book_new();

// 销售记录
const salesData = [
  ['订单号', '客户名称', '产品', '数量', '金额', '销售员', '日期', '状态'],
  [
    'ORD001',
    'ABC科技',
    'ThinkPad X1',
    '10',
    '129990',
    '张三',
    '2024-01-15',
    '已完成'
  ],
  [
    'ORD002',
    'XYZ公司',
    'MacBook Pro',
    '5',
    '74995',
    '李四',
    '2024-01-16',
    '已完成'
  ],
  [
    'ORD003',
    'DEF集团',
    'Dell显示器',
    '20',
    '79980',
    '王五',
    '2024-01-17',
    '处理中'
  ],
  [
    'ORD004',
    'GHI有限公司',
    'iPhone 15 Pro',
    '15',
    '134985',
    '赵六',
    '2024-01-18',
    '待发货'
  ],
  [
    'ORD005',
    '创新科技',
    'AirPods Pro',
    '30',
    '59970',
    '张三',
    '2024-01-19',
    '已完成'
  ],
  [
    'ORD006',
    '未来集团',
    'iPad Pro',
    '8',
    '71992',
    '李四',
    '2024-01-20',
    '已完成'
  ],
  [
    'ORD007',
    '智能公司',
    'Sony耳机',
    '12',
    '29988',
    '王五',
    '2024-01-21',
    '处理中'
  ]
];

const wsSales = XLSX.utils.aoa_to_sheet(salesData);
XLSX.utils.book_append_sheet(wb5, wsSales, '销售记录');

// 客户反馈
const feedbackData = [
  ['反馈ID', '客户', '产品', '评分', '反馈内容', '日期'],
  [
    'FB001',
    'ABC科技',
    'ThinkPad X1',
    '5',
    '产品质量很好，性能稳定',
    '2024-01-20'
  ],
  ['FB002', 'XYZ公司', 'MacBook Pro', '4', '整体满意，价格略高', '2024-01-22'],
  [
    'FB003',
    'DEF集团',
    'Dell显示器',
    '5',
    '显示效果出色，物超所值',
    '2024-01-23'
  ],
  [
    'FB004',
    'GHI有限公司',
    'iPhone 15 Pro',
    '3',
    '功能强大，但电池续航一般',
    '2024-01-24'
  ],
  [
    'FB005',
    '创新科技',
    'AirPods Pro',
    '5',
    '音质优秀，降噪效果好',
    '2024-01-25'
  ]
];

const wsFeedback = XLSX.utils.aoa_to_sheet(feedbackData);
XLSX.utils.book_append_sheet(wb5, wsFeedback, '客户反馈');

XLSX.writeFile(wb5, '/tmp/test-contacts/销售数据.xlsx');

console.log('额外的测试Excel文件已创建:');
console.log('- 产品目录.xlsx');
console.log('- 项目管理.xlsx');
console.log('- 销售数据.xlsx');
console.log('所有文件位于: /tmp/test-contacts/');
