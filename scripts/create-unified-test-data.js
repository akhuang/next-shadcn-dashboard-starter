#!/usr/bin/env node

const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// 确保目录存在
const outputDir = '/tmp/test-contacts';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 清理现有文件
const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.xlsx'));
existingFiles.forEach(file => {
  fs.unlinkSync(path.join(outputDir, file));
});

console.log('🚀 开始生成统一的 Excel 测试数据...\n');

// 工具函数：生成随机数据
const utils = {
  randomName: () => {
    const surnames = ['张', '李', '王', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
    const names = ['明', '红', '强', '芳', '杰', '丽', '军', '敏', '涛', '静'];
    return surnames[Math.floor(Math.random() * surnames.length)] + 
           names[Math.floor(Math.random() * names.length)];
  },
  
  randomCompany: () => {
    const prefixes = ['阿里', '腾讯', '百度', '京东', '美团', '字节', '滴滴', '小米', '华为', '中兴'];
    const suffixes = ['科技', '集团', '有限公司', '股份公司', '网络科技', '信息技术'];
    return prefixes[Math.floor(Math.random() * prefixes.length)] + 
           suffixes[Math.floor(Math.random() * suffixes.length)];
  },
  
  randomPhone: () => `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  
  randomEmail: (name, domain = 'company.com') => `${name.toLowerCase()}@${domain}`,
  
  randomDate: (startYear = 2020, endYear = 2024) => {
    const year = startYear + Math.floor(Math.random() * (endYear - startYear + 1));
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },
  
  randomAmount: (min = 1000, max = 100000) => 
    `${Math.floor(Math.random() * (max - min) + min).toLocaleString()}元`,
  
  randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)]
};

// 数据生成器
const generators = {
  // 客户信息数据
  customer: (count) => {
    const positions = ['CEO', 'CTO', 'VP', '总监', '经理', '主管', '专员'];
    const industries = ['互联网', '金融', '制造业', '服务业', '教育', '医疗', '零售'];
    const cities = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉'];
    const levels = ['钻石', '白金', '黄金', '白银', '青铜'];
    
    const data = [['客户ID', '公司名称', '联系人', '职位', '手机', '固话', '邮箱', '所在城市', 
                   '行业', '客户等级', '年营业额', '合作日期', '负责销售', '状态', '备注']];
    
    for (let i = 1; i <= count; i++) {
      const name = utils.randomName();
      const company = utils.randomCompany();
      data.push([
        `CUS${String(i).padStart(6, '0')}`,
        company,
        name,
        utils.randomChoice(positions),
        utils.randomPhone(),
        `010-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        utils.randomEmail(name),
        utils.randomChoice(cities),
        utils.randomChoice(industries),
        utils.randomChoice(levels),
        utils.randomAmount(100000, 10000000),
        utils.randomDate(2020, 2023),
        utils.randomName(),
        Math.random() > 0.2 ? '活跃' : '非活跃',
        `客户${company}的详细备注信息，包含合作历史和特殊要求。`
      ]);
    }
    return data;
  },

  // 供应商数据
  supplier: (count) => {
    const categories = ['电子产品', '办公用品', '服装鞋帽', '食品饮料', '建筑材料', '化工原料'];
    const regions = ['华北', '华东', '华南', '西南', '东北', '西北'];
    const ratings = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
    
    const data = [['供应商ID', '供应商名称', '联系人', '联系电话', '传真', '地址', 
                   '产品类别', '合作日期', '信用等级', '年供货额', '质量等级', '交货周期', '备注']];
    
    for (let i = 1; i <= count; i++) {
      const name = utils.randomName();
      const company = utils.randomCompany();
      data.push([
        `SUP${String(i).padStart(6, '0')}`,
        company,
        name,
        utils.randomPhone(),
        `010-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
        `${utils.randomChoice(regions)}地区详细地址${i}号`,
        utils.randomChoice(categories),
        utils.randomDate(2019, 2023),
        utils.randomChoice(ratings),
        utils.randomAmount(500000, 5000000),
        `${Math.floor(Math.random() * 5) + 1}星`,
        `${Math.floor(Math.random() * 30) + 5}天`,
        `供应商${company}的合作说明和特殊条款。`
      ]);
    }
    return data;
  },

  // 员工数据
  employee: (count) => {
    const departments = ['技术部', '市场部', '销售部', '人事部', '财务部', '运营部', '法务部'];
    const positions = ['总监', '经理', '主管', '高级工程师', '工程师', '专员', '助理'];
    const education = ['博士', '硕士', '本科', '大专', '高中'];
    const status = ['在职', '试用期', '离职', '停薪留职'];
    
    const data = [['员工ID', '姓名', '部门', '职位', '直属上级', '手机', '邮箱', '入职日期', 
                   '转正日期', '学历', '毕业院校', '工作状态', '基本薪资', '绩效奖金', '备注']];
    
    for (let i = 1; i <= count; i++) {
      const name = utils.randomName();
      const joinDate = utils.randomDate(2018, 2024);
      data.push([
        `EMP${String(i).padStart(6, '0')}`,
        name,
        utils.randomChoice(departments),
        utils.randomChoice(positions),
        utils.randomName(),
        utils.randomPhone(),
        utils.randomEmail(name, 'company.com'),
        joinDate,
        utils.randomDate(2018, 2024),
        utils.randomChoice(education),
        `${utils.randomChoice(['清华', '北大', '复旦', '交大', '中山', '华科'])}大学`,
        utils.randomChoice(status),
        utils.randomAmount(8000, 50000),
        utils.randomAmount(2000, 20000),
        `员工${name}的工作表现和发展规划记录。`
      ]);
    }
    return data;
  },

  // 产品数据
  product: (count) => {
    const categories = ['电子设备', '办公用品', '家具用品', '软件服务', '咨询服务'];
    const brands = ['自有品牌', '代理品牌A', '代理品牌B', '合作品牌', '第三方品牌'];
    const status = ['在售', '预售', '停售', '缺货', '下架'];
    
    const data = [['产品ID', '产品名称', '产品类别', '品牌', '规格型号', '单价', '成本价', 
                   '库存数量', '安全库存', '供应商', '上架日期', '销售状态', '月销量', '评分', '描述']];
    
    for (let i = 1; i <= count; i++) {
      const category = utils.randomChoice(categories);
      data.push([
        `PRD${String(i).padStart(6, '0')}`,
        `${category}产品${i}`,
        category,
        utils.randomChoice(brands),
        `Model-${String(i).padStart(4, '0')}`,
        utils.randomAmount(100, 10000),
        utils.randomAmount(50, 5000),
        Math.floor(Math.random() * 1000),
        Math.floor(Math.random() * 100),
        utils.randomCompany(),
        utils.randomDate(2022, 2024),
        utils.randomChoice(status),
        Math.floor(Math.random() * 500),
        `${(Math.random() * 2 + 3).toFixed(1)}星`,
        `${category}的详细产品描述，包含功能特性和使用说明。`
      ]);
    }
    return data;
  },

  // 订单数据
  order: (count) => {
    const orderStatus = ['待付款', '已付款', '已发货', '已完成', '已取消', '退款中'];
    const payMethods = ['支付宝', '微信支付', '银行转账', '现金', '支票', '信用卡'];
    
    const data = [['订单ID', '客户ID', '客户名称', '产品名称', '数量', '单价', '总金额', 
                   '下单日期', '付款日期', '发货日期', '订单状态', '支付方式', '收货地址', '备注']];
    
    for (let i = 1; i <= count; i++) {
      const quantity = Math.floor(Math.random() * 100) + 1;
      const unitPrice = Math.floor(Math.random() * 1000) + 10;
      const totalAmount = quantity * unitPrice;
      
      data.push([
        `ORD${String(i).padStart(8, '0')}`,
        `CUS${String(Math.floor(Math.random() * 1000) + 1).padStart(6, '0')}`,
        utils.randomName(),
        `产品${Math.floor(Math.random() * 100) + 1}`,
        quantity,
        `${unitPrice}元`,
        `${totalAmount.toLocaleString()}元`,
        utils.randomDate(2023, 2024),
        utils.randomDate(2023, 2024),
        utils.randomDate(2023, 2024),
        utils.randomChoice(orderStatus),
        utils.randomChoice(payMethods),
        `北京市朝阳区某某街道${i}号`,
        `订单${i}的特殊要求和处理说明。`
      ]);
    }
    return data;
  }
};

// 特殊测试数据生成器
const specialGenerators = {
  // 宽表格（很多列）
  wideTable: () => {
    const headers = [];
    const data = [];
    
    // 生成50列
    for (let i = 1; i <= 50; i++) {
      headers.push(`列${i}`);
    }
    data.push(headers);
    
    // 生成100行数据
    for (let row = 1; row <= 100; row++) {
      const rowData = [];
      for (let col = 1; col <= 50; col++) {
        rowData.push(`行${row}列${col}`);
      }
      data.push(rowData);
    }
    return data;
  },

  // 长表格（很多行）
  longTable: () => {
    const data = [['ID', '名称', '描述', '创建时间']];
    
    // 生成5000行数据
    for (let i = 1; i <= 5000; i++) {
      data.push([
        i,
        `项目${i}`,
        `这是第${i}项的详细描述内容，用于测试长表格的滚动性能。`,
        utils.randomDate(2020, 2024)
      ]);
    }
    return data;
  },

  // 合并单元格测试
  mergedCells: () => {
    const data = [
      ['公司年度报告', '', '', ''],
      ['', '', '', ''],
      ['部门', '上半年', '', '下半年', ''],
      ['', '营收', '利润', '营收', '利润'],
      ['技术部', '1000万', '200万', '1200万', '300万'],
      ['销售部', '2000万', '400万', '2500万', '600万'],
      ['市场部', '800万', '150万', '900万', '200万']
    ];
    
    return {
      data,
      merges: [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } }, // 标题合并
        { s: { r: 2, c: 1 }, e: { r: 2, c: 2 } }, // 上半年
        { s: { r: 2, c: 3 }, e: { r: 2, c: 4 } }, // 下半年
      ]
    };
  },

  // 边界数据测试
  boundary: () => {
    const data = [
      ['数据类型', '测试值', '说明'],
      ['空值', '', '空字符串'],
      ['空值', null, 'null值'],
      ['空值', undefined, 'undefined值'],
      ['大数字', '999999999999999', '超大整数'],
      ['小数', '3.141592653589793', '高精度小数'],
      ['负数', '-123456.789', '负数测试'],
      ['特殊字符', '!@#$%^&*()_+-=[]{}|;:,.<>?', '特殊符号'],
      ['中文', '这是一段很长的中文文本内容，用于测试中文字符的显示和处理能力。', '中文测试'],
      ['英文', 'This is a very long English text content for testing the display and processing capabilities of English characters in Excel cells.', '英文测试'],
      ['日期', new Date().toISOString(), 'ISO日期格式'],
      ['布尔值', true, '布尔真值'],
      ['布尔值', false, '布尔假值'],
      ['数组', '[1,2,3,4,5]', '数组字符串'],
      ['对象', '{"key":"value"}', 'JSON对象'],
      ['超长文本', 'A'.repeat(1000), '1000个字符']
    ];
    return data;
  }
};

// 创建Excel文件的辅助函数
function createExcelFile(filename, sheets) {
  const workbook = XLSX.utils.book_new();
  let totalRows = 0;
  
  sheets.forEach(({ name, data, merges }) => {
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    
    // 如果有合并单元格信息
    if (merges) {
      worksheet['!merges'] = merges;
    }
    
    XLSX.utils.book_append_sheet(workbook, worksheet, name);
    totalRows += data.length - 1; // 减去表头
  });
  
  const filepath = path.join(outputDir, filename);
  XLSX.writeFile(workbook, filepath);
  console.log(`✓ ${filename.padEnd(25)} - ${totalRows.toString().padStart(4)} 行数据`);
  return totalRows;
}

// 主生成流程
let totalDataCount = 0;

console.log('📊 生成基础业务数据文件...');
totalDataCount += createExcelFile('01-客户信息.xlsx', [
  { name: 'VIP客户', data: generators.customer(200) },
  { name: '普通客户', data: generators.customer(500) },
  { name: '潜在客户', data: generators.customer(300) }
]);

totalDataCount += createExcelFile('02-供应商管理.xlsx', [
  { name: '核心供应商', data: generators.supplier(100) },
  { name: '普通供应商', data: generators.supplier(200) }
]);

totalDataCount += createExcelFile('03-员工档案.xlsx', [
  { name: '在职员工', data: generators.employee(300) },
  { name: '离职员工', data: generators.employee(50) }
]);

totalDataCount += createExcelFile('04-产品目录.xlsx', [
  { name: '热销产品', data: generators.product(400) },
  { name: '普通产品', data: generators.product(600) }
]);

totalDataCount += createExcelFile('05-订单记录.xlsx', [
  { name: '本年订单', data: generators.order(800) },
  { name: '历史订单', data: generators.order(1200) }
]);

console.log('\n🧪 生成特殊测试文件...');
totalDataCount += createExcelFile('06-宽表格测试.xlsx', [
  { name: '50列宽表', data: specialGenerators.wideTable() }
]);

totalDataCount += createExcelFile('07-长表格测试.xlsx', [
  { name: '5000行长表', data: specialGenerators.longTable() }
]);

const mergedData = specialGenerators.mergedCells();
totalDataCount += createExcelFile('08-合并单元格测试.xlsx', [
  { name: '合并测试', data: mergedData.data, merges: mergedData.merges }
]);

totalDataCount += createExcelFile('09-边界数据测试.xlsx', [
  { name: '边界值测试', data: specialGenerators.boundary() }
]);

console.log('\n🎯 生成综合性能测试文件...');
totalDataCount += createExcelFile('10-性能测试.xlsx', [
  { name: '客户数据', data: generators.customer(2000) },
  { name: '订单数据', data: generators.order(3000) },
  { name: '产品数据', data: generators.product(1500) }
]);

console.log('\n' + '='.repeat(60));
console.log('✅ 统一测试数据生成完成！');
console.log('='.repeat(60));
console.log(`📁 输出目录: ${outputDir}`);
console.log(`📊 总数据量: ${totalDataCount.toLocaleString()} 条记录`);
console.log(`📄 文件数量: 10 个 Excel 文件`);
console.log('');
console.log('🚀 测试场景覆盖:');
console.log('   ✓ 基础业务数据 (客户、供应商、员工、产品、订单)');
console.log('   ✓ 超宽表格 (50列)');
console.log('   ✓ 超长表格 (5000行)');
console.log('   ✓ 合并单元格');
console.log('   ✓ 边界值数据');
console.log('   ✓ 大数据性能 (6500条记录)');
console.log('');
console.log('🎯 启动测试:');
console.log('   pnpm dev:full');
console.log('   访问: http://localhost:3000/dashboard/contacts-v3');
console.log('');