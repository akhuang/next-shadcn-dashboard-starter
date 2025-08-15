import { describe, it, expect } from 'vitest';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

interface FileData {
  fileName: string;
  displayName: string;
  sheets: Array<{
    name: string;
    contacts: Contact[];
    columns: string[];
  }>;
  icon: any;
  color: string;
  bgColor: string;
  totalContacts: number;
}

// 被测试的数据处理函数
function buildFileDataStructure(contacts: Contact[]): FileData[] {
  const filesMap = new Map<string, FileData>();

  contacts.forEach((contact) => {
    if (!filesMap.has(contact.fileName)) {
      filesMap.set(contact.fileName, {
        fileName: contact.fileName,
        displayName: contact.fileName.replace(/\.(xlsx|xls|xlsm)$/i, ''),
        sheets: [],
        icon: null,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        totalContacts: 0
      });
    }

    const fileData = filesMap.get(contact.fileName)!;
    let sheet = fileData.sheets.find((s) => s.name === contact.sheetName);

    if (!sheet) {
      sheet = {
        name: contact.sheetName,
        contacts: [],
        columns: []
      };
      fileData.sheets.push(sheet);
    }

    sheet.contacts.push(contact);
    fileData.totalContacts++;
  });

  // 计算每个Sheet的列
  filesMap.forEach((fileData) => {
    fileData.sheets.forEach((sheet) => {
      const columnsSet = new Set<string>();
      sheet.contacts.forEach((contact) => {
        Object.keys(contact.rowData).forEach((key) => columnsSet.add(key));
      });
      sheet.columns = Array.from(columnsSet);
    });
  });

  return Array.from(filesMap.values());
}

describe('Contact Data Processing', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      fileName: 'customers.xlsx',
      sheetName: '客户信息',
      rowData: {
        公司名称: 'ABC公司',
        联系人: '张三',
        电话: '021-12345678'
      },
      searchableText: 'ABC公司 张三 021-12345678'
    },
    {
      id: '2',
      fileName: 'customers.xlsx',
      sheetName: '客户信息',
      rowData: {
        公司名称: 'XYZ公司',
        联系人: '李四',
        电话: '021-87654321',
        邮箱: 'lisi@xyz.com' // 额外的列
      },
      searchableText: 'XYZ公司 李四 021-87654321 lisi@xyz.com'
    },
    {
      id: '3',
      fileName: 'customers.xlsx',
      sheetName: '客户订单', // 不同的sheet
      rowData: {
        订单号: 'ORD001',
        客户: 'ABC公司',
        金额: '10000'
      },
      searchableText: 'ORD001 ABC公司 10000'
    }
  ];

  it('should build file data structure correctly', () => {
    const result = buildFileDataStructure(mockContacts);

    expect(result).toHaveLength(1);
    expect(result[0].fileName).toBe('customers.xlsx');
    expect(result[0].displayName).toBe('customers');
    expect(result[0].totalContacts).toBe(3);
  });

  it('should group contacts by sheet correctly', () => {
    const result = buildFileDataStructure(mockContacts);
    const fileData = result[0];

    expect(fileData.sheets).toHaveLength(2);

    const customerSheet = fileData.sheets.find((s) => s.name === '客户信息');
    const orderSheet = fileData.sheets.find((s) => s.name === '客户订单');

    expect(customerSheet?.contacts).toHaveLength(2);
    expect(orderSheet?.contacts).toHaveLength(1);
  });

  it('should extract all columns correctly', () => {
    const result = buildFileDataStructure(mockContacts);
    const fileData = result[0];

    const customerSheet = fileData.sheets.find((s) => s.name === '客户信息');
    expect(customerSheet?.columns).toContain('公司名称');
    expect(customerSheet?.columns).toContain('联系人');
    expect(customerSheet?.columns).toContain('电话');
    expect(customerSheet?.columns).toContain('邮箱'); // 来自第二个联系人的额外列
    expect(customerSheet?.columns).toHaveLength(4);

    const orderSheet = fileData.sheets.find((s) => s.name === '客户订单');
    expect(orderSheet?.columns).toContain('订单号');
    expect(orderSheet?.columns).toContain('客户');
    expect(orderSheet?.columns).toContain('金额');
    expect(orderSheet?.columns).toHaveLength(3);
  });

  it('should handle empty data gracefully', () => {
    const result = buildFileDataStructure([]);
    expect(result).toHaveLength(0);
  });

  it('should handle single contact correctly', () => {
    const singleContact = [mockContacts[0]];
    const result = buildFileDataStructure(singleContact);

    expect(result).toHaveLength(1);
    expect(result[0].sheets).toHaveLength(1);
    expect(result[0].sheets[0].contacts).toHaveLength(1);
    expect(result[0].totalContacts).toBe(1);
  });
});
