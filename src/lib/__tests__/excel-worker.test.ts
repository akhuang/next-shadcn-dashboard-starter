import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { ExcelWorkerManager } from '../excel-worker-manager';
import redis from '../redis';

// Mock redis
vi.mock('../redis', () => ({
  default: {
    set: vi.fn(),
    get: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    hset: vi.fn(),
    hget: vi.fn(),
    hdel: vi.fn(),
    expire: vi.fn()
  },
  REDIS_KEYS: {
    CACHE_STATUS: (taskId: string) => `excel:cache:status:${taskId}`,
    CACHE_PROGRESS: (taskId: string) => `excel:cache:progress:${taskId}`,
    FILES: 'excel:files',
    FILE_SHEETS: (fileName: string) => `excel:file:${fileName}:sheets`
  },
  CACHE_TTL: {
    DEFAULT: 3600,
    SHEET_DATA: 1800,
    SEARCH: 300
  }
}));

describe('ExcelWorkerManager', () => {
  let manager: ExcelWorkerManager;

  beforeEach(() => {
    manager = new ExcelWorkerManager();
    vi.clearAllMocks();
  });

  afterEach(() => {
    manager.destroy();
  });

  describe('Task Queue Management', () => {
    it('should create a new cache task', async () => {
      const taskId = await manager.createCacheTask('/test/folder', ['file1.xlsx']);
      
      expect(taskId).toBeDefined();
      expect(taskId).toMatch(/^task_/);
    });

    it('should track task status', async () => {
      const taskId = await manager.createCacheTask('/test/folder', ['file1.xlsx']);
      
      const status = await manager.getTaskStatus(taskId);
      expect(status).toEqual({
        taskId,
        status: 'pending',
        progress: 0,
        total: 1,
        currentFile: null,
        error: null
      });
    });

    it('should update task progress', async () => {
      const taskId = await manager.createCacheTask('/test/folder', ['file1.xlsx', 'file2.xlsx']);
      
      await manager.updateTaskProgress(taskId, {
        status: 'processing',
        progress: 1,
        total: 2,
        currentFile: 'file1.xlsx'
      });

      const status = await manager.getTaskStatus(taskId);
      expect(status).toMatchObject({
        status: 'processing',
        progress: 1,
        total: 2,
        currentFile: 'file1.xlsx'
      });
    });

    it('should handle multiple concurrent tasks', async () => {
      const task1 = await manager.createCacheTask('/folder1', ['file1.xlsx']);
      const task2 = await manager.createCacheTask('/folder2', ['file2.xlsx']);
      
      expect(task1).not.toEqual(task2);
      
      const status1 = await manager.getTaskStatus(task1);
      const status2 = await manager.getTaskStatus(task2);
      
      expect(status1.taskId).toEqual(task1);
      expect(status2.taskId).toEqual(task2);
    });
  });

  describe('Worker Thread Management', () => {
    it('should limit concurrent workers', async () => {
      const maxWorkers = 2;
      manager.setMaxWorkers(maxWorkers);
      
      const tasks = [];
      for (let i = 0; i < 5; i++) {
        tasks.push(manager.createCacheTask('/folder', [`file${i}.xlsx`]));
      }
      
      await Promise.all(tasks);
      
      const activeWorkers = manager.getActiveWorkerCount();
      expect(activeWorkers).toBeLessThanOrEqual(maxWorkers);
    });

    it('should handle worker failures gracefully', async () => {
      const taskId = await manager.createCacheTask('/invalid/folder', ['nonexistent.xlsx']);
      
      // Wait for task to fail
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const status = await manager.getTaskStatus(taskId);
      expect(status.status).toEqual('failed');
      expect(status.error).toBeDefined();
    });

    it('should cancel running tasks', async () => {
      const taskId = await manager.createCacheTask('/test/folder', 
        Array.from({ length: 100 }, (_, i) => `file${i}.xlsx`)
      );
      
      await manager.cancelTask(taskId);
      
      const status = await manager.getTaskStatus(taskId);
      expect(status.status).toEqual('cancelled');
    });
  });

  describe('Cache Status Tracking', () => {
    it('should report overall cache status', async () => {
      const status = await manager.getCacheStatus();
      
      expect(status).toHaveProperty('isUpdating');
      expect(status).toHaveProperty('lastUpdate');
      expect(status).toHaveProperty('pendingTasks');
      expect(status).toHaveProperty('activeTasks');
      expect(status).toHaveProperty('completedTasks');
    });

    it('should track file-level cache status', async () => {
      await manager.setFileCacheStatus('file1.xlsx', {
        cached: true,
        lastModified: new Date(),
        size: 1024,
        sheets: ['Sheet1', 'Sheet2']
      });
      
      const status = await manager.getFileCacheStatus('file1.xlsx');
      expect(status).toMatchObject({
        cached: true,
        size: 1024,
        sheets: ['Sheet1', 'Sheet2']
      });
    });

    it('should detect stale cache', async () => {
      const fileName = 'test.xlsx';
      const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
      
      await manager.setFileCacheStatus(fileName, {
        cached: true,
        lastModified: oldDate,
        size: 1024,
        sheets: ['Sheet1']
      });
      
      const isStale = await manager.isCacheStale(fileName, new Date());
      expect(isStale).toBe(true);
    });
  });

  describe('Progress Notifications', () => {
    it('should emit progress events', async () => {
      const progressEvents: any[] = [];
      
      manager.on('progress', (event) => {
        progressEvents.push(event);
      });
      
      const taskId = await manager.createCacheTask('/test/folder', ['file1.xlsx']);
      
      await manager.updateTaskProgress(taskId, {
        status: 'processing',
        progress: 1,
        total: 1,
        currentFile: 'file1.xlsx'
      });
      
      expect(progressEvents.length).toBeGreaterThan(0);
      expect(progressEvents[0]).toMatchObject({
        taskId,
        progress: expect.any(Number)
      });
    });

    it('should emit completion events', async () => {
      const completionEvents: any[] = [];
      
      manager.on('complete', (event) => {
        completionEvents.push(event);
      });
      
      const taskId = await manager.createCacheTask('/test/folder', ['file1.xlsx']);
      
      await manager.updateTaskProgress(taskId, {
        status: 'completed',
        progress: 1,
        total: 1,
        currentFile: null
      });
      
      expect(completionEvents.length).toBe(1);
      expect(completionEvents[0]).toMatchObject({
        taskId,
        status: 'completed'
      });
    });
  });
});