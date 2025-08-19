const XLSX = require('xlsx');
const path = require('path');

// 创建第一个Excel文件 - 客户联系人
const wb1 = XLSX.utils.book_new();

// Sheet1 - 基本信息
const data1 = [
  ['姓名', '电话', '邮箱', '公司', '职位'],
  ['张三', '13800138001', 'zhangsan@example.com', 'ABC科技', '产品经理'],
  ['李四', '13800138002', 'lisi@example.com', 'XYZ公司', '技术总监'],
  ['王五', '13800138003', 'wangwu@example.com', 'DEF集团', '销售经理'],
  ['赵六', '13800138004', 'zhaoliu@example.com', 'GHI有限公司', '市场总监']
];

const ws1 = XLSX.utils.aoa_to_sheet(data1);
XLSX.utils.book_append_sheet(wb1, ws1, '客户');

// Sheet2 - 供应商
const data2 = [
  ['公司名称', '联系人', '电话', '地址', '产品类型'],
  ['供应商A', '刘经理', '02112345678', '上海市浦东新区', '电子元件'],
  ['供应商B', '陈总', '01087654321', '北京市朝阳区', '机械配件'],
  ['供应商C', '周主管', '075588889999', '深圳市南山区', '软件服务']
];

const ws2 = XLSX.utils.aoa_to_sheet(data2);
XLSX.utils.book_append_sheet(wb1, ws2, '供应商');

// 写入第一个文件
XLSX.writeFile(wb1, '/tmp/test-contacts/客户联系人.xlsx');

// 创建第二个Excel文件 - 员工通讯录
const wb2 = XLSX.utils.book_new();

const employeeData = [
  ['工号', '姓名', '部门', '职位', '手机', '邮箱', '入职日期'],
  [
    'E001',
    '张明',
    '技术部',
    '前端工程师',
    '13900139001',
    'zhangming@company.com',
    '2023-01-15'
  ],
  [
    'E002',
    '李红',
    '人事部',
    'HR经理',
    '13900139002',
    'lihong@company.com',
    '2022-06-20'
  ],
  [
    'E003',
    '王强',
    '销售部',
    '销售总监',
    '13900139003',
    'wangqiang@company.com',
    '2021-03-10'
  ],
  [
    'E004',
    '刘芳',
    '财务部',
    '财务主管',
    '13900139004',
    'liufang@company.com',
    '2020-09-01'
  ],
  [
    'E005',
    '陈杰',
    '技术部',
    '后端工程师',
    '13900139005',
    'chenjie@company.com',
    '2023-07-01'
  ]
];

const wsEmployee = XLSX.utils.aoa_to_sheet(employeeData);

// 添加合并单元格示例
wsEmployee['!merges'] = [
  { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } } // 示例合并
];

XLSX.utils.book_append_sheet(wb2, wsEmployee, '员工通讯录');

// 写入第二个文件
XLSX.writeFile(wb2, '/tmp/test-contacts/员工通讯录.xlsx');

console.log('测试Excel文件已创建在 /tmp/test-contacts/ 目录下');
console.log('文件列表:');
console.log('- 客户联系人.xlsx');
console.log('- 员工通讯录.xlsx');
