import * as fs from 'fs';
import * as path from 'path';
import chokidar from 'chokidar';
import redis, { REDIS_KEYS, CACHE_TTL } from './redis';
import { excelWorkerManager, CacheStatus, FileCacheStatus } from './excel-worker-manager';
import { Contact, ExcelData, SheetInfo, MergeRange } from '@/types/excel';

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

class ExcelAsyncCacheService {
  private folderPath: string = '';
  private watcher: any = null;
  private reloadTimer: NodeJS.Timeout | null = null;
  private pageSize: number = 100;
  private isInitialized: boolean = false;

  constructor() {
    try {
      const envPath = process.env.EXCEL_WATCH_DIR;
      if (envPath && fs.existsSync(envPath)) {
        this.folderPath = envPath;
        this.initializeAsync();
      }
    } catch {
      // ignore env init errors
    }

    // Listen to worker manager events
    excelWorkerManager.on('complete', async () => {
      // Notify that cache has been updated
      await this.updateGlobalCacheStatus();
    });
  }

  private async initializeAsync() {
    // Start watching immediately
    this.startWatching();
    
    // Load files in background without blocking
    setImmediate(() => {
      this.loadAllExcelFilesAsync();
    });
  }

  async setFolderPath(folderPath: string): Promise<string> {
    this.folderPath = folderPath;
    this.startWatching();
    
    // Start async loading and return task ID
    const taskId = await this.loadAllExcelFilesAsync();
    return taskId;
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
      .on('add', (filePath: string) => this.scheduleFileUpdate([filePath]))
      .on('change', (filePath: string) => this.scheduleFileUpdate([filePath]))
      .on('unlink', () => this.scheduleReload());
  }

  private scheduleFileUpdate(filePaths: string[]) {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(async () => {
      const fileNames = filePaths.map(fp => path.basename(fp));
      await excelWorkerManager.createCacheTask(this.folderPath, fileNames);
    }, 300);
  }

  private scheduleReload() {
    if (this.reloadTimer) clearTimeout(this.reloadTimer);
    this.reloadTimer = setTimeout(() => {
      this.loadAllExcelFilesAsync();
    }, 300);
  }

  private async loadAllExcelFilesAsync(): Promise<string> {
    if (!this.folderPath || !fs.existsSync(this.folderPath)) {
      await this.clearCache();
      return '';
    }

    const files = this.getAllExcelFiles(this.folderPath);
    const fileNames = files.map(file => path.basename(file));
    
    // Create background task
    const taskId = await excelWorkerManager.createCacheTask(this.folderPath, fileNames);
    
    // Update file list immediately (without waiting for cache)
    await this.updateFileList(files);
    
    this.isInitialized = true;
    return taskId;
  }

  private async updateFileList(files: string[]) {
    const fileInfoList: FileInfo[] = [];

    for (const file of files) {
      try {
        const stat = fs.statSync(file);
        const fileName = path.basename(file);
        
        // Try to get sheets from cache, fallback to empty array
        let sheets: string[] = [];
        try {
          const sheetsJson = await redis.get(REDIS_KEYS.FILE_SHEETS(fileName));
          if (sheetsJson) {
            sheets = JSON.parse(sheetsJson);
          }
        } catch (error) {
          // Ignore cache errors
        }
        
        fileInfoList.push({
          fileName,
          displayName: fileName.replace(/\.(xlsx|xls|xlsm)$/i, ''),
          sheets,
          lastModified: stat.mtime,
          size: stat.size
        });

        // Update file cache status
        await excelWorkerManager.setFileCacheStatus(fileName, {
          cached: sheets.length > 0,
          lastModified: stat.mtime,
          size: stat.size,
          sheets
        });
      } catch (error) {
        console.error(`Error processing file ${file}:`, error);
      }
    }

    // Store file list
    await redis.set(
      REDIS_KEYS.FILES,
      JSON.stringify(fileInfoList),
      'EX',
      CACHE_TTL.DEFAULT
    );
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
    const infoJson = await redis.get(REDIS_KEYS.SHEET_INFO(fileName, sheetName));
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
  ): Promise<{ data: Contact[]; total: number; page: number; pageSize: number }> {
    const effectivePageSize = pageSize || this.pageSize;
    
    // Get total rows
    const totalStr = await redis.get(REDIS_KEYS.SHEET_TOTAL(fileName, sheetName));
    const total = totalStr ? parseInt(totalStr) : 0;
    
    // Handle different page sizes
    if (effectivePageSize !== this.pageSize) {
      const startRow = (page - 1) * effectivePageSize;
      const endRow = Math.min(startRow + effectivePageSize, total);
      
      const data: Contact[] = [];
      const startCachePage = Math.floor(startRow / this.pageSize) + 1;
      const endCachePage = Math.ceil(endRow / this.pageSize);
      
      for (let cachePage = startCachePage; cachePage <= endCachePage; cachePage++) {
        const cacheDataJson = await redis.get(
          REDIS_KEYS.SHEET_DATA(fileName, sheetName, cachePage)
        );
        if (cacheDataJson) {
          const cacheData = JSON.parse(cacheDataJson) as Contact[];
          data.push(...cacheData);
        }
      }
      
      const relativeStart = startRow - ((startCachePage - 1) * this.pageSize);
      const relativeEnd = relativeStart + effectivePageSize;
      const resultData = data.slice(relativeStart, relativeEnd);
      
      return {
        data: resultData,
        total,
        page,
        pageSize: effectivePageSize
      };
    }
    
    // Use default page size
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
  ): Promise<{ data: Contact[]; total: number; page: number; pageSize: number }> {
    if (!query) {
      return { data: [], total: 0, page, pageSize };
    }

    const searchTerm = query.toLowerCase();
    const files = await this.getFiles();
    const allMatches: Contact[] = [];

    for (const file of files) {
      for (const sheetName of file.sheets) {
        const total = await redis.get(
          REDIS_KEYS.SHEET_TOTAL(file.fileName, sheetName)
        );
        const totalRows = total ? parseInt(total) : 0;
        const totalPages = Math.ceil(totalRows / this.pageSize);

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

  async getCacheStatus(): Promise<CacheStatus & { isInitialized: boolean }> {
    const workerStatus = await excelWorkerManager.getCacheStatus();
    return {
      ...workerStatus,
      isInitialized: this.isInitialized
    };
  }

  async getTaskStatus(taskId: string) {
    return await excelWorkerManager.getTaskStatus(taskId);
  }

  private async updateGlobalCacheStatus() {
    const status = await this.getCacheStatus();
    await redis.set(
      REDIS_KEYS.CACHE_GLOBAL_STATUS,
      JSON.stringify(status),
      'EX',
      CACHE_TTL.DEFAULT
    );
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
    excelWorkerManager.destroy();
  }
}

export const excelAsyncCacheService = new ExcelAsyncCacheService();