const XLSX = require('xlsx');

// 生成大量测试数据
function generateLargeTestData() {
  console.log('🚀 开始生成大量测试数据...');

  // 1. 客户信息表 - 15列 x 120行
  const wb1 = XLSX.utils.book_new();

  const customerHeaders = [
    '客户ID',
    '公司名称',
    '联系人',
    '职位',
    '手机号码',
    '固定电话',
    '邮箱地址',
    '公司地址',
    '邮政编码',
    '所在城市',
    '所在省份',
    '行业类型',
    '公司规模',
    '年营业额',
    '合作开始日期',
    '客户等级',
    '负责销售',
    '备注信息'
  ];

  const customerData = [customerHeaders];

  const cities = [
    '北京',
    '上海',
    '广州',
    '深圳',
    '杭州',
    '南京',
    '成都',
    '重庆',
    '西安',
    '武汉'
  ];
  const provinces = [
    '北京市',
    '上海市',
    '广东省',
    '广东省',
    '浙江省',
    '江苏省',
    '四川省',
    '重庆市',
    '陕西省',
    '湖北省'
  ];
  const industries = [
    '科技',
    '制造',
    '金融',
    '教育',
    '医疗',
    '零售',
    '物流',
    '建筑',
    '咨询',
    '媒体'
  ];
  const positions = [
    'CEO',
    'CTO',
    '总经理',
    '副总经理',
    '部门经理',
    '项目经理',
    '业务经理',
    '技术总监'
  ];
  const levels = ['A级', 'B级', 'C级', 'D级'];
  const salespeople = [
    '张经理',
    '李经理',
    '王经理',
    '刘经理',
    '陈经理',
    '赵经理'
  ];

  for (let i = 1; i <= 120; i++) {
    const cityIndex = Math.floor(Math.random() * cities.length);
    customerData.push([
      `CUS${String(i).padStart(4, '0')}`,
      `${industries[Math.floor(Math.random() * industries.length)]}科技有限公司${i}`,
      `客户${i}号`,
      positions[Math.floor(Math.random() * positions.length)],
      `1${Math.floor(Math.random() * 9) + 3}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `0${Math.floor(Math.random() * 9) + 10}-${Math.floor(Math.random() * 90000000) + 10000000}`,
      `customer${i}@company${i}.com`,
      `${cities[cityIndex]}市${String.fromCharCode(65 + Math.floor(Math.random() * 26))}区第${i}号大厦`,
      `${Math.floor(Math.random() * 900000) + 100000}`,
      cities[cityIndex],
      provinces[cityIndex],
      industries[Math.floor(Math.random() * industries.length)],
      `${Math.floor(Math.random() * 1000) + 100}人`,
      `${Math.floor(Math.random() * 50000) + 1000}万元`,
      `2023-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      levels[Math.floor(Math.random() * levels.length)],
      salespeople[Math.floor(Math.random() * salespeople.length)],
      i % 5 === 0 ? `重要客户，需特别关注` : `正常跟进客户`
    ]);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(customerData);
  XLSX.utils.book_append_sheet(wb1, ws1, '客户信息');

  // 添加第二个Sheet - 客户订单 - 12列 x 80行
  const orderHeaders = [
    '订单号',
    '客户ID',
    '产品名称',
    '产品型号',
    '数量',
    '单价',
    '总金额',
    '订单日期',
    '交货日期',
    '订单状态',
    '支付方式',
    '物流信息'
  ];

  const orderData = [orderHeaders];
  const products = [
    '服务器',
    '路由器',
    '交换机',
    '防火墙',
    '存储设备',
    '监控设备',
    '网络设备'
  ];
  const orderStatuses = ['待确认', '生产中', '已发货', '已完成', '已取消'];
  const payments = ['现金', '转账', '支票', '信用证', '分期付款'];

  for (let i = 1; i <= 80; i++) {
    const customerId = `CUS${String(Math.floor(Math.random() * 120) + 1).padStart(4, '0')}`;
    const product = products[Math.floor(Math.random() * products.length)];
    const quantity = Math.floor(Math.random() * 100) + 1;
    const price = Math.floor(Math.random() * 10000) + 500;

    orderData.push([
      `ORD${String(i).padStart(6, '0')}`,
      customerId,
      product,
      `${product}-${String.fromCharCode(65 + Math.floor(Math.random() * 26))}${Math.floor(Math.random() * 1000) + 100}`,
      quantity,
      `¥${price}`,
      `¥${quantity * price}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
      payments[Math.floor(Math.random() * payments.length)],
      `物流单号: SF${Math.floor(Math.random() * 9000000000) + 1000000000}`
    ]);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(orderData);
  XLSX.utils.book_append_sheet(wb1, ws2, '客户订单');

  XLSX.writeFile(wb1, '/tmp/test-contacts/大客户数据库.xlsx');

  // 2. 员工详细信息表 - 16列 x 200行
  const wb2 = XLSX.utils.book_new();

  const employeeHeaders = [
    '员工编号',
    '姓名',
    '性别',
    '出生日期',
    '身份证号',
    '手机号码',
    '邮箱地址',
    '家庭地址',
    '紧急联系人',
    '紧急联系电话',
    '部门',
    '职位',
    '入职日期',
    '基本工资',
    '绩效工资',
    '员工状态',
    '直属领导',
    '工作经验'
  ];

  const employeeData = [employeeHeaders];

  const departments = [
    '技术部',
    '销售部',
    '市场部',
    '人事部',
    '财务部',
    '运营部',
    '客服部',
    '研发部',
    '质量部',
    '采购部'
  ];
  const techPositions = [
    '软件工程师',
    '高级工程师',
    '架构师',
    '技术经理',
    '技术总监'
  ];
  const salesPositions = ['销售专员', '销售经理', '区域经理', '销售总监'];
  const otherPositions = ['专员', '主管', '经理', '总监'];
  const surnames = [
    '王',
    '李',
    '张',
    '刘',
    '陈',
    '杨',
    '黄',
    '赵',
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
    '伟',
    '芳',
    '娜',
    '敏',
    '静',
    '丽',
    '强',
    '磊',
    '军',
    '洋',
    '勇',
    '艳',
    '杰',
    '涛',
    '明',
    '超',
    '秀英',
    '霞',
    '平',
    '刚'
  ];
  const employeeStatuses = ['在职', '试用期', '离职', '休假'];

  for (let i = 1; i <= 200; i++) {
    const surname = surnames[Math.floor(Math.random() * surnames.length)];
    const name = names[Math.floor(Math.random() * names.length)];
    const gender = Math.random() > 0.5 ? '男' : '女';
    const dept = departments[Math.floor(Math.random() * departments.length)];
    let position;

    if (dept === '技术部' || dept === '研发部') {
      position =
        techPositions[Math.floor(Math.random() * techPositions.length)];
    } else if (dept === '销售部') {
      position =
        salesPositions[Math.floor(Math.random() * salesPositions.length)];
    } else {
      position =
        otherPositions[Math.floor(Math.random() * otherPositions.length)];
    }

    const birthYear = 1980 + Math.floor(Math.random() * 25);
    const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(
      2,
      '0'
    );
    const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(
      2,
      '0'
    );

    employeeData.push([
      `EMP${String(i).padStart(4, '0')}`,
      `${surname}${name}`,
      gender,
      `${birthYear}-${birthMonth}-${birthDay}`,
      `${Math.floor(Math.random() * 900000) + 100000}${birthYear}${birthMonth}${birthDay}${Math.floor(Math.random() * 9000) + 1000}`,
      `1${Math.floor(Math.random() * 9) + 3}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      `${surname.toLowerCase()}${name.toLowerCase()}${i}@company.com`,
      `${cities[Math.floor(Math.random() * cities.length)]}市第${i}街道${Math.floor(Math.random() * 100) + 1}号`,
      `紧急联系人${i}`,
      `1${Math.floor(Math.random() * 9) + 3}${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`,
      dept,
      position,
      `202${Math.floor(Math.random() * 4) + 0}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      `¥${Math.floor(Math.random() * 20000) + 5000}`,
      `¥${Math.floor(Math.random() * 10000) + 1000}`,
      employeeStatuses[Math.floor(Math.random() * employeeStatuses.length)],
      `${surnames[Math.floor(Math.random() * surnames.length)]}${names[Math.floor(Math.random() * names.length)]}`,
      `${Math.floor(Math.random() * 15) + 1}年`
    ]);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(employeeData);
  XLSX.utils.book_append_sheet(wb2, ws3, '员工档案');

  // 添加员工培训记录 - 10列 x 150行
  const trainingHeaders = [
    '培训编号',
    '员工编号',
    '培训课程',
    '培训类型',
    '培训时长',
    '培训日期',
    '培训地点',
    '培训讲师',
    '培训成绩',
    '证书编号'
  ];

  const trainingData = [trainingHeaders];
  const courses = [
    '技术培训',
    'JAVA开发',
    'Python编程',
    '项目管理',
    '团队协作',
    '沟通技巧',
    '领导力',
    '销售技巧',
    '产品知识',
    '安全培训'
  ];
  const types = ['内训', '外训', '在线培训', '认证培训'];
  const locations = ['会议室A', '会议室B', '培训中心', '在线', '外部机构'];
  const instructors = ['张老师', '李老师', '王老师', '刘老师', '陈老师'];

  for (let i = 1; i <= 150; i++) {
    const empId = `EMP${String(Math.floor(Math.random() * 200) + 1).padStart(4, '0')}`;
    const score = Math.floor(Math.random() * 30) + 70;

    trainingData.push([
      `TR${String(i).padStart(4, '0')}`,
      empId,
      courses[Math.floor(Math.random() * courses.length)],
      types[Math.floor(Math.random() * types.length)],
      `${Math.floor(Math.random() * 32) + 8}小时`,
      `2024-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 28) + 1).padStart(2, '0')}`,
      locations[Math.floor(Math.random() * locations.length)],
      instructors[Math.floor(Math.random() * instructors.length)],
      `${score}分`,
      score >= 80 ? `CERT${String(i).padStart(6, '0')}` : '未获得'
    ]);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(trainingData);
  XLSX.utils.book_append_sheet(wb2, ws4, '培训记录');

  XLSX.writeFile(wb2, '/tmp/test-contacts/员工管理系统.xlsx');

  // 3. 供应商信息表 - 14列 x 60行
  const wb3 = XLSX.utils.book_new();

  const supplierHeaders = [
    '供应商编号',
    '公司名称',
    '联系人',
    '联系电话',
    '传真号码',
    '邮箱地址',
    '公司地址',
    '主营业务',
    '合作年限',
    '信用等级',
    '付款周期',
    '质量评级',
    '服务评级',
    '综合评分'
  ];

  const supplierData = [supplierHeaders];
  const businesses = [
    '电子元件',
    '机械配件',
    '原材料',
    '包装材料',
    '办公用品',
    '设备维修',
    '物流服务',
    'IT服务'
  ];
  const creditLevels = ['AAA', 'AA', 'A', 'BBB', 'BB', 'B'];
  const ratings = ['优秀', '良好', '一般', '较差'];

  for (let i = 1; i <= 60; i++) {
    const business = businesses[Math.floor(Math.random() * businesses.length)];
    const qualityRating = ratings[Math.floor(Math.random() * ratings.length)];
    const serviceRating = ratings[Math.floor(Math.random() * ratings.length)];
    const score = Math.floor(Math.random() * 30) + 70;

    supplierData.push([
      `SUP${String(i).padStart(4, '0')}`,
      `${business}供应商${i}号`,
      `供应商联系人${i}`,
      `0${Math.floor(Math.random() * 9) + 10}-${Math.floor(Math.random() * 90000000) + 10000000}`,
      `0${Math.floor(Math.random() * 9) + 10}-${Math.floor(Math.random() * 90000000) + 10000000}`,
      `supplier${i}@supply${i}.com`,
      `${cities[Math.floor(Math.random() * cities.length)]}市工业区第${i}号`,
      business,
      `${Math.floor(Math.random() * 10) + 1}年`,
      creditLevels[Math.floor(Math.random() * creditLevels.length)],
      `${Math.floor(Math.random() * 60) + 15}天`,
      qualityRating,
      serviceRating,
      `${score}分`
    ]);
  }

  const ws5 = XLSX.utils.aoa_to_sheet(supplierData);
  XLSX.utils.book_append_sheet(wb3, ws5, '供应商信息');

  XLSX.writeFile(wb3, '/tmp/test-contacts/供应商管理.xlsx');

  console.log('✅ 大量测试数据生成完成！');
  console.log('📊 数据统计:');
  console.log('   📁 大客户数据库.xlsx:');
  console.log('     - 客户信息: 18列 x 120行');
  console.log('     - 客户订单: 12列 x 80行');
  console.log('   📁 员工管理系统.xlsx:');
  console.log('     - 员工档案: 18列 x 200行');
  console.log('     - 培训记录: 10列 x 150行');
  console.log('   📁 供应商管理.xlsx:');
  console.log('     - 供应商信息: 14列 x 60行');
  console.log('');
  console.log('🎯 测试场景:');
  console.log('   ✓ 超过10列的宽表格显示');
  console.log('   ✓ 超过50行的分页功能');
  console.log('   ✓ 横向滚动条测试');
  console.log('   ✓ 大数据量性能测试');
}

generateLargeTestData();
