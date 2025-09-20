import * as XLSX from 'xlsx';
import * as fs from 'fs';
import * as path from 'path';
import redis, { CACHE_TTL } from './redis';
import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import type {
  NavigationItem,
  NavigationCategory,
  ExcelNavigationRow,
  UserNavigationData
} from '@/types/navigation';

const NAVIGATION_EXCEL_PATH =
  process.env.NAVIGATION_EXCEL_PATH ||
  path.join(process.cwd(), 'data', 'navigation.xlsx');

const CACHE_KEYS = {
  NAVIGATION_DATA: 'navigation:data',
  USER_DATA: (userId: string) => `navigation:user:${userId}`,
  LAST_UPDATE: 'navigation:last_update',
  FILE_STATUS: 'navigation:file_status'
};

class NavigationExcelMonitor extends EventEmitter {
  private watcher: fs.FSWatcher | null = null;
  private updateTimeout: NodeJS.Timeout | null = null;
  private isUpdating = false;

  constructor() {
    super();
  }

  async start() {
    // Initial load
    await this.loadNavigationData();

    // Watch for file changes
    if (fs.existsSync(NAVIGATION_EXCEL_PATH)) {
      this.watcher = fs.watch(NAVIGATION_EXCEL_PATH, (eventType) => {
        if (eventType === 'change') {
          this.scheduleUpdate();
        }
      });
      console.log(`Monitoring navigation Excel file: ${NAVIGATION_EXCEL_PATH}`);
    } else {
      console.warn(`Navigation Excel file not found: ${NAVIGATION_EXCEL_PATH}`);
    }
  }

  private scheduleUpdate() {
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
    }

    this.updateTimeout = setTimeout(async () => {
      await this.loadNavigationData();
    }, 1000); // Debounce for 1 second
  }

  private async loadNavigationData() {
    if (this.isUpdating) return;

    this.isUpdating = true;
    this.emit('update:start');

    try {
      if (!fs.existsSync(NAVIGATION_EXCEL_PATH)) {
        console.warn('Navigation Excel file not found');
        // Create sample data if file doesn't exist
        await this.createSampleData();
        return;
      }

      const workbook = XLSX.readFile(NAVIGATION_EXCEL_PATH);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json<ExcelNavigationRow>(worksheet);

      // Transform Excel data to navigation structure
      const navigationData = this.transformExcelData(data);

      // Store in Redis cache
      await redis.set(
        CACHE_KEYS.NAVIGATION_DATA,
        JSON.stringify(navigationData),
        'EX',
        CACHE_TTL.NAVIGATION
      );

      await redis.set(
        CACHE_KEYS.LAST_UPDATE,
        new Date().toISOString(),
        'EX',
        CACHE_TTL.NAVIGATION
      );

      const fileStats = fs.statSync(NAVIGATION_EXCEL_PATH);
      await redis.set(
        CACHE_KEYS.FILE_STATUS,
        JSON.stringify({
          lastModified: fileStats.mtime,
          size: fileStats.size,
          cached: true
        }),
        'EX',
        CACHE_TTL.NAVIGATION
      );

      this.emit('update:complete', navigationData);
      console.log(`Navigation data updated: ${data.length} items loaded`);
    } catch (error) {
      console.error('Error loading navigation data:', error);
      this.emit('update:error', error);
    } finally {
      this.isUpdating = false;
    }
  }

  private transformExcelData(rows: ExcelNavigationRow[]): NavigationCategory[] {
    const categoryMap = new Map<string, Map<string, NavigationItem>>();

    rows.forEach((row) => {
      const category = (row.类别 || '未分类').trim();
      const itemId = this.generateStableId(row);
      const item: NavigationItem = {
        id: itemId,
        category,
        name: row.名字?.trim() || '',
        url: row.链接?.trim() || '',
        description: row.说明?.trim() || '',
        isExternal: row.链接?.startsWith('http')
      };

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Map());
      }

      const itemsMap = categoryMap.get(category)!;
      itemsMap.set(itemId, item);
    });

    return Array.from(categoryMap.entries()).map(([name, itemsMap]) => ({
      id: this.createCategorySlug(name),
      name,
      items: Array.from(itemsMap.values()).sort((a, b) =>
        a.name.localeCompare(b.name, 'zh-CN')
      )
    }));
  }

  private generateStableId(row: ExcelNavigationRow): string {
    const source = `${(row.类别 || '').trim().toLowerCase()}|${(row.名字 || '')
      .trim()
      .toLowerCase()}|${(row.链接 || '').trim().toLowerCase()}`;

    const hash = createHash('md5').update(source).digest('hex');
    return `nav-${hash}`;
  }

  private createCategorySlug(name: string): string {
    const normalized = name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-\u4e00-\u9fa5]/g, '-');

    return normalized || 'category';
  }

  private async createSampleData() {
    const sampleData: ExcelNavigationRow[] = [
      {
        类别: '开发工具',
        名字: 'GitLab',
        链接: 'https://gitlab.company.com',
        说明: '代码仓库管理'
      },
      {
        类别: '开发工具',
        名字: 'Jenkins',
        链接: 'https://jenkins.company.com',
        说明: 'CI/CD 平台'
      },
      {
        类别: '监控系统',
        名字: 'Grafana',
        链接: 'https://grafana.company.com',
        说明: '系统监控面板'
      },
      {
        类别: '监控系统',
        名字: 'Kibana',
        链接: 'https://kibana.company.com',
        说明: '日志分析平台'
      },
      {
        类别: '协作工具',
        名字: 'Confluence',
        链接: 'https://confluence.company.com',
        说明: '文档协作平台'
      },
      {
        类别: '协作工具',
        名字: 'JIRA',
        链接: 'https://jira.company.com',
        说明: '项目管理工具'
      }
    ];

    // Create directory if not exists
    const dir = path.dirname(NAVIGATION_EXCEL_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create Excel file
    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Navigation');
    XLSX.writeFile(wb, NAVIGATION_EXCEL_PATH);

    console.log(
      `Sample navigation Excel file created at: ${NAVIGATION_EXCEL_PATH}`
    );

    // Load the created data
    await this.loadNavigationData();
  }

  async getNavigationData(): Promise<NavigationCategory[]> {
    const cached = await redis.get(CACHE_KEYS.NAVIGATION_DATA);
    if (cached) {
      return JSON.parse(cached);
    }

    // If no cache, trigger a load and return empty
    this.loadNavigationData();
    return [];
  }

  async getUserData(userId: string): Promise<UserNavigationData> {
    const cached = await redis.get(CACHE_KEYS.USER_DATA(userId));
    if (cached) {
      return JSON.parse(cached);
    }

    return {
      userId,
      recentVisits: [],
      favorites: []
    };
  }

  async addRecentVisit(userId: string, itemId: string) {
    const userData = await this.getUserData(userId);

    // Find existing visit or create new
    const existingIndex = userData.recentVisits.findIndex(
      (v) => v.itemId === itemId
    );

    if (existingIndex >= 0) {
      // Update existing visit
      userData.recentVisits[existingIndex].visitedAt = new Date();
      userData.recentVisits[existingIndex].count++;

      // Move to front
      const [visit] = userData.recentVisits.splice(existingIndex, 1);
      userData.recentVisits.unshift(visit);
    } else {
      // Add new visit
      userData.recentVisits.unshift({
        itemId,
        visitedAt: new Date(),
        count: 1
      });
    }

    // Keep only last 20 visits
    userData.recentVisits = userData.recentVisits.slice(0, 20);

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  async toggleFavorite(userId: string, itemId: string) {
    const userData = await this.getUserData(userId);

    const index = userData.favorites.indexOf(itemId);
    if (index >= 0) {
      userData.favorites.splice(index, 1);
    } else {
      userData.favorites.push(itemId);
    }

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  async clearRecentVisits(userId: string) {
    const userData = await this.getUserData(userId);
    userData.recentVisits = [];

    await redis.set(
      CACHE_KEYS.USER_DATA(userId),
      JSON.stringify(userData),
      'EX',
      CACHE_TTL.USER_DATA || 86400 * 7 // 7 days
    );

    return userData;
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }
    if (this.updateTimeout) {
      clearTimeout(this.updateTimeout);
      this.updateTimeout = null;
    }
  }
}

export const navigationMonitor = new NavigationExcelMonitor();

// Auto-start monitoring if in production
if (process.env.NODE_ENV === 'production') {
  navigationMonitor.start().catch(console.error);
}
