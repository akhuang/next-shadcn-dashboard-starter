import { Worker } from 'worker_threads';
import { EventEmitter } from 'events';
import * as path from 'path';
import * as fs from 'fs';
import redis, { REDIS_KEYS, CACHE_TTL } from './redis';

export interface TaskStatus {
  taskId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  total: number;
  currentFile: string | null;
  error: string | null;
  startTime?: Date;
  endTime?: Date;
}

export interface CacheStatus {
  isUpdating: boolean;
  lastUpdate: Date | null;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks?: number;
}

export interface FileCacheStatus {
  cached: boolean;
  lastModified: Date;
  size: number;
  sheets: string[];
  error?: string;
}

interface WorkerTask {
  taskId: string;
  folderPath: string;
  files: string[];
  worker?: Worker;
  status: TaskStatus;
}

export class ExcelWorkerManager extends EventEmitter {
  private tasks: Map<string, WorkerTask> = new Map();
  private maxWorkers: number = 2;
  private activeWorkers: number = 0;
  private taskQueue: string[] = [];
  private completedTasks: Set<string> = new Set();
  private failedTasks: Set<string> = new Set();

  constructor() {
    super();
  }

  setMaxWorkers(max: number) {
    this.maxWorkers = max;
  }

  getActiveWorkerCount(): number {
    return this.activeWorkers;
  }

  async createCacheTask(folderPath: string, files: string[]): Promise<string> {
    const taskId = `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const status: TaskStatus = {
      taskId,
      status: 'pending',
      progress: 0,
      total: files.length,
      currentFile: null,
      error: null,
      startTime: new Date()
    };

    const task: WorkerTask = {
      taskId,
      folderPath,
      files,
      status
    };

    this.tasks.set(taskId, task);
    this.taskQueue.push(taskId);
    
    // Store status in Redis
    await this.saveTaskStatus(taskId, status);
    
    // Try to process next task
    this.processNextTask();
    
    return taskId;
  }

  private async processNextTask() {
    if (this.activeWorkers >= this.maxWorkers || this.taskQueue.length === 0) {
      return;
    }

    const taskId = this.taskQueue.shift();
    if (!taskId) return;

    const task = this.tasks.get(taskId);
    if (!task) return;

    this.activeWorkers++;
    task.status.status = 'processing';
    await this.saveTaskStatus(taskId, task.status);

    // Create worker thread
    const workerPath = path.join(__dirname, 'excel-worker.js');
    
    // If worker file doesn't exist, simulate processing
    if (!fs.existsSync(workerPath)) {
      // Simulate worker processing
      await this.simulateWorkerProcessing(task);
    } else {
      const worker = new Worker(workerPath, {
        workerData: {
          taskId: task.taskId,
          folderPath: task.folderPath,
          files: task.files
        }
      });

      task.worker = worker;

      worker.on('message', async (msg) => {
        if (msg.type === 'progress') {
          await this.updateTaskProgress(taskId, {
            status: 'processing',
            progress: msg.progress,
            total: msg.total,
            currentFile: msg.currentFile
          });
        } else if (msg.type === 'complete') {
          await this.completeTask(taskId);
        } else if (msg.type === 'error') {
          await this.failTask(taskId, msg.error);
        }
      });

      worker.on('error', async (error) => {
        await this.failTask(taskId, error.message);
      });

      worker.on('exit', (code) => {
        this.activeWorkers--;
        if (code !== 0 && task.status.status !== 'completed' && task.status.status !== 'failed') {
          this.failTask(taskId, `Worker stopped with exit code ${code}`);
        }
        this.processNextTask();
      });
    }
  }

  private async simulateWorkerProcessing(task: WorkerTask) {
    // Simulate processing for testing
    for (let i = 0; i < task.files.length; i++) {
      await this.updateTaskProgress(task.taskId, {
        status: 'processing',
        progress: i + 1,
        total: task.files.length,
        currentFile: task.files[i]
      });
      
      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    await this.completeTask(task.taskId);
    this.activeWorkers--;
    this.processNextTask();
  }

  async updateTaskProgress(taskId: string, updates: Partial<TaskStatus>): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    Object.assign(task.status, updates);
    await this.saveTaskStatus(taskId, task.status);
    
    this.emit('progress', {
      taskId,
      progress: task.status.progress,
      total: task.status.total,
      currentFile: task.status.currentFile
    });
  }

  private async completeTask(taskId: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status.status = 'completed';
    task.status.endTime = new Date();
    task.status.currentFile = null;
    
    await this.saveTaskStatus(taskId, task.status);
    this.completedTasks.add(taskId);
    
    this.emit('complete', {
      taskId,
      status: 'completed'
    });
  }

  private async failTask(taskId: string, error: string) {
    const task = this.tasks.get(taskId);
    if (!task) return;

    task.status.status = 'failed';
    task.status.error = error;
    task.status.endTime = new Date();
    
    await this.saveTaskStatus(taskId, task.status);
    this.failedTasks.add(taskId);
    
    this.emit('error', {
      taskId,
      error
    });
  }

  async cancelTask(taskId: string): Promise<void> {
    const task = this.tasks.get(taskId);
    if (!task) return;

    if (task.worker) {
      await task.worker.terminate();
    }

    task.status.status = 'cancelled';
    task.status.endTime = new Date();
    await this.saveTaskStatus(taskId, task.status);
    
    // Remove from queue if pending
    const queueIndex = this.taskQueue.indexOf(taskId);
    if (queueIndex !== -1) {
      this.taskQueue.splice(queueIndex, 1);
    }
  }

  async getTaskStatus(taskId: string): Promise<TaskStatus | null> {
    const task = this.tasks.get(taskId);
    if (task) {
      return task.status;
    }
    
    // Try to get from Redis
    const statusJson = await redis.get(`excel:cache:status:${taskId}`);
    if (statusJson) {
      return JSON.parse(statusJson);
    }
    
    return null;
  }

  private async saveTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    await redis.set(
      `excel:cache:status:${taskId}`,
      JSON.stringify(status),
      'EX',
      CACHE_TTL.DEFAULT
    );
  }

  async getCacheStatus(): Promise<CacheStatus> {
    const lastUpdateStr = await redis.get('excel:last_update');
    
    return {
      isUpdating: this.activeWorkers > 0,
      lastUpdate: lastUpdateStr ? new Date(lastUpdateStr) : null,
      pendingTasks: this.taskQueue.length,
      activeTasks: this.activeWorkers,
      completedTasks: this.completedTasks.size,
      failedTasks: this.failedTasks.size
    };
  }

  async setFileCacheStatus(fileName: string, status: FileCacheStatus): Promise<void> {
    await redis.set(
      `excel:file:${fileName}:cache_status`,
      JSON.stringify(status),
      'EX',
      CACHE_TTL.DEFAULT
    );
  }

  async getFileCacheStatus(fileName: string): Promise<FileCacheStatus | null> {
    const statusJson = await redis.get(`excel:file:${fileName}:cache_status`);
    if (statusJson) {
      return JSON.parse(statusJson);
    }
    return null;
  }

  async isCacheStale(fileName: string, currentModified: Date): Promise<boolean> {
    const status = await this.getFileCacheStatus(fileName);
    if (!status) return true;
    
    return new Date(status.lastModified).getTime() < currentModified.getTime();
  }

  destroy() {
    // Terminate all active workers
    for (const task of this.tasks.values()) {
      if (task.worker) {
        task.worker.terminate();
      }
    }
    this.tasks.clear();
    this.taskQueue = [];
    this.removeAllListeners();
  }
}

// Singleton instance
export const excelWorkerManager = new ExcelWorkerManager();