import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { excelService } from '../excel-service';

describe('ExcelService - 合并单元格读取', () => {
  const testDir = '/tmp/test-excel-merge';
  const testFile = path.join(testDir, 'test-merge.xlsx');

  beforeAll(() => {
    // 创建测试目录
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    // 创建测试Excel文件
    const wb = XLSX.utils.book_new();

    // 创建带有合并单元格的工作表
    const ws = XLSX.utils.aoa_to_sheet([
      ['标题', '列1', '列2', '列3'], // 第0行 - 标题行
      ['A1', 'B1', 'C1', 'D1'], // 第1行 - 数据行1
      ['A2', 'B2', 'C2', 'D2'], // 第2行 - 数据行2
      ['A3', 'B3', 'C3', 'D3'], // 第3行 - 数据行3
      ['A4', 'B4', 'C4', 'D4'] // 第4行 - 数据行4
    ]);

    // 设置合并单元格
    ws['!merges'] = [
      // 数据区域的合并（跳过标题行）
      { s: { r: 1, c: 0 }, e: { r: 2, c: 0 } }, // A1-A2 合并
      { s: { r: 1, c: 1 }, e: { r: 1, c: 2 } }, // B1-C1 合并
      { s: { r: 3, c: 2 }, e: { r: 4, c: 3 } } // C3-D4 合并
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, testFile);
  });

  afterAll(() => {
    // 清理测试文件
    if (fs.existsSync(testFile)) {
      fs.unlinkSync(testFile);
    }
    if (fs.existsSync(testDir)) {
      fs.rmdirSync(testDir);
    }
  });

  it('应该正确读取Excel文件的合并单元格信息', async () => {
    // 设置文件夹路径
    excelService.setFolderPath(testDir);

    // 等待文件加载
    await new Promise((resolve) => setTimeout(resolve, 100));

    // 获取数据
    const data = excelService.getExcelData();

    expect(data).toBeDefined();
    expect(data.sheetInfoMap).toBeDefined();

    const fileName = 'test-merge.xlsx';
    expect(data.sheetInfoMap![fileName]).toBeDefined();
    expect(data.sheetInfoMap![fileName]['Sheet1']).toBeDefined();

    const sheetInfo = data.sheetInfoMap![fileName]['Sheet1'];
    expect(sheetInfo.mergeRanges).toBeDefined();
    expect(sheetInfo.mergeRanges.length).toBeGreaterThan(0);

    console.log('Sheet合并信息:', sheetInfo.mergeRanges);

    // 验证合并范围（调整后的索引，减去标题行）
    const merges = sheetInfo.mergeRanges;

    // A1-A2 合并（原始r:1-2，调整后应该是0-1）
    const merge1 = merges.find(
      (m) =>
        m.startRow === 0 && m.endRow === 1 && m.startCol === 0 && m.endCol === 0
    );
    expect(merge1).toBeDefined();

    // B1-C1 合并（原始r:1，c:1-2，调整后应该是row:0，col:1-2）
    const merge2 = merges.find(
      (m) =>
        m.startRow === 0 && m.endRow === 0 && m.startCol === 1 && m.endCol === 2
    );
    expect(merge2).toBeDefined();

    // C3-D4 合并（原始r:3-4，c:2-3，调整后应该是row:2-3，col:2-3）
    const merge3 = merges.find(
      (m) =>
        m.startRow === 2 && m.endRow === 3 && m.startCol === 2 && m.endCol === 3
    );
    expect(merge3).toBeDefined();
  });

  it('应该正确处理数据行索引', async () => {
    const data = excelService.getExcelData();

    // 验证contacts数组不包含标题行
    expect(data.contacts.length).toBe(4); // 只有4行数据，不包括标题

    // 验证第一个contact的数据
    const firstContact = data.contacts[0];
    expect(firstContact.rowData['标题']).toBe('A1');
    expect(firstContact.rowData['列1']).toBe('B1');
    expect(firstContact.rowIndex).toBe(0); // 第一行数据的索引应该是0
  });
});
