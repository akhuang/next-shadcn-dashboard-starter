#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// 输出目录配置
const OUTPUT_DIRS = {
  contacts: '/tmp/test-contacts',
  navigation: '/tmp/test-navigation',
  reports: '/tmp/reports-business1',
  docker: './scripts/docker/excel-data'
};

// 创建输出目录
function createOutputDirs() {
  Object.values(OUTPUT_DIRS).forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

// 工具函数：生成随机数据
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
      '马',
      '朱',
      '胡',
      '林',
      '郭',
      '何',
      '高',
      '罗'
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
      '华',
      '伟',
      '宇',
      '琳',
      '磊',
      '娜',
      '超',
      '雯',
      '峰',
      '霞'
    ];
    return (
      surnames[Math.floor(Math.random() * surnames.length)] +
      names[Math.floor(Math.random() * names.length)]
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
      '海尔',
      '格力',
      '万科',
      '恒大'
    ];
    const suffixes = [
      '科技',
      '集团',
      '有限公司',
      '股份公司',
      '网络科技',
      '信息技术',
      '控股',
      '投资',
      '实业',
      '发展'
    ];
    return (
      prefixes[Math.floor(Math.random() * prefixes.length)] +
      suffixes[Math.floor(Math.random() * suffixes.length)]
    );
  },

  randomPhone: () =>
    `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  randomLandline: () =>
    `010-${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
  randomEmail: (name, domain = 'company.com') =>
    `${name.toLowerCase()}@${domain}`,
  randomDate: (startYear = 2020, endYear = 2024) => {
    const year =
      startYear + Math.floor(Math.random() * (endYear - startYear + 1));
    const month = Math.floor(Math.random() * 12) + 1;
    const day = Math.floor(Math.random() * 28) + 1;
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  },
  randomAmount: (min = 1000, max = 100000) =>
    `${Math.floor(Math.random() * (max - min) + min).toLocaleString()}`,
  randomChoice: (arr) => arr[Math.floor(Math.random() * arr.length)]
};

// 生成联系人测试数据
function generateContactsData() {
  console.log('\n📋 Generating Rich Contacts Test Data...');

  const wb = XLSX.utils.book_new();

  // 1. 员工详细信息表 - 更多列
  const employeesData = [
    [
      '员工ID',
      '姓名',
      '部门',
      '职位',
      '直属上级',
      '手机',
      '分机',
      '邮箱',
      '入职日期',
      '合同类型',
      '薪资等级',
      '工作地点',
      '紧急联系人',
      '紧急联系电话',
      '状态',
      '备注'
    ]
  ];

  const departments = [
    '技术部',
    '产品部',
    '市场部',
    '销售部',
    '人事部',
    '财务部',
    '运营部',
    '客服部',
    '行政部',
    '法务部'
  ];
  const employeePositions = [
    '工程师',
    '高级工程师',
    '架构师',
    '经理',
    '总监',
    '专员',
    '主管',
    '助理',
    '分析师',
    '顾问'
  ];
  const contractTypes = ['正式员工', '实习生', '外包', '顾问'];
  const locations = [
    '北京总部',
    '上海分公司',
    '深圳研发中心',
    '广州办事处',
    '成都分部'
  ];
  const salaryLevels = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8', 'P9'];

  for (let i = 1; i <= 50; i++) {
    const name = utils.randomName();
    const dept = utils.randomChoice(departments);
    const pos = utils.randomChoice(employeePositions);
    employeesData.push([
      `EMP${String(i).padStart(4, '0')}`,
      name,
      dept,
      pos,
      utils.randomName(),
      utils.randomPhone(),
      `8${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      utils.randomEmail(name),
      utils.randomDate(2020, 2024),
      utils.randomChoice(contractTypes),
      utils.randomChoice(salaryLevels),
      utils.randomChoice(locations),
      utils.randomName(),
      utils.randomPhone(),
      Math.random() > 0.1 ? '在职' : '离职',
      `${dept}${pos}，负责相关业务工作`
    ]);
  }
  const ws1 = XLSX.utils.aoa_to_sheet(employeesData);
  XLSX.utils.book_append_sheet(wb, ws1, '员工信息');

  // 2. 客户详细信息表 - 更多列
  const customersData = [
    [
      '客户ID',
      '公司名称',
      '联系人',
      '职位',
      '手机',
      '固话',
      '传真',
      '邮箱',
      '官网',
      '所在城市',
      '详细地址',
      '行业',
      '客户等级',
      '年营业额',
      '合作日期',
      '负责销售',
      '客户经理',
      '合作状态',
      '信用等级',
      '付款方式',
      '备注'
    ]
  ];

  const industries = [
    '互联网',
    '金融',
    '制造业',
    '服务业',
    '教育',
    '医疗',
    '零售',
    '房地产',
    '能源',
    '交通'
  ];
  const levels = ['钻石', '白金', '黄金', '白银', '青铜'];
  const cities = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '成都',
    '南京',
    '武汉',
    '西安',
    '苏州'
  ];
  const customerPositions = [
    'CEO',
    'CTO',
    'VP',
    '总监',
    '经理',
    '主管',
    '专员'
  ];
  const creditLevels = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
  const paymentMethods = ['现金', '银行转账', '支票', '承兑汇票', '信用证'];
  const customerStatuses = ['活跃', '潜在', '暂停', '流失'];

  for (let i = 1; i <= 100; i++) {
    const name = utils.randomName();
    const company = utils.randomCompany();
    const city = utils.randomChoice(cities);
    const industry = utils.randomChoice(industries);
    customersData.push([
      `CUS${String(i).padStart(6, '0')}`,
      company,
      name,
      utils.randomChoice(customerPositions),
      utils.randomPhone(),
      utils.randomLandline(),
      utils.randomLandline(),
      utils.randomEmail(name, company.toLowerCase() + '.com'),
      `https://www.${company.toLowerCase()}.com`,
      city,
      `${city}市${utils.randomChoice(['朝阳区', '海淀区', '浦东新区', '天河区', '南山区'])}某某路${Math.floor(Math.random() * 999) + 1}号`,
      industry,
      utils.randomChoice(levels),
      utils.randomAmount(100000, 50000000) + '元',
      utils.randomDate(2018, 2024),
      utils.randomName(),
      utils.randomName(),
      utils.randomChoice(customerStatuses),
      utils.randomChoice(creditLevels),
      utils.randomChoice(paymentMethods),
      `${industry}行业重要客户，${company}的核心联系人`
    ]);
  }
  const ws2 = XLSX.utils.aoa_to_sheet(customersData);
  XLSX.utils.book_append_sheet(wb, ws2, '客户信息');

  // 3. 供应商详细信息表 - 更多列
  const suppliersData = [
    [
      '供应商ID',
      '供应商名称',
      '联系人',
      '联系电话',
      '传真',
      '邮箱',
      '官网',
      '注册地址',
      '办公地址',
      '产品类别',
      '主要产品',
      '合作日期',
      '信用等级',
      '年供货额',
      '质量等级',
      '交货周期',
      '付款条件',
      '合作状态',
      '认证资质',
      '备注'
    ]
  ];

  const categories = [
    '电子产品',
    '办公用品',
    '服装鞋帽',
    '食品饮料',
    '建筑材料',
    '化工原料',
    '机械设备',
    '软件服务',
    '物流服务',
    '金融服务'
  ];
  const products = [
    '芯片',
    '显示屏',
    '电路板',
    '传感器',
    '软件开发',
    '数据分析',
    '云服务',
    '咨询服务'
  ];
  const qualityLevels = ['优秀', '良好', '合格', '待改进'];
  const deliveryCycles = ['1-3天', '3-7天', '1-2周', '2-4周', '1-2月'];
  const paymentTerms = [
    '预付50%',
    '货到付款',
    '月结30天',
    '季度结算',
    '半年结算'
  ];
  const certifications = [
    'ISO9001',
    'ISO14001',
    'OHSAS18001',
    'CCC认证',
    'CE认证'
  ];

  for (let i = 1; i <= 60; i++) {
    const name = utils.randomName();
    const company = utils.randomCompany();
    const category = utils.randomChoice(categories);
    const city = utils.randomChoice(cities);
    suppliersData.push([
      `SUP${String(i).padStart(6, '0')}`,
      company,
      name,
      utils.randomPhone(),
      utils.randomLandline(),
      utils.randomEmail(name, company.toLowerCase() + '.com'),
      `https://www.${company.toLowerCase()}.com`,
      `${city}市工商注册地址${Math.floor(Math.random() * 999) + 1}号`,
      `${city}市办公地址${Math.floor(Math.random() * 999) + 1}号`,
      category,
      utils.randomChoice(products),
      utils.randomDate(2015, 2024),
      utils.randomChoice(creditLevels),
      utils.randomAmount(500000, 20000000) + '元',
      utils.randomChoice(qualityLevels),
      utils.randomChoice(deliveryCycles),
      utils.randomChoice(paymentTerms),
      Math.random() > 0.2 ? '合作中' : '暂停合作',
      utils.randomChoice(certifications),
      `专业${category}供应商，提供${utils.randomChoice(products)}等产品服务`
    ]);
  }
  const ws3 = XLSX.utils.aoa_to_sheet(suppliersData);
  XLSX.utils.book_append_sheet(wb, ws3, '供应商信息');

  const contactsFile = path.join(OUTPUT_DIRS.contacts, 'contacts.xlsx');
  XLSX.writeFile(wb, contactsFile);
  console.log(
    `✅ Generated: ${contactsFile} (${employeesData.length - 1} employees, ${customersData.length - 1} customers, ${suppliersData.length - 1} suppliers)`
  );

  return wb;
}

// 生成导航测试数据
function generateNavigationData() {
  console.log('\n🧭 Generating Navigation Test Data...');

  const wb = XLSX.utils.book_new();

  // Enhanced navigation data with more columns
  const navigationData = [
    [
      'ID',
      '类别',
      '子类别',
      '名称',
      '链接',
      '图标',
      '描述',
      '标签',
      '评分',
      '使用频率',
      '更新日期',
      '语言',
      '价格',
      '平台',
      '状态'
    ]
  ];

  const categories = {
    开发工具: {
      IDE编辑器: [
        'VS Code',
        'IntelliJ IDEA',
        'WebStorm',
        'Sublime Text',
        'Atom'
      ],
      版本控制: ['GitHub', 'GitLab', 'Bitbucket', 'SourceTree', 'Git'],
      容器化: ['Docker', 'Kubernetes', 'Podman', 'containerd', 'OpenShift']
    },
    前端技术: {
      JavaScript框架: ['React', 'Vue.js', 'Angular', 'Svelte', 'Ember.js'],
      全栈框架: ['Next.js', 'Nuxt.js', 'Gatsby', 'Remix', 'SvelteKit'],
      UI组件库: [
        'Ant Design',
        'Material-UI',
        'Chakra UI',
        'Tailwind CSS',
        'Bootstrap'
      ]
    },
    后端技术: {
      'Node.js': ['Express.js', 'Koa.js', 'NestJS', 'Fastify', 'Hapi.js'],
      Python: ['Django', 'FastAPI', 'Flask', 'Tornado', 'Pyramid'],
      Java: ['Spring Boot', 'Quarkus', 'Micronaut', 'Play Framework', 'Vert.x']
    },
    数据库: {
      关系型: ['PostgreSQL', 'MySQL', 'SQLite', 'MariaDB', 'Oracle'],
      NoSQL: ['MongoDB', 'CouchDB', 'Cassandra', 'Neo4j', 'DynamoDB'],
      缓存: ['Redis', 'Memcached', 'Hazelcast', 'Apache Ignite', 'Ehcache']
    },
    云服务: {
      国际云: ['AWS', 'Azure', 'Google Cloud', 'DigitalOcean', 'Linode'],
      国内云: ['阿里云', '腾讯云', '华为云', '百度云', '京东云'],
      CDN服务: ['Cloudflare', 'AWS CloudFront', '七牛云', '又拍云', 'jsDelivr']
    }
  };

  const languages = ['中文', '英文', '多语言'];
  const platforms = ['Web', 'Desktop', 'Mobile', 'API', '跨平台'];
  const prices = ['免费', '付费', 'Freemium', '开源', '企业版'];
  const toolStatuses = ['活跃', '稳定', '维护中', '已停止', '测试版'];
  const tags = [
    '热门',
    '推荐',
    '新兴',
    '企业级',
    '轻量级',
    '高性能',
    '易用',
    '专业'
  ];

  let id = 1;

  Object.entries(categories).forEach(([category, subcategories]) => {
    Object.entries(subcategories).forEach(([subcategory, tools]) => {
      tools.forEach((tool) => {
        const rating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0
        const frequency = utils.randomChoice([
          '每天',
          '每周',
          '偶尔',
          '经常',
          '很少'
        ]);
        const updateDate = utils.randomDate(2023, 2024);
        const language = utils.randomChoice(languages);
        const platform = utils.randomChoice(platforms);
        const price = utils.randomChoice(prices);
        const status = utils.randomChoice(toolStatuses);
        const tagList =
          utils.randomChoice(tags) + ',' + utils.randomChoice(tags);

        navigationData.push([
          `NAV${String(id).padStart(4, '0')}`,
          category,
          subcategory,
          tool,
          `https://${tool.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
          '🔧',
          `${tool}是一个优秀的${subcategory}工具，广泛用于${category}开发`,
          tagList,
          rating,
          frequency,
          updateDate,
          language,
          price,
          platform,
          status
        ]);
        id++;
      });
    });
  });

  const ws = XLSX.utils.aoa_to_sheet(navigationData);
  XLSX.utils.book_append_sheet(wb, ws, 'Navigation');

  const navFile = path.join(OUTPUT_DIRS.navigation, 'navigation.xlsx');
  XLSX.writeFile(wb, navFile);
  console.log(
    `✅ Generated: ${navFile} (${navigationData.length - 1} navigation items)`
  );

  return wb;
}

// 生成报表测试数据
function generateReportsData() {
  console.log('\n📊 Generating Enhanced Reports Test Data...');

  const wb = XLSX.utils.book_new();

  // 1. 详细销售报表
  const salesData = [
    [
      '订单ID',
      '日期',
      '销售员',
      '销售员ID',
      '客户',
      '客户ID',
      '产品名称',
      '产品代码',
      '数量',
      '单价',
      '折扣',
      '税率',
      '税额',
      '总金额',
      '地区',
      '城市',
      '销售渠道',
      '订单状态',
      '支付方式',
      '交付日期',
      '备注'
    ]
  ];

  const salesmen = [
    '张三',
    '李四',
    '王五',
    '赵六',
    '陈七',
    '刘八',
    '杨九',
    '孙十',
    '周十一',
    '吴十二'
  ];
  const customers = [
    '阿里巴巴',
    '腾讯科技',
    '百度公司',
    '字节跳动',
    '小米集团',
    '华为技术',
    '京东集团',
    '美团点评',
    '滴滴出行',
    '网易公司'
  ];
  const products = [
    '云服务器',
    '数据库服务',
    '存储服务',
    'CDN服务',
    '安全服务',
    '负载均衡',
    '监控服务',
    '备份服务',
    '容器服务',
    'AI服务'
  ];
  const regions = ['华东', '华南', '华北', '华中', '西南', '西北', '东北'];
  const channels = ['直销', '代理商', '在线', '电话销售', '合作伙伴'];
  const orderStatuses = ['已完成', '进行中', '已发货', '待确认', '已取消'];
  const payments = [
    '银行转账',
    '支付宝',
    '微信支付',
    '现金',
    '信用卡',
    '承兑汇票'
  ];

  for (let i = 1; i <= 200; i++) {
    const salesman = utils.randomChoice(salesmen);
    const customer = utils.randomChoice(customers);
    const product = utils.randomChoice(products);
    const quantity = Math.floor(Math.random() * 50) + 1;
    const unitPrice = Math.floor(Math.random() * 10000) + 1000;
    const discount = Math.random() * 0.2; // 0-20% 折扣
    const taxRate = 0.13; // 13% 税率
    const subtotal = quantity * unitPrice * (1 - discount);
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    salesData.push([
      `ORD${String(i).padStart(6, '0')}`,
      utils.randomDate(2024, 2024),
      salesman,
      `S${String(salesmen.indexOf(salesman) + 1).padStart(3, '0')}`,
      customer,
      `C${String(customers.indexOf(customer) + 1).padStart(6, '0')}`,
      product,
      `P${String(products.indexOf(product) + 1).padStart(4, '0')}`,
      quantity,
      unitPrice.toFixed(2),
      (discount * 100).toFixed(1) + '%',
      (taxRate * 100).toFixed(1) + '%',
      taxAmount.toFixed(2),
      totalAmount.toFixed(2),
      utils.randomChoice(regions),
      utils.randomChoice(['北京', '上海', '深圳', '杭州', '广州', '成都']),
      utils.randomChoice(channels),
      utils.randomChoice(orderStatuses),
      utils.randomChoice(payments),
      utils.randomDate(2024, 2024),
      `${product}销售订单，客户${customer}`
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(salesData);
  XLSX.utils.book_append_sheet(wb, ws1, '销售明细');

  // 2. 详细财务报表
  const financeData = [
    [
      '月份',
      '营业收入',
      '主营业务收入',
      '其他收入',
      '营业成本',
      '销售费用',
      '管理费用',
      '研发费用',
      '财务费用',
      '毛利润',
      '营业利润',
      '利润总额',
      '净利润',
      '毛利率',
      '净利率',
      '资产总额',
      '负债总额',
      '所有者权益',
      '现金流量',
      '备注'
    ]
  ];

  for (let month = 1; month <= 12; month++) {
    const mainRevenue = Math.floor(Math.random() * 2000000) + 8000000; // 800-1000万
    const otherRevenue = Math.floor(Math.random() * 500000) + 100000;
    const totalRevenue = mainRevenue + otherRevenue;
    const operatingCost = Math.floor(
      totalRevenue * (0.4 + Math.random() * 0.2)
    ); // 40-60%
    const salesExpense = Math.floor(totalRevenue * (0.1 + Math.random() * 0.1)); // 10-20%
    const adminExpense = Math.floor(
      totalRevenue * (0.05 + Math.random() * 0.05)
    ); // 5-10%
    const rdExpense = Math.floor(totalRevenue * (0.08 + Math.random() * 0.07)); // 8-15%
    const financeExpense = Math.floor(Math.random() * 100000) + 50000;
    const grossProfit = totalRevenue - operatingCost;
    const operatingProfit =
      grossProfit - salesExpense - adminExpense - rdExpense - financeExpense;
    const totalProfit =
      operatingProfit + Math.floor(Math.random() * 200000) - 100000;
    const netProfit = Math.floor(totalProfit * (0.75 + Math.random() * 0.2)); // 75-95% (税后)
    const grossMargin = ((grossProfit / totalRevenue) * 100).toFixed(1) + '%';
    const netMargin = ((netProfit / totalRevenue) * 100).toFixed(1) + '%';

    financeData.push([
      `2024-${String(month).padStart(2, '0')}`,
      totalRevenue.toLocaleString(),
      mainRevenue.toLocaleString(),
      otherRevenue.toLocaleString(),
      operatingCost.toLocaleString(),
      salesExpense.toLocaleString(),
      adminExpense.toLocaleString(),
      rdExpense.toLocaleString(),
      financeExpense.toLocaleString(),
      grossProfit.toLocaleString(),
      operatingProfit.toLocaleString(),
      totalProfit.toLocaleString(),
      netProfit.toLocaleString(),
      grossMargin,
      netMargin,
      (Math.floor(Math.random() * 50000000) + 100000000).toLocaleString(),
      (Math.floor(Math.random() * 30000000) + 50000000).toLocaleString(),
      (Math.floor(Math.random() * 20000000) + 50000000).toLocaleString(),
      (Math.floor(Math.random() * 10000000) + 5000000).toLocaleString(),
      month <= 6 ? '上半年业绩' : '下半年业绩'
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(financeData);
  XLSX.utils.book_append_sheet(wb, ws2, '财务月报');

  // 3. 详细人力资源报表
  const hrData = [
    [
      '部门',
      '部门编码',
      '在职人数',
      '男性',
      '女性',
      '平均年龄',
      '新入职',
      '离职人数',
      '离职率',
      '平均薪资',
      '薪资中位数',
      '培训时长',
      '培训费用',
      '绩效评分',
      '满意度',
      '加班时长',
      '请假天数',
      '社保缴费',
      '公积金缴费',
      '备注'
    ]
  ];

  const departments = [
    { name: '技术部', code: 'TECH', staff: 45 },
    { name: '产品部', code: 'PROD', staff: 25 },
    { name: '市场部', code: 'MKT', staff: 20 },
    { name: '销售部', code: 'SALES', staff: 30 },
    { name: '人事部', code: 'HR', staff: 8 },
    { name: '财务部', code: 'FIN', staff: 12 },
    { name: '运营部', code: 'OPS', staff: 18 },
    { name: '客服部', code: 'CS', staff: 15 },
    { name: '行政部', code: 'ADMIN', staff: 6 },
    { name: '法务部', code: 'LEGAL', staff: 4 }
  ];

  departments.forEach((dept) => {
    const male = Math.floor(dept.staff * (0.4 + Math.random() * 0.4));
    const female = dept.staff - male;
    const avgAge = Math.floor(Math.random() * 10) + 28; // 28-38岁
    const newHires = Math.floor(Math.random() * 8) + 1;
    const resignations = Math.floor(Math.random() * 5);
    const resignationRate =
      ((resignations / dept.staff) * 100).toFixed(1) + '%';
    const avgSalary = Math.floor(Math.random() * 15000) + 8000; // 8-23k
    const medianSalary = Math.floor(avgSalary * (0.85 + Math.random() * 0.3));
    const trainingHours = Math.floor(Math.random() * 100) + 20;
    const trainingCost = trainingHours * 150; // 150元/小时
    const performance = (Math.random() * 1.5 + 3.5).toFixed(1); // 3.5-5.0
    const satisfaction = (Math.random() * 1 + 4).toFixed(1); // 4.0-5.0
    const overtimeHours = Math.floor(Math.random() * 40) + 10;
    const leaveDays = Math.floor(Math.random() * 15) + 5;
    const socialInsurance = Math.floor(avgSalary * dept.staff * 0.3);
    const housingFund = Math.floor(avgSalary * dept.staff * 0.12);

    hrData.push([
      dept.name,
      dept.code,
      dept.staff,
      male,
      female,
      avgAge,
      newHires,
      resignations,
      resignationRate,
      avgSalary.toLocaleString(),
      medianSalary.toLocaleString(),
      trainingHours,
      trainingCost.toLocaleString(),
      performance,
      satisfaction,
      overtimeHours,
      leaveDays,
      socialInsurance.toLocaleString(),
      housingFund.toLocaleString(),
      `${dept.name}月度汇总数据`
    ]);
  });

  const ws3 = XLSX.utils.aoa_to_sheet(hrData);
  XLSX.utils.book_append_sheet(wb, ws3, '人力资源');

  // 4. 项目管理报表
  const projectData = [
    [
      '项目ID',
      '项目名称',
      '项目经理',
      '开始日期',
      '计划结束',
      '实际结束',
      '项目状态',
      '预算',
      '实际成本',
      '完成度',
      '风险等级',
      '团队人数',
      '客户满意度',
      '延期天数',
      '变更次数',
      '测试用例',
      '缺陷数量',
      '代码行数',
      '文档页数',
      '备注'
    ]
  ];

  const projectNames = [
    '电商平台升级',
    '移动APP开发',
    '数据中台建设',
    'AI推荐系统',
    '用户画像分析',
    '实时监控系统',
    '微服务重构',
    '区块链溯源',
    '智能客服',
    '供应链管理'
  ];
  const managers = [
    '项目经理A',
    '项目经理B',
    '项目经理C',
    '项目经理D',
    '项目经理E'
  ];
  const projectStatuses = ['进行中', '已完成', '已暂停', '计划中', '验收中'];
  const riskLevels = ['低', '中', '高', '极高'];

  for (let i = 0; i < projectNames.length; i++) {
    const startDate = utils.randomDate(2024, 2024);
    const plannedEnd = utils.randomDate(2024, 2024);
    const actualEnd = Math.random() > 0.3 ? utils.randomDate(2024, 2024) : '';
    const budget = Math.floor(Math.random() * 5000000) + 1000000;
    const actualCost = Math.floor(budget * (0.8 + Math.random() * 0.5)); // 80%-130%
    const completion = Math.floor(Math.random() * 100) + 1;
    const teamSize = Math.floor(Math.random() * 15) + 5;
    const satisfaction = (Math.random() * 2 + 3).toFixed(1);
    const delayDays = Math.floor(Math.random() * 30);
    const changes = Math.floor(Math.random() * 10);
    const testCases = Math.floor(Math.random() * 500) + 100;
    const bugs = Math.floor(Math.random() * 50);
    const codeLines = Math.floor(Math.random() * 100000) + 10000;
    const docPages = Math.floor(Math.random() * 200) + 50;

    projectData.push([
      `PROJ${String(i + 1).padStart(4, '0')}`,
      projectNames[i],
      utils.randomChoice(managers),
      startDate,
      plannedEnd,
      actualEnd,
      utils.randomChoice(projectStatuses),
      budget.toLocaleString(),
      actualCost.toLocaleString(),
      `${completion}%`,
      utils.randomChoice(riskLevels),
      teamSize,
      satisfaction,
      delayDays,
      changes,
      testCases,
      bugs,
      codeLines.toLocaleString(),
      docPages,
      `${projectNames[i]}项目详细信息`
    ]);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(projectData);
  XLSX.utils.book_append_sheet(wb, ws4, '项目管理');

  const reportsFile = path.join(OUTPUT_DIRS.reports, 'business-report.xlsx');
  XLSX.writeFile(wb, reportsFile);
  console.log(
    `✅ Generated: ${reportsFile} (${salesData.length - 1} sales records, ${financeData.length - 1} finance records, ${hrData.length - 1} hr records, ${projectData.length - 1} project records)`
  );

  return wb;
}

// 生成Docker测试数据
function generateDockerTestData() {
  console.log('\n🐳 Generating Docker Test Data...');

  // 复制联系人数据到Docker目录
  const contactsWb = generateContactsData();
  const dockerContactsFile = path.join(
    OUTPUT_DIRS.docker,
    '01-联系人数据.xlsx'
  );
  XLSX.writeFile(contactsWb, dockerContactsFile);
  console.log(`✅ Generated: ${dockerContactsFile}`);

  // 生成产品目录
  const productWb = XLSX.utils.book_new();
  const productData = [
    ['产品ID', '产品名称', '分类', '价格', '库存', '供应商', '状态'],
    [
      'P001',
      'MacBook Pro 16"',
      '笔记本电脑',
      '16999',
      '50',
      'Apple Inc.',
      '在售'
    ],
    ['P002', 'iPhone 15 Pro', '智能手机', '7999', '120', 'Apple Inc.', '在售'],
    ['P003', 'Surface Pro 9', '平板电脑', '8888', '30', 'Microsoft', '在售'],
    ['P004', 'ThinkPad X1', '商务笔记本', '12999', '25', 'Lenovo', '在售'],
    ['P005', 'Galaxy S24', '安卓手机', '5999', '80', 'Samsung', '在售'],
    ['P006', 'iPad Pro', '平板电脑', '6799', '60', 'Apple Inc.', '在售'],
    ['P007', 'Dell XPS 13', '超薄笔记本', '9999', '35', 'Dell', '在售'],
    ['P008', 'AirPods Pro', '无线耳机', '1999', '200', 'Apple Inc.', '在售']
  ];
  const productWs = XLSX.utils.aoa_to_sheet(productData);
  XLSX.utils.book_append_sheet(productWb, productWs, '产品目录');

  const dockerProductFile = path.join(OUTPUT_DIRS.docker, '04-产品目录.xlsx');
  XLSX.writeFile(productWb, dockerProductFile);
  console.log(`✅ Generated: ${dockerProductFile}`);

  // 生成订单数据
  const orderWb = XLSX.utils.book_new();
  const orderData = [
    ['订单号', '客户', '产品', '数量', '单价', '总额', '订单日期', '状态'],
    [
      'ORD001',
      '阿里巴巴',
      'MacBook Pro 16"',
      '10',
      '16999',
      '169990',
      '2024-08-01',
      '已发货'
    ],
    [
      'ORD002',
      '腾讯科技',
      'iPhone 15 Pro',
      '20',
      '7999',
      '159980',
      '2024-08-02',
      '已完成'
    ],
    [
      'ORD003',
      '百度公司',
      'Surface Pro 9',
      '5',
      '8888',
      '44440',
      '2024-08-03',
      '处理中'
    ],
    [
      'ORD004',
      '字节跳动',
      'ThinkPad X1',
      '15',
      '12999',
      '194985',
      '2024-08-04',
      '已发货'
    ],
    [
      'ORD005',
      '小米集团',
      'Galaxy S24',
      '25',
      '5999',
      '149975',
      '2024-08-05',
      '已完成'
    ],
    [
      'ORD006',
      '华为技术',
      'iPad Pro',
      '8',
      '6799',
      '54392',
      '2024-08-06',
      '处理中'
    ],
    [
      'ORD007',
      '京东集团',
      'Dell XPS 13',
      '12',
      '9999',
      '119988',
      '2024-08-07',
      '已发货'
    ],
    [
      'ORD008',
      '美团点评',
      'AirPods Pro',
      '50',
      '1999',
      '99950',
      '2024-08-08',
      '已完成'
    ]
  ];
  const orderWs = XLSX.utils.aoa_to_sheet(orderData);
  XLSX.utils.book_append_sheet(orderWb, orderWs, '订单记录');

  const dockerOrderFile = path.join(OUTPUT_DIRS.docker, '05-订单记录.xlsx');
  XLSX.writeFile(orderWb, dockerOrderFile);
  console.log(`✅ Generated: ${dockerOrderFile}`);
}

// 生成大表测试数据
function generateLargeTestData() {
  console.log('\n📈 Generating Large Test Data...');

  const wb = XLSX.utils.book_new();

  // 生成1000行测试数据
  const largeData = [
    [
      'ID',
      '姓名',
      '部门',
      '职位',
      '邮箱',
      '电话',
      '入职日期',
      '薪资',
      '绩效',
      '状态'
    ]
  ];

  const departments = [
    '技术部',
    '产品部',
    '市场部',
    '销售部',
    '人事部',
    '财务部',
    '运营部',
    '客服部'
  ];
  const largeDataPositions = [
    '工程师',
    '经理',
    '专员',
    '主管',
    '总监',
    '助理',
    '分析师',
    '顾问'
  ];
  const employeeStatuses = ['在职', '试用期', '离职', '调岗'];

  for (let i = 1; i <= 1000; i++) {
    const dept = departments[Math.floor(Math.random() * departments.length)];
    const pos =
      largeDataPositions[Math.floor(Math.random() * largeDataPositions.length)];
    const status =
      employeeStatuses[Math.floor(Math.random() * employeeStatuses.length)];
    const salary = Math.floor(Math.random() * 20000) + 8000; // 8000-28000
    const performance = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0

    largeData.push([
      `EMP${i.toString().padStart(4, '0')}`,
      `员工${i}`,
      dept,
      pos,
      `emp${i}@company.com`,
      `138${Math.floor(Math.random() * 100000000)
        .toString()
        .padStart(8, '0')}`,
      `2023-${Math.floor(Math.random() * 12 + 1)
        .toString()
        .padStart(2, '0')}-${Math.floor(Math.random() * 28 + 1)
        .toString()
        .padStart(2, '0')}`,
      salary,
      performance,
      status
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(largeData);
  XLSX.utils.book_append_sheet(wb, ws, '大数据测试');

  const largeFile = path.join(OUTPUT_DIRS.contacts, 'large-test-data.xlsx');
  XLSX.writeFile(wb, largeFile);
  console.log(`✅ Generated: ${largeFile} (1000 rows)`);
}

// 生成合并单元格测试数据
function generateMergedCellsData() {
  console.log('\n🔗 Generating Merged Cells Test Data...');

  const wb = XLSX.utils.book_new();

  const data = [
    ['部门', '', '员工信息', '', '', '联系方式', ''],
    ['', '', '姓名', '职位', '工号', '电话', '邮箱'],
    [
      '技术部',
      '',
      '张三',
      '高级工程师',
      'E001',
      '13800138001',
      'zhangsan@company.com'
    ],
    ['', '', '李四', '前端工程师', 'E002', '13800138002', 'lisi@company.com'],
    ['', '', '王五', '测试工程师', 'E003', '13800138003', 'wangwu@company.com'],
    [
      '产品部',
      '',
      '赵六',
      '产品经理',
      'E004',
      '13800138004',
      'zhaoliu@company.com'
    ],
    ['', '', '陈七', '产品助理', 'E005', '13800138005', 'chenqi@company.com'],
    [
      '市场部',
      '',
      '刘八',
      '市场经理',
      'E006',
      '13800138006',
      'liuba@company.com'
    ],
    ['', '', '杨九', '市场专员', 'E007', '13800138007', 'yangjiu@company.com']
  ];

  const ws = XLSX.utils.aoa_to_sheet(data);

  // 添加合并单元格信息
  ws['!merges'] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 1 } }, // A1:B1 部门
    { s: { r: 0, c: 2 }, e: { r: 0, c: 4 } }, // C1:E1 员工信息
    { s: { r: 0, c: 5 }, e: { r: 0, c: 6 } }, // F1:G1 联系方式
    { s: { r: 2, c: 0 }, e: { r: 4, c: 1 } }, // A3:B5 技术部
    { s: { r: 5, c: 0 }, e: { r: 6, c: 1 } }, // A6:B7 产品部
    { s: { r: 7, c: 0 }, e: { r: 8, c: 1 } } // A8:B9 市场部
  ];

  XLSX.utils.book_append_sheet(wb, ws, '合并单元格');

  const mergedFile = path.join(OUTPUT_DIRS.contacts, 'merged-cells-test.xlsx');
  XLSX.writeFile(wb, mergedFile);
  console.log(`✅ Generated: ${mergedFile}`);
}

// 主函数
function main() {
  console.log('🚀 Starting Test Data Generation...\n');

  try {
    // 创建输出目录
    createOutputDirs();

    // 生成各种测试数据
    generateContactsData();
    generateNavigationData();
    generateReportsData();
    generateDockerTestData();
    generateLargeTestData();
    generateMergedCellsData();

    console.log('\n✅ All test data generated successfully!');
    console.log('\n📂 Generated files:');
    console.log(`   - Contacts: ${OUTPUT_DIRS.contacts}`);
    console.log(`   - Navigation: ${OUTPUT_DIRS.navigation}`);
    console.log(`   - Reports: ${OUTPUT_DIRS.reports}`);
    console.log(`   - Docker: ${OUTPUT_DIRS.docker}`);

    console.log('\n💡 Usage:');
    console.log('   1. Start Excel Monitor Service: npm run excel-monitor');
    console.log('   2. Start Next.js: npm run dev');
    console.log('   3. Visit http://localhost:3000/dashboard/contacts');
  } catch (error) {
    console.error('❌ Error generating test data:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = {
  generateContactsData,
  generateNavigationData,
  generateReportsData,
  generateDockerTestData,
  generateLargeTestData,
  generateMergedCellsData
};
