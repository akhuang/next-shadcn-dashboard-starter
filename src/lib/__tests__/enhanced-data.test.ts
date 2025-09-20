import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis for isolated testing - define before import
vi.mock('@/lib/redis', () => ({
  default: {
    get: vi.fn(),
    set: vi.fn(),
    ping: vi.fn()
  },
  REDIS_KEYS: {
    FILES: 'excel:files',
    FILE_SHEETS: (fileName: string) => `excel:file:${fileName}:sheets`,
    SHEET_INFO: (fileName: string, sheetName: string) =>
      `excel:sheet:${fileName}:${sheetName}:info`,
    SHEET_DATA: (fileName: string, sheetName: string, page: number) =>
      `excel:sheet:${fileName}:${sheetName}:data:${page}`,
    SHEET_TOTAL: (fileName: string, sheetName: string) =>
      `excel:sheet:${fileName}:${sheetName}:total`,
    LAST_UPDATE: 'excel:last_update'
  }
}));

import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';
import redis from '@/lib/redis';

const mockRedis = vi.mocked(redis);

describe('Enhanced Data Structure Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRedis.ping.mockResolvedValue('PONG');
  });

  describe('Employee Data (员工信息) Enhanced Structure', () => {
    const mockEmployeeData = [
      {
        id: 'contacts.xlsx_员工信息_row1',
        fileName: 'contacts.xlsx',
        sheetName: '员工信息',
        rowData: {
          员工ID: 'EMP0001',
          姓名: '张明',
          部门: '技术部',
          职位: '前端工程师',
          直属上级: '李总监',
          手机: '13900139001',
          分机: '8001',
          邮箱: 'zhangming@company.com',
          入职日期: '2023-01-15',
          合同类型: '正式员工',
          薪资等级: 'P5',
          工作地点: '北京总部',
          紧急联系人: '张父',
          紧急联系电话: '13800138001',
          状态: '在职',
          备注: '技术部前端工程师，负责相关业务工作'
        },
        searchableText:
          'emp0001 张明 技术部 前端工程师 李总监 13900139001 8001 zhangming@company.com 2023-01-15 正式员工 p5 北京总部 张父 13800138001 在职 技术部前端工程师，负责相关业务工作'
      }
    ];

    it('should verify employee data has 16 columns', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockEmployeeData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'contacts.xlsx',
        '员工信息',
        1,
        1
      );

      expect(result.data).toHaveLength(1);

      const employee = result.data[0];
      const expectedColumns = [
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
      ];

      expectedColumns.forEach((column) => {
        expect(employee.rowData).toHaveProperty(column);
      });

      expect(Object.keys(employee.rowData)).toHaveLength(16);
    });

    it('should validate employee data structure and content', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockEmployeeData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'contacts.xlsx',
        '员工信息',
        1,
        1
      );
      const employee = result.data[0];

      // Verify core employee data
      expect(employee.rowData['员工ID']).toBe('EMP0001');
      expect(employee.rowData['姓名']).toBe('张明');
      expect(employee.rowData['部门']).toBe('技术部');
      expect(employee.rowData['职位']).toBe('前端工程师');
      expect(employee.rowData['合同类型']).toBe('正式员工');
      expect(employee.rowData['薪资等级']).toBe('P5');
      expect(employee.rowData['工作地点']).toBe('北京总部');
      expect(employee.rowData['状态']).toBe('在职');

      // Verify contact information
      expect(employee.rowData['手机']).toMatch(/^1\d{10}$/);
      expect(employee.rowData['分机']).toBe('8001');
      expect(employee.rowData['邮箱']).toContain('@company.com');

      // Verify emergency contact
      expect(employee.rowData['紧急联系人']).toBe('张父');
      expect(employee.rowData['紧急联系电话']).toMatch(/^1\d{10}$/);
    });
  });

  describe('Customer Data (客户信息) Enhanced Structure', () => {
    const mockCustomerData = [
      {
        id: 'contacts.xlsx_客户信息_row1',
        fileName: 'contacts.xlsx',
        sheetName: '客户信息',
        rowData: {
          客户ID: 'CUS000001',
          公司名称: '阿里科技',
          联系人: '王经理',
          职位: 'CTO',
          手机: '13900139002',
          固话: '010-12345678',
          传真: '010-12345679',
          邮箱: 'wangjingli@alibaba.com',
          官网: 'https://www.alibaba.com',
          所在城市: '北京',
          详细地址: '北京市朝阳区某某路123号',
          行业: '互联网',
          客户等级: '钻石',
          年营业额: '10,000,000元',
          合作日期: '2020-03-15',
          负责销售: '张销售',
          客户经理: '李经理',
          合作状态: '活跃',
          信用等级: 'AAA',
          付款方式: '银行转账',
          备注: '互联网行业重要客户，阿里科技的核心联系人'
        },
        searchableText:
          'cus000001 阿里科技 王经理 cto 13900139002 010-12345678 010-12345679 wangjingli@alibaba.com https://www.alibaba.com 北京 北京市朝阳区某某路123号 互联网 钻石 10,000,000元 2020-03-15 张销售 李经理 活跃 aaa 银行转账 互联网行业重要客户，阿里科技的核心联系人'
      }
    ];

    it('should verify customer data has 21 columns', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockCustomerData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'contacts.xlsx',
        '客户信息',
        1,
        1
      );

      expect(result.data).toHaveLength(1);

      const customer = result.data[0];
      const expectedColumns = [
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
      ];

      expectedColumns.forEach((column) => {
        expect(customer.rowData).toHaveProperty(column);
      });

      expect(Object.keys(customer.rowData)).toHaveLength(21);
    });

    it('should validate customer business data structure', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockCustomerData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'contacts.xlsx',
        '客户信息',
        1,
        1
      );
      const customer = result.data[0];

      // Verify business identification
      expect(customer.rowData['客户ID']).toBe('CUS000001');
      expect(customer.rowData['公司名称']).toBe('阿里科技');
      expect(customer.rowData['行业']).toBe('互联网');

      // Verify contact details
      expect(customer.rowData['联系人']).toBe('王经理');
      expect(customer.rowData['职位']).toBe('CTO');
      expect(customer.rowData['手机']).toMatch(/^1\d{10}$/);
      expect(customer.rowData['邮箱']).toContain('@');

      // Verify business relationship
      expect(customer.rowData['客户等级']).toBe('钻石');
      expect(customer.rowData['合作状态']).toBe('活跃');
      expect(customer.rowData['信用等级']).toBe('AAA');
      expect(customer.rowData['年营业额']).toContain('元');
    });
  });

  describe('Navigation Data Enhanced Structure', () => {
    const mockNavigationData = [
      {
        id: 'navigation.xlsx_Navigation_row1',
        fileName: 'navigation.xlsx',
        sheetName: 'Navigation',
        rowData: {
          ID: 'NAV0001',
          类别: '开发工具',
          子类别: 'IDE编辑器',
          名称: 'VS Code',
          链接: 'https://vscode.com',
          图标: '🛠️',
          描述: 'VS Code是一个优秀的IDE编辑器工具，广泛用于开发工具开发',
          标签: '热门,推荐',
          评分: '4.8',
          使用频率: '每天',
          更新日期: '2024-08-15',
          语言: '多语言',
          价格: '免费',
          平台: '跨平台',
          状态: '活跃'
        },
        searchableText:
          'nav0001 开发工具 ide编辑器 vs code https://vscode.com 🛠️ vs code是一个优秀的ide编辑器工具，广泛用于开发工具开发 热门,推荐 4.8 每天 2024-08-15 多语言 免费 跨平台 活跃'
      }
    ];

    it('should verify navigation data has 15 columns', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockNavigationData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'navigation.xlsx',
        'Navigation',
        1,
        1,
        'navigation'
      );

      expect(result.data).toHaveLength(1);

      const navItem = result.data[0];
      const expectedColumns = [
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
      ];

      expectedColumns.forEach((column) => {
        expect(navItem.rowData).toHaveProperty(column);
      });

      expect(Object.keys(navItem.rowData)).toHaveLength(15);
    });

    it('should validate navigation metadata structure', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockNavigationData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'navigation.xlsx',
        'Navigation',
        1,
        1,
        'navigation'
      );
      const navItem = result.data[0];

      // Verify categorization
      expect(navItem.rowData['类别']).toBe('开发工具');
      expect(navItem.rowData['子类别']).toBe('IDE编辑器');
      expect(navItem.rowData['名称']).toBe('VS Code');

      // Verify metadata
      expect(navItem.rowData['评分']).toBe('4.8');
      expect(parseFloat(navItem.rowData['评分'])).toBeGreaterThan(0);
      expect(parseFloat(navItem.rowData['评分'])).toBeLessThanOrEqual(5);

      expect(navItem.rowData['使用频率']).toBe('每天');
      expect(navItem.rowData['价格']).toBe('免费');
      expect(navItem.rowData['平台']).toBe('跨平台');
      expect(navItem.rowData['状态']).toBe('活跃');

      // Verify tags
      expect(navItem.rowData['标签']).toContain('热门');
    });
  });

  describe('Reports Data Enhanced Structure', () => {
    const mockSalesData = [
      {
        id: 'business-report.xlsx_销售明细_row1',
        fileName: 'business-report.xlsx',
        sheetName: '销售明细',
        rowData: {
          订单ID: 'ORD000001',
          日期: '2024-08-15',
          销售员: '张三',
          销售员ID: 'S001',
          客户: '阿里巴巴',
          客户ID: 'C000001',
          产品名称: '云服务器',
          产品代码: 'P0001',
          数量: '10',
          单价: '5000.00',
          折扣: '5.0%',
          税率: '13.0%',
          税额: '6175.00',
          总金额: '53675.00',
          地区: '华东',
          城市: '杭州',
          销售渠道: '直销',
          订单状态: '已完成',
          支付方式: '银行转账',
          交付日期: '2024-08-20',
          备注: '云服务器销售订单，客户阿里巴巴'
        },
        searchableText:
          'ord000001 2024-08-15 张三 s001 阿里巴巴 c000001 云服务器 p0001 10 5000.00 5.0% 13.0% 6175.00 53675.00 华东 杭州 直销 已完成 银行转账 2024-08-20 云服务器销售订单，客户阿里巴巴'
      }
    ];

    it('should verify sales data has 21 columns', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSalesData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'business-report.xlsx',
        '销售明细',
        1,
        1,
        'reports_business1'
      );

      expect(result.data).toHaveLength(1);

      const salesRecord = result.data[0];
      const expectedColumns = [
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
      ];

      expectedColumns.forEach((column) => {
        expect(salesRecord.rowData).toHaveProperty(column);
      });

      expect(Object.keys(salesRecord.rowData)).toHaveLength(21);
    });

    it('should validate sales financial calculations', async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSalesData));
      mockRedis.get.mockResolvedValueOnce('1');

      const result = await excelAsyncCacheService.getPaginatedData(
        'business-report.xlsx',
        '销售明细',
        1,
        1,
        'reports_business1'
      );
      const sales = result.data[0];

      // Verify financial data integrity
      const quantity = parseFloat(sales.rowData['数量']);
      const unitPrice = parseFloat(sales.rowData['单价']);
      const discount = parseFloat(sales.rowData['折扣'].replace('%', '')) / 100;
      const taxRate = parseFloat(sales.rowData['税率'].replace('%', '')) / 100;
      const taxAmount = parseFloat(sales.rowData['税额']);
      const totalAmount = parseFloat(sales.rowData['总金额']);

      expect(quantity).toBeGreaterThan(0);
      expect(unitPrice).toBeGreaterThan(0);
      expect(discount).toBeGreaterThanOrEqual(0);
      expect(discount).toBeLessThanOrEqual(1);
      expect(taxRate).toBeGreaterThan(0);
      expect(taxAmount).toBeGreaterThan(0);
      expect(totalAmount).toBeGreaterThan(0);

      // Verify business logic
      const subtotal = quantity * unitPrice * (1 - discount);
      const expectedTaxAmount = subtotal * taxRate;
      const expectedTotal = subtotal + expectedTaxAmount;

      expect(taxAmount).toBeCloseTo(expectedTaxAmount, 2);
      expect(totalAmount).toBeCloseTo(expectedTotal, 2);
    });
  });

  describe('Data Search Functionality', () => {
    it('should handle enhanced searchable text with multiple columns', async () => {
      const mockSearchResults = [
        {
          id: 'contacts.xlsx_员工信息_row1',
          fileName: 'contacts.xlsx',
          sheetName: '员工信息',
          rowData: {
            员工ID: 'EMP0001',
            姓名: '张明',
            部门: '技术部',
            职位: '前端工程师'
          },
          searchableText: 'emp0001 张明 技术部 前端工程师 p5 北京总部 正式员工'
        }
      ];

      // Mock Redis calls for file list and search
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(['contacts.xlsx'])); // files
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(['员工信息'])); // sheets
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSearchResults)); // page 1 data
      mockRedis.get.mockResolvedValueOnce(null); // page 2 data (end)

      const result = await excelAsyncCacheService.searchContacts(
        '技术部',
        1,
        10
      );

      expect(result.data).toHaveLength(1);
      expect(result.data[0].rowData['部门']).toBe('技术部');
      expect(result.data[0].searchableText).toContain('技术部');
    });
  });

  describe('Data Volume and Performance', () => {
    it('should handle large datasets efficiently', async () => {
      const mockLargeDataset = Array.from({ length: 100 }, (_, i) => ({
        id: `large-test-data.xlsx_大数据测试_row${i + 1}`,
        fileName: 'large-test-data.xlsx',
        sheetName: '大数据测试',
        rowData: {
          ID: `EMP${(i + 1).toString().padStart(4, '0')}`,
          姓名: `员工${i + 1}`,
          部门: '技术部',
          职位: '工程师'
        },
        searchableText: `emp${(i + 1).toString().padStart(4, '0')} 员工${i + 1} 技术部 工程师`
      }));

      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockLargeDataset));
      mockRedis.get.mockResolvedValueOnce('1000');

      const result = await excelAsyncCacheService.getPaginatedData(
        'large-test-data.xlsx',
        '大数据测试',
        1,
        100
      );

      expect(result.data).toHaveLength(100);
      expect(result.total).toBe(1000);
      expect(result.hasMore).toBe(true);

      // Verify data structure consistency across large dataset
      result.data.forEach((item, index) => {
        expect(item.rowData['ID']).toBe(
          `EMP${(index + 1).toString().padStart(4, '0')}`
        );
        expect(item.rowData['姓名']).toBe(`员工${index + 1}`);
      });
    });
  });
});
