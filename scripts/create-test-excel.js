const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Create test directory
const testDir = '/tmp/test-contacts';
if (!fs.existsSync(testDir)) {
  fs.mkdirSync(testDir, { recursive: true });
}

// Create a simple test Excel file
function createTestExcel() {
  const workbook = XLSX.utils.book_new();

  // Create sheet 1 with customer data
  const customers = [
    ['客户ID', '客户名称', '联系人', '电话', '邮箱', '地址'],
    [
      'C001',
      '科技有限公司',
      '张三',
      '13800138000',
      'zhang@example.com',
      '北京市朝阳区'
    ],
    [
      'C002',
      '贸易公司',
      '李四',
      '13900139000',
      'li@example.com',
      '上海市浦东新区'
    ],
    [
      'C003',
      '制造企业',
      '王五',
      '13700137000',
      'wang@example.com',
      '深圳市南山区'
    ],
    [
      'C004',
      '服务公司',
      '赵六',
      '13600136000',
      'zhao@example.com',
      '广州市天河区'
    ],
    [
      'C005',
      '咨询公司',
      '钱七',
      '13500135000',
      'qian@example.com',
      '杭州市西湖区'
    ]
  ];

  const ws1 = XLSX.utils.aoa_to_sheet(customers);
  XLSX.utils.book_append_sheet(workbook, ws1, '客户列表');

  // Create sheet 2 with supplier data
  const suppliers = [
    ['供应商ID', '供应商名称', '联系人', '电话', '产品类别'],
    ['S001', '原材料供应商', '周一', '13400134000', '原材料'],
    ['S002', '设备供应商', '吴二', '13300133000', '机械设备'],
    ['S003', '办公用品供应商', '郑三', '13200132000', '办公用品'],
    ['S004', '物流服务商', '王四', '13100131000', '物流服务']
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(suppliers);
  XLSX.utils.book_append_sheet(workbook, ws2, '供应商列表');

  // Create sheet 3 with employee data
  const employees = [
    ['员工ID', '姓名', '部门', '职位', '入职日期', '电话'],
    ['E001', '张经理', '管理部', '总经理', '2020-01-01', '13000130000'],
    ['E002', '李主管', '销售部', '销售主管', '2020-03-15', '13000130001'],
    ['E003', '王工程师', '技术部', '高级工程师', '2020-06-01', '13000130002'],
    ['E004', '赵会计', '财务部', '会计', '2021-01-10', '13000130003'],
    ['E005', '钱助理', '行政部', '行政助理', '2021-08-20', '13000130004'],
    ['E006', '孙经理', '市场部', '市场经理', '2021-11-01', '13000130005']
  ];

  const ws3 = XLSX.utils.aoa_to_sheet(employees);
  XLSX.utils.book_append_sheet(workbook, ws3, '员工信息');

  // Write file
  const filePath = path.join(testDir, '测试数据.xlsx');
  XLSX.writeFile(workbook, filePath);
  console.log(`Created test file: ${filePath}`);

  // Create another test file with products
  const workbook2 = XLSX.utils.book_new();

  const products = [
    ['产品ID', '产品名称', '类别', '单价', '库存', '供应商'],
    ['P001', '笔记本电脑', '电子产品', '5999', '50', 'S002'],
    ['P002', '办公桌', '办公家具', '1299', '100', 'S003'],
    ['P003', '打印纸', '办公用品', '29', '1000', 'S003'],
    ['P004', '投影仪', '电子产品', '3999', '20', 'S002'],
    ['P005', '文件柜', '办公家具', '899', '30', 'S003']
  ];

  const wsProducts = XLSX.utils.aoa_to_sheet(products);
  XLSX.utils.book_append_sheet(workbook2, wsProducts, '产品目录');

  const filePath2 = path.join(testDir, '产品数据.xlsx');
  XLSX.writeFile(workbook2, filePath2);
  console.log(`Created test file: ${filePath2}`);
}

createTestExcel();
console.log('Test Excel files created successfully in /tmp/test-contacts');
