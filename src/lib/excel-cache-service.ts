import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import redis, { REDIS_KEYS, CACHE_TTL } from './redis';
import { Contact, MergeRange } from '@/types/excel';

interface CachedSheetInfo {
  name: string;
  columns: string[];
  mergeRanges: MergeRange[];
  title?: string;
  totalRows: number;
}

interface FileInfo {
  fileName: string;
  displayName: string;
  sheets: string[];
  lastModified: Date;
  size: number;
}

class ExcelCacheService {
  private folderPath: string = '';
  private watcher: any = null;
  private reloadTimer: NodeJS.Timeout | null = null;
  private pageSize: number = 100; // 每页100条数据

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

  private scheduleReload() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      this.loadAllExcelFiles();
    }, 300);
  }

  private async loadAllExcelFiles() {
    if (!this.folderPath || !fs.existsSync(this.folderPath)) {
      await this.clearCache();
      return;
    }

    const files = this.getAllExcelFiles(this.folderPath);
    const fileInfoList: FileInfo[] = [];

    for (const file of files) {
      try {
        await this.parseAndCacheExcelFile(file);
        const stat = fs.statSync(file);
        const fileName = path.basename(file);
        const sheets = await this.getFileSheets(fileName);

        fileInfoList.push({
          fileName,
          displayName: fileName.replace(/\.(xlsx|xls|xlsm)$/i, ''),
          sheets,
          lastModified: stat.mtime,
          size: stat.size
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    // 存储文件列表
    await redis.set(
      REDIS_KEYS.FILES,
      JSON.stringify(fileInfoList),
      'EX',
      CACHE_TTL.DEFAULT
    );

    // 更新最后更新时间
    await redis.set(REDIS_KEYS.LAST_UPDATE, new Date().toISOString());
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

  private async parseAndCacheExcelFile(filePath: string): Promise<void> {
    const fileName = path.basename(filePath);
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, {
      type: 'buffer',
      cellStyles: true,
      cellNF: true,
      cellDates: true
    });

    const sheetNames: string[] = [];

    for (const sheetName of workbook.SheetNames) {
      sheetNames.push(sheetName);
      const worksheet = workbook.Sheets[sheetName];

      // 获取范围和合并单元格
      const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
      const merges = worksheet['!merges'] || [];

      // 检测标题
      let sheetTitle: string | undefined = undefined;
      const firstRowMerges = merges.filter(
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

      // 转换合并单元格信息
      const mergeRanges: MergeRange[] = merges.map((merge: any) => ({
        startRow: merge.s.r,
        endRow: merge.e.r,
        startCol: merge.s.c,
        endCol: merge.e.c
      }));

      // 将工作表转换为JSON
      const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        blankrows: true,
        raw: false
      });

      // 处理合并单元格
      const processedData = this.processMergedCells(
        jsonData as any[][],
        merges
      );

      // 处理表头
      const rawHeaders = (processedData[0] || []) as any[];
      const totalCols = Math.max(
        range.e.c - range.s.c + 1,
        processedData.reduce((m, r) => Math.max(m, r?.length || 0), 0)
      );
      const headerRowHasMerge = merges.some(
        (m: any) => m.s.r === 0 || m.e.r === 0
      );
      const colLetters = Array.from({ length: totalCols }, (_, i) =>
        XLSX.utils.encode_col(range.s.c + i)
      );
      const useLettersAsHeaders =
        headerRowHasMerge ||
        rawHeaders.filter((h) => String(h ?? '').trim() !== '').length <= 1;
      const headers = useLettersAsHeaders
        ? colLetters
        : rawHeaders.map((h, i) =>
            String(h ?? '').trim() !== '' ? String(h) : colLetters[i]
          );

      // 存储sheet信息
      const sheetInfo: CachedSheetInfo = {
        name: sheetName,
        columns: headers,
        mergeRanges,
        title: sheetTitle,
        totalRows: processedData.length - (useLettersAsHeaders ? 0 : 1)
      };

      await redis.set(
        REDIS_KEYS.SHEET_INFO(fileName, sheetName),
        JSON.stringify(sheetInfo),
        'EX',
        CACHE_TTL.DEFAULT
      );

      // 分页存储数据
      const dataStartIndex = useLettersAsHeaders ? 0 : 1;
      const totalPages = Math.ceil(
        (processedData.length - dataStartIndex) / this.pageSize
      );

      for (let page = 1; page <= totalPages; page++) {
        const startIdx = dataStartIndex + (page - 1) * this.pageSize;
        const endIdx = Math.min(startIdx + this.pageSize, processedData.length);

        const pageData: Contact[] = [];
        for (let i = startIdx; i < endIdx; i++) {
          const row = processedData[i] || [];
          const rowData: Record<string, any> = {};
          headers.forEach((header: any, index: number) => {
            rowData[String(header)] = row[index] || '';
          });

          const searchableText = Object.values(rowData)
            .map((v) => String(v || ''))
            .join(' ')
            .toLowerCase();

          pageData.push({
            id: `${fileName}-${sheetName}-${i}`,
            fileName,
            sheetName,
            rowData,
            searchableText,
            rowIndex: i - dataStartIndex
          });
        }

        // 存储页面数据
        await redis.set(
          REDIS_KEYS.SHEET_DATA(fileName, sheetName, page),
          JSON.stringify(pageData),
          'EX',
          CACHE_TTL.SHEET_DATA
        );
      }

      // 存储总行数
      await redis.set(
        REDIS_KEYS.SHEET_TOTAL(fileName, sheetName),
        processedData.length - dataStartIndex,
        'EX',
        CACHE_TTL.DEFAULT
      );
    }

    // 存储文件的sheet列表
    await redis.set(
      REDIS_KEYS.FILE_SHEETS(fileName),
      JSON.stringify(sheetNames),
      'EX',
      CACHE_TTL.DEFAULT
    );
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

  async getFiles(): Promise<FileInfo[]> {
    const filesJson = await redis.get(REDIS_KEYS.FILES);
    if (filesJson) {
      return JSON.parse(filesJson);
    }
    return [];
  }

  async getFileSheets(fileName: string): Promise<string[]> {
    const sheetsJson = await redis.get(REDIS_KEYS.FILE_SHEETS(fileName));
    if (sheetsJson) {
      return JSON.parse(sheetsJson);
    }
    return [];
  }

  async getSheetInfo(
    fileName: string,
    sheetName: string
  ): Promise<CachedSheetInfo | null> {
    const infoJson = await redis.get(
      REDIS_KEYS.SHEET_INFO(fileName, sheetName)
    );
    if (infoJson) {
      return JSON.parse(infoJson);
    }
    return null;
  }

  async getSheetData(
    fileName: string,
    sheetName: string,
    page: number = 1,
    pageSize?: number
  ): Promise<{
    data: Contact[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    const effectivePageSize = pageSize || this.pageSize;

    // 获取总行数
    const totalStr = await redis.get(
      REDIS_KEYS.SHEET_TOTAL(fileName, sheetName)
    );
    const total = totalStr ? parseInt(totalStr) : 0;

    // 如果请求的pageSize与默认不同，需要重新计算数据
    if (effectivePageSize !== this.pageSize) {
      // 需要从多个缓存页中组合数据
      const startRow = (page - 1) * effectivePageSize;
      const endRow = Math.min(startRow + effectivePageSize, total);

      const data: Contact[] = [];
      const startCachePage = Math.floor(startRow / this.pageSize) + 1;
      const endCachePage = Math.ceil(endRow / this.pageSize);

      for (
        let cachePage = startCachePage;
        cachePage <= endCachePage;
        cachePage++
      ) {
        const cacheDataJson = await redis.get(
          REDIS_KEYS.SHEET_DATA(fileName, sheetName, cachePage)
        );
        if (cacheDataJson) {
          const cacheData = JSON.parse(cacheDataJson) as Contact[];
          data.push(...cacheData);
        }
      }

      // 截取所需数据
      const relativeStart = startRow % this.pageSize;
      const relativeEnd = relativeStart + effectivePageSize;
      const resultData = data.slice(relativeStart, relativeEnd);

      return {
        data: resultData,
        total,
        page,
        pageSize: effectivePageSize
      };
    }

    // 使用默认pageSize，直接从缓存获取
    const dataJson = await redis.get(
      REDIS_KEYS.SHEET_DATA(fileName, sheetName, page)
    );
    const data = dataJson ? JSON.parse(dataJson) : [];

    return {
      data,
      total,
      page,
      pageSize: effectivePageSize
    };
  }

  async searchContacts(
    query: string,
    page: number = 1,
    pageSize: number = 50
  ): Promise<{
    data: Contact[];
    total: number;
    page: number;
    pageSize: number;
  }> {
    if (!query) {
      return { data: [], total: 0, page, pageSize };
    }

    const searchTerm = query.toLowerCase();
    const files = await this.getFiles();
    const allMatches: Contact[] = [];

    // 搜索所有文件的所有sheet
    for (const file of files) {
      for (const sheetName of file.sheets) {
        const total = await redis.get(
          REDIS_KEYS.SHEET_TOTAL(file.fileName, sheetName)
        );
        const totalRows = total ? parseInt(total) : 0;
        const totalPages = Math.ceil(totalRows / this.pageSize);

        // 搜索每一页
        for (let p = 1; p <= totalPages; p++) {
          const dataJson = await redis.get(
            REDIS_KEYS.SHEET_DATA(file.fileName, sheetName, p)
          );
          if (dataJson) {
            const pageData = JSON.parse(dataJson) as Contact[];
            const matches = pageData.filter((contact) =>
              contact.searchableText.includes(searchTerm)
            );
            allMatches.push(...matches);
          }
        }
      }
    }

    // 分页返回结果
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedData = allMatches.slice(start, end);

    return {
      data: paginatedData,
      total: allMatches.length,
      page,
      pageSize
    };
  }

  async getLastUpdate(): Promise<Date | null> {
    const dateStr = await redis.get(REDIS_KEYS.LAST_UPDATE);
    return dateStr ? new Date(dateStr) : null;
  }

  private async clearCache(): Promise<void> {
    const keys = await redis.keys('excel:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }

  destroy() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
  }
}

export const excelCacheService = new ExcelCacheService();
