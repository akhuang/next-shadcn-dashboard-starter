import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import { Contact, ExcelData, SheetInfo, MergeRange } from '@/types/excel';

class ExcelService {
  private folderPath: string = '';
  private contacts: Contact[] = [];
  private sheetInfoMap: Record<string, Record<string, SheetInfo>> = {};
  private watcher: any = null;
  private listeners: Set<(data: ExcelData) => void> = new Set();

  setFolderPath(folderPath: string) {
    this.folderPath = folderPath;
    this.startWatching();
    this.loadAllExcelFiles();
  }

  private startWatching() {
    if (this.watcher) {
      this.watcher.close();
    }

    if (!this.folderPath || !fs.existsSync(this.folderPath)) {
      return;
    }

    this.watcher = chokidar.watch(
      path.join(this.folderPath, '**/*.{xlsx,xls,xlsm}'),
      {
        persistent: true,
        ignoreInitial: true
      }
    );

    this.watcher
      .on('add', (filePath: string) => {
        console.log(`File added: ${filePath}`);
        this.loadAllExcelFiles();
      })
      .on('change', (filePath: string) => {
        console.log(`File changed: ${filePath}`);
        this.loadAllExcelFiles();
      })
      .on('unlink', (filePath: string) => {
        console.log(`File removed: ${filePath}`);
        this.loadAllExcelFiles();
      });
  }

  private async loadAllExcelFiles() {
    if (!this.folderPath || !fs.existsSync(this.folderPath)) {
      this.contacts = [];
      this.sheetInfoMap = {};
      this.notifyListeners();
      return;
    }

    const files = this.getAllExcelFiles(this.folderPath);
    const allContacts: Contact[] = [];
    const newSheetInfoMap: Record<string, Record<string, SheetInfo>> = {};

    for (const file of files) {
      try {
        const result = await this.parseExcelFile(file);
        allContacts.push(...result.contacts);
        if (result.sheetInfo) {
          const fileName = path.basename(file);
          newSheetInfoMap[fileName] = result.sheetInfo;
        }
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
      }
    }

    this.contacts = allContacts;
    this.sheetInfoMap = newSheetInfoMap;
    this.notifyListeners();
  }

  private getAllExcelFiles(dir: string): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
      try {
        const items = fs.readdirSync(currentDir);
        for (const item of items) {
          const fullPath = path.join(currentDir, item);
          const stat = fs.statSync(fullPath);

          if (stat.isDirectory()) {
            walk(fullPath);
          } else if (stat.isFile() && /\.(xlsx|xls|xlsm)$/i.test(item)) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        console.error(`Error reading directory ${currentDir}:`, error);
      }
    }

    walk(dir);
    return files;
  }

  private async parseExcelFile(
    filePath: string
  ): Promise<{ contacts: Contact[]; sheetInfo: Record<string, SheetInfo> }> {
    const contacts: Contact[] = [];
    const sheetInfo: Record<string, SheetInfo> = {};

    try {
      const fileBuffer = fs.readFileSync(filePath);
      const workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        cellStyles: true,
        cellNF: true,
        cellDates: true
      });

      const fileName = path.basename(filePath);

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];

        // 获取范围，包括合并单元格
        const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
        const merges = worksheet['!merges'] || [];

        // 转换合并单元格信息为我们的格式
        const mergeRanges: MergeRange[] = merges.map((merge: any) => ({
          startRow: merge.s.r,
          endRow: merge.e.r,
          startCol: merge.s.c,
          endCol: merge.e.c
        }));

        // 将工作表转换为JSON，保留空单元格
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
          header: 1,
          defval: '',
          blankrows: false,
          raw: false
        });

        // 处理合并单元格
        const processedData = this.processMergedCells(
          jsonData as any[][],
          merges
        );

        // 假设第一行是标题
        const headers = processedData[0] || [];
        const sheetContacts: Contact[] = [];

        // 从第二行开始处理数据
        for (let i = 1; i < processedData.length; i++) {
          const row = processedData[i];
          if (!row || row.every((cell: any) => !cell)) continue;

          const rowData: Record<string, any> = {};
          headers.forEach((header: any, index: number) => {
            if (header) {
              rowData[String(header)] = row[index] || '';
            }
          });

          // 创建可搜索文本
          const searchableText = Object.values(rowData)
            .map((v) => String(v || ''))
            .join(' ')
            .toLowerCase();

          const contact: Contact = {
            id: `${fileName}-${sheetName}-${i}`,
            fileName,
            sheetName,
            rowData,
            searchableText,
            rowIndex: i - 1 // 数据行的索引（不包括标题行）
          };
          contacts.push(contact);
          sheetContacts.push(contact);
        }

        // 保存sheet信息
        // 注意：我们传递的是相对于数据行的索引（不包括标题行）
        // 因为contacts数组不包含标题行，索引需要减1
        const adjustedMergeRanges = mergeRanges
          .filter((range) => range.endRow > 0) // 只保留涉及数据行的合并
          .map((range) => ({
            // 调整为数据行的索引（减去标题行）
            startRow: range.startRow - 1,
            endRow: range.endRow - 1,
            startCol: range.startCol,
            endCol: range.endCol
          }))
          .filter((range) => range.startRow >= 0); // 过滤掉完全在标题行的合并

        sheetInfo[sheetName] = {
          name: sheetName,
          contacts: sheetContacts,
          columns: headers.filter((h) => h).map(String),
          mergeRanges: adjustedMergeRanges
        };
      }
    } catch (error) {
      console.error(`Error parsing Excel file ${filePath}:`, error);
      throw error;
    }

    return { contacts, sheetInfo };
  }

  private processMergedCells(data: any[][], merges: any[]): any[][] {
    const result = data.map((row) => [...row]);

    merges.forEach((merge) => {
      const startRow = merge.s.r;
      const endRow = merge.e.r;
      const startCol = merge.s.c;
      const endCol = merge.e.c;

      const value = result[startRow]?.[startCol];

      for (let r = startRow; r <= endRow && r < result.length; r++) {
        for (
          let c = startCol;
          c <= endCol && c < (result[r]?.length || 0);
          c++
        ) {
          if (r === startRow && c === startCol) continue;
          if (result[r]) {
            result[r][c] = value;
          }
        }
      }
    });

    return result;
  }

  searchContacts(query: string): Contact[] {
    if (!query) return this.contacts;

    const searchTerm = query.toLowerCase();
    return this.contacts.filter((contact) =>
      contact.searchableText.includes(searchTerm)
    );
  }

  getAllContacts(): Contact[] {
    return this.contacts;
  }

  getExcelData(): ExcelData {
    const files = this.folderPath ? this.getAllExcelFiles(this.folderPath) : [];
    return {
      contacts: this.contacts,
      lastUpdated: new Date(),
      files: files.map((f) => path.basename(f)),
      sheetInfoMap: this.sheetInfoMap
    };
  }

  addListener(callback: (data: ExcelData) => void) {
    this.listeners.add(callback);
  }

  removeListener(callback: (data: ExcelData) => void) {
    this.listeners.delete(callback);
  }

  private notifyListeners() {
    const data = this.getExcelData();
    this.listeners.forEach((callback) => callback(data));
  }

  destroy() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    this.listeners.clear();
  }
}

export const excelService = new ExcelService();
