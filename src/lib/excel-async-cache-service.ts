import redis, { REDIS_KEYS } from './redis';
import { Contact, SheetInfo, MergeRange } from '@/types/excel';

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

interface CacheStatus {
  isUpdating: boolean;
  lastUpdate: Date | null;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks?: number;
}

interface ServiceStatus {
  status: string;
  lastUpdate: Date | null;
  filesProcessed: number;
  currentFile: string | null;
  errors: any[];
  uptime?: number;
  memoryUsage?: any;
  timestamp?: string;
}

class ExcelAsyncCacheService {
  private pageSize: number = 100;

  // 动态生成 Redis 键
  private getRedisKeys(dataSource: string = 'excel') {
    return {
      FILES: `${dataSource}:files`,
      FILE_INFO: (fileName: string) => `${dataSource}:file:${fileName}:info`,
      FILE_SHEETS: (fileName: string) =>
        `${dataSource}:file:${fileName}:sheets`,
      FILE_CACHE_STATUS: (fileName: string) =>
        `${dataSource}:file:${fileName}:cache_status`,
      SHEET_INFO: (fileName: string, sheetName: string) =>
        `${dataSource}:sheet:${fileName}:${sheetName}:info`,
      SHEET_DATA: (fileName: string, sheetName: string, page: number) =>
        `${dataSource}:sheet:${fileName}:${sheetName}:data:${page}`,
      SHEET_TOTAL: (fileName: string, sheetName: string) =>
        `${dataSource}:sheet:${fileName}:${sheetName}:total`,
      SEARCH_INDEX: `${dataSource}:search:index`,
      LAST_UPDATE: `${dataSource}:last_update`,
      CACHE_STATUS: (taskId: string) => `${dataSource}:cache:status:${taskId}`,
      CACHE_PROGRESS: (taskId: string) =>
        `${dataSource}:cache:progress:${taskId}`,
      CACHE_GLOBAL_STATUS: `${dataSource}:cache:global_status`
    };
  }

  // Get all available files from Redis
  async getAvailableFiles(dataSource: string = 'excel'): Promise<FileInfo[]> {
    const KEYS = this.getRedisKeys(dataSource);
    try {
      const filesJson = await redis.get(KEYS.FILES);
      if (!filesJson) return [];

      const fileNames = JSON.parse(filesJson) as string[];
      const fileInfos: FileInfo[] = [];

      for (const fileName of fileNames) {
        const statusJson = await redis.get(KEYS.FILE_CACHE_STATUS(fileName));
        if (statusJson) {
          const status = JSON.parse(statusJson);
          fileInfos.push({
            fileName,
            displayName: fileName,
            sheets: status.sheets || [],
            lastModified: new Date(status.lastModified),
            size: status.size || 0
          });
        }
      }

      return fileInfos;
    } catch (error) {
      console.error('Error getting available files:', error);
      return [];
    }
  }

  // Get sheet info from Redis
  async getSheetInfo(
    fileName: string,
    sheetName: string,
    dataSource: string = 'excel'
  ): Promise<SheetInfo | null> {
    const KEYS = this.getRedisKeys(dataSource);
    try {
      const infoJson = await redis.get(KEYS.SHEET_INFO(fileName, sheetName));
      if (!infoJson) return null;

      const cachedInfo = JSON.parse(infoJson) as CachedSheetInfo;

      return {
        name: cachedInfo.name,
        columns: cachedInfo.columns,
        mergeRanges: cachedInfo.mergeRanges,
        title: cachedInfo.title,
        totalRows: cachedInfo.totalRows,
        contacts: [] // Add empty contacts array for compatibility
      };
    } catch (error) {
      console.error('Error getting sheet info:', error);
      return null;
    }
  }

  // Get sheet names for a file
  async getFileSheets(
    fileName: string,
    dataSource: string = 'excel'
  ): Promise<string[]> {
    const KEYS = this.getRedisKeys(dataSource);
    try {
      const sheetsJson = await redis.get(KEYS.FILE_SHEETS(fileName));
      if (!sheetsJson) return [];
      return JSON.parse(sheetsJson) as string[];
    } catch (error) {
      console.error('Error getting file sheets:', error);
      return [];
    }
  }

  // Get paginated data from Redis
  async getPaginatedData(
    fileName: string,
    sheetName: string,
    page: number = 1,
    pageSize?: number,
    dataSource: string = 'excel'
  ): Promise<{ data: Contact[]; total: number; hasMore: boolean }> {
    const KEYS = this.getRedisKeys(dataSource);
    try {
      const size = pageSize || this.pageSize;

      // Get cached data
      const dataJson = await redis.get(
        KEYS.SHEET_DATA(fileName, sheetName, page)
      );
      if (!dataJson) {
        return { data: [], total: 0, hasMore: false };
      }

      const cachedData = JSON.parse(dataJson) as Contact[];

      // Get total count
      const totalStr = await redis.get(KEYS.SHEET_TOTAL(fileName, sheetName));
      const total = totalStr ? parseInt(totalStr, 10) : cachedData.length;

      const hasMore = page * size < total;

      return {
        data: cachedData,
        total,
        hasMore
      };
    } catch (error) {
      console.error('Error getting paginated data:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Search contacts across all cached data
  async searchContacts(
    query: string,
    page: number = 1,
    pageSize: number = 50,
    dataSource: string = 'excel'
  ): Promise<{ data: Contact[]; total: number; hasMore: boolean }> {
    const KEYS = this.getRedisKeys(dataSource);
    try {
      const allResults: Contact[] = [];
      // Trim and lowercase the search query
      const searchQuery = query.trim().toLowerCase();

      // If search query is empty after trim, return empty results
      if (!searchQuery) {
        return { data: [], total: 0, hasMore: false };
      }

      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize;

      // Get all files
      const filesJson = await redis.get(KEYS.FILES);
      if (!filesJson) return { data: [], total: 0, hasMore: false };

      const files = JSON.parse(filesJson) as string[];

      // First, collect all matching results
      for (const fileName of files) {
        const sheetsJson = await redis.get(KEYS.FILE_SHEETS(fileName));
        if (!sheetsJson) continue;

        const sheets = JSON.parse(sheetsJson) as string[];

        for (const sheetName of sheets) {
          // Search through all pages
          let sheetPage = 1;
          let hasMore = true;

          while (hasMore) {
            const dataJson = await redis.get(
              KEYS.SHEET_DATA(fileName, sheetName, sheetPage)
            );
            if (!dataJson) {
              hasMore = false;
              break;
            }

            const pageData = JSON.parse(dataJson) as Contact[];

            for (const contact of pageData) {
              if (
                contact.searchableText &&
                contact.searchableText.includes(searchQuery)
              ) {
                allResults.push(contact);
              }
            }

            sheetPage++;
          }
        }
      }

      // Apply pagination
      const paginatedResults = allResults.slice(startIndex, endIndex);
      const hasMore = endIndex < allResults.length;

      return {
        data: paginatedResults,
        total: allResults.length,
        hasMore
      };
    } catch (error) {
      console.error('Error searching contacts:', error);
      return { data: [], total: 0, hasMore: false };
    }
  }

  // Get cache status from Redis
  async getCacheStatus(): Promise<CacheStatus> {
    try {
      // Try to get service status first
      const serviceStatusJson = await redis.get('excel:cache:status');
      if (serviceStatusJson) {
        const serviceStatus = JSON.parse(serviceStatusJson) as ServiceStatus;
        return {
          isUpdating: serviceStatus.status === 'processing',
          lastUpdate: serviceStatus.lastUpdate
            ? new Date(serviceStatus.lastUpdate)
            : null,
          pendingTasks: 0,
          activeTasks: serviceStatus.status === 'processing' ? 1 : 0,
          completedTasks: serviceStatus.filesProcessed || 0,
          failedTasks: serviceStatus.errors?.length || 0
        };
      }

      // Fallback to last update time
      const lastUpdateStr = await redis.get(REDIS_KEYS.LAST_UPDATE);
      return {
        isUpdating: false,
        lastUpdate: lastUpdateStr ? new Date(lastUpdateStr) : null,
        pendingTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0
      };
    } catch (error) {
      console.error('Error getting cache status:', error);
      return {
        isUpdating: false,
        lastUpdate: null,
        pendingTasks: 0,
        activeTasks: 0,
        completedTasks: 0,
        failedTasks: 0
      };
    }
  }

  // Get service status
  async getServiceStatus(): Promise<ServiceStatus | null> {
    try {
      const statusJson = await redis.get('excel:cache:status');
      if (!statusJson) return null;
      return JSON.parse(statusJson) as ServiceStatus;
    } catch (error) {
      console.error('Error getting service status:', error);
      return null;
    }
  }

  // Check if cache is available
  async isCacheAvailable(): Promise<boolean> {
    try {
      await redis.ping();

      // Check if service is running
      const statusJson = await redis.get('excel:cache:status');
      if (!statusJson) return false;

      const status = JSON.parse(statusJson) as ServiceStatus;
      const statusTime = new Date(status.timestamp || '');
      const now = new Date();

      // Check if status is recent (within last minute)
      const timeDiff = now.getTime() - statusTime.getTime();
      return timeDiff < 60000; // 1 minute
    } catch (error) {
      console.error('Error checking cache availability:', error);
      return false;
    }
  }

  // Get files (wrapper for getAvailableFiles)
  async getFiles() {
    return this.getAvailableFiles();
  }

  // Get last update time
  async getLastUpdate(dataSource: string = 'excel'): Promise<Date | null> {
    try {
      const KEYS = this.getRedisKeys(dataSource);
      const lastUpdateStr = await redis.get(KEYS.LAST_UPDATE);
      return lastUpdateStr ? new Date(lastUpdateStr) : null;
    } catch (error) {
      console.error('Error getting last update:', error);
      return null;
    }
  }

  // Get sheet data (wrapper for getPaginatedData)
  async getSheetData(
    fileName: string,
    sheetName: string,
    page: number = 1,
    pageSize?: number
  ) {
    return this.getPaginatedData(fileName, sheetName, page, pageSize);
  }

  // Get task status (placeholder for now)
  async getTaskStatus(
    taskId: string,
    dataSource: string = 'excel'
  ): Promise<any> {
    void dataSource;
    // Since we don't have worker manager anymore, return a mock status
    return {
      taskId,
      status: 'completed',
      progress: 100,
      total: 100,
      currentFile: null,
      error: null
    };
  }

  // Set folder path (placeholder for now)
  async setFolderPath(
    folderPath: string,
    dataSource: string = 'excel'
  ): Promise<string> {
    void folderPath;
    void dataSource;
    // Return a mock task ID
    return `task_${Date.now()}`;
  }

  // Trigger refresh (for future use with message queue)
  async triggerRefresh(): Promise<void> {
    // In future, this could send a message to the service to trigger refresh
    console.log(
      'Refresh trigger not implemented - service monitors files automatically'
    );
  }
}

// Export singleton instance
export const excelAsyncCacheService = new ExcelAsyncCacheService();
