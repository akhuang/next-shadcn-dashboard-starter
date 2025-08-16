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
  private reloadTimer: NodeJS.Timeout | null = null;

  constructor() {
    try {
      const envPath = process.env.EXCEL_WATCH_DIR;
      if (envPath && fs.existsSync(envPath)) {
        this.folderPath = envPath;
        this.startWatching();
        this.loadAllExcelFiles();
      }
    } catch {
      // ignore env init errors
    }
  }

  private scheduleReload() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      this.loadAllExcelFiles();
    }, 300);
  }

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

    const usePolling = process.env.EXCEL_WATCH_POLLING === 'true';
    const pollInterval = process.env.EXCEL_WATCH_INTERVAL
      ? Number(process.env.EXCEL_WATCH_INTERVAL)
      : undefined;

    this.watcher = chokidar.watch(
      path.join(this.folderPath, '**/*.{xlsx,xls,xlsm}'),
      {
        persistent: true,
        ignoreInitial: true,
        ignored: (watchedPath: string) => {
          const base = path.basename(watchedPath);
          // 忽略 Excel 临时文件和隐藏前缀文件
          return base.startsWith('~$') || base.startsWith('._');
        },
        awaitWriteFinish: { stabilityThreshold: 500, pollInterval: 100 },
        usePolling,
        interval: pollInterval
      }
    );

    this.watcher
      .on('add', () => this.scheduleReload())
      .on('change', () => this.scheduleReload())
      .on('unlink', () => this.scheduleReload());
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
        // swallow parse errors to keep stream alive
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
            // 跳过 Excel 临时文件与隐藏前缀文件，如 "~$文件.xlsx"、"._文件.xlsx"
            const base = path.basename(item);
            if (base.startsWith('~$') || base.startsWith('._')) continue;
            files.push(fullPath);
          }
        }
      } catch (error) {
        // ignore directory read errors
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

        // 检测第一行是否存在横向合并的大标题
        let sheetTitle: string | undefined = undefined;
        const firstRowMerges = (merges || []).filter(
          (m: any) => m.s.r === 0 && m.e.r === 0 && m.e.c > m.s.c
        );
        if (firstRowMerges.length > 0) {
          const m = firstRowMerges[0];
          const v = (
            worksheet[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })] || {}
          ).v;
          if (v && String(v).trim() !== '') {
            sheetTitle = String(v);
          }
        }

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
          blankrows: true,
          raw: false
        });

        // 处理合并单元格
        const processedDataAll = this.processMergedCells(
          jsonData as any[][],
          merges
        );
        // 保留第一行作为数据（包括横向合并的大标题），不再剔除
        const processedData = processedDataAll as any[][];

        // 表头处理：若首行有大范围合并或有效表头过少，则回退为列字母
        const rawHeaders = (processedData[0] || []) as any[];
        const totalColsByRange = range.e.c - range.s.c + 1;
        const maxColsByRows = processedData.reduce(
          (m, r) => Math.max(m, r?.length || 0),
          0
        );
        const totalCols = Math.max(totalColsByRange, maxColsByRows);
        const nonEmptyHeaderCount = rawHeaders.filter(
          (h) => String(h ?? '').trim() !== ''
        ).length;
        // 首行存在任何横向/纵向合并都视为“非标准表头”，回退到列字母
        const headerRowHasMerge = (merges || []).some(
          (m: any) => m.s.r === 0 || m.e.r === 0
        );
        const colLetters = Array.from({ length: totalCols }, (_, i) =>
          XLSX.utils.encode_col(range.s.c + i)
        );
        const useLettersAsHeaders =
          headerRowHasMerge || nonEmptyHeaderCount <= 1;
        const headers = useLettersAsHeaders
          ? colLetters
          : rawHeaders.map((h, i) =>
              String(h ?? '').trim() !== '' ? String(h) : colLetters[i]
            );
        const sheetContacts: Contact[] = [];

        // 确定数据起始行：若使用列字母作为表头，则首行即为数据；否则首行作为表头，从第二行开始
        const dataStartIndex = useLettersAsHeaders ? 0 : 1;
        for (let i = dataStartIndex; i < processedData.length; i++) {
          const row = processedData[i] || [];
          const rowData: Record<string, any> = {};
          headers.forEach((header: any, index: number) => {
            rowData[String(header)] =
              (row && row[index] !== undefined ? row[index] : '') || '';
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
            rowIndex: i - dataStartIndex // 数据行索引（不包括表头）
          };
          contacts.push(contact);
          sheetContacts.push(contact);
        }

        // 保存sheet信息
        // 注意：我们传递的是相对于数据行的索引（不包括标题行）
        // 需要减去：表头行（若未使用列字母）。由于不再剔除第一行标题，removedTopRows=0
        const headerConsumedRows = useLettersAsHeaders ? 0 : 1;
        const subtractRows = headerConsumedRows;

        const adjustedMergeRanges = mergeRanges
          .filter((range) => range.endRow >= subtractRows) // 只保留涉及数据行的合并
          .map((range) => ({
            // 调整为数据行的索引
            startRow: range.startRow - subtractRows,
            endRow: range.endRow - subtractRows,
            startCol: range.startCol,
            endCol: range.endCol
          }))
          .filter((range) => range.startRow >= 0); // 过滤掉被剔除行中的合并

        sheetInfo[sheetName] = {
          name: sheetName,
          contacts: sheetContacts,
          columns: headers.map(String),
          mergeRanges: adjustedMergeRanges,
          title: sheetTitle
        };
      }
    } catch (error) {
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
