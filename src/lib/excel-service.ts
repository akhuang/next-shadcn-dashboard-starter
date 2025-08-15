import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';

export interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

export interface ExcelData {
  contacts: Contact[];
  lastUpdated: Date;
  files: string[];
}

class ExcelService {
  private folderPath: string = '';
  private contacts: Contact[] = [];
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
      this.notifyListeners();
      return;
    }

    const files = this.getAllExcelFiles(this.folderPath);
    const allContacts: Contact[] = [];

    for (const file of files) {
      try {
        const fileContacts = await this.parseExcelFile(file);
        allContacts.push(...fileContacts);
      } catch (error) {
        console.error(`Error parsing file ${file}:`, error);
      }
    }

    this.contacts = allContacts;
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

  private async parseExcelFile(filePath: string): Promise<Contact[]> {
    const contacts: Contact[] = [];

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

          contacts.push({
            id: `${fileName}-${sheetName}-${i}`,
            fileName,
            sheetName,
            rowData,
            searchableText
          });
        }
      }
    } catch (error) {
      console.error(`Error parsing Excel file ${filePath}:`, error);
      throw error;
    }

    return contacts;
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
      files: files.map((f) => path.basename(f))
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
