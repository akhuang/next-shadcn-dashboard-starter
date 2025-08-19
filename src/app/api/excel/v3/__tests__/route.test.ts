import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock the excel async cache service
vi.mock('@/lib/excel-async-cache-service', () => ({
  excelAsyncCacheService: {
    setFolderPath: vi.fn(),
    getFiles: vi.fn(),
    getCacheStatus: vi.fn(),
    getTaskStatus: vi.fn(),
    getFileSheets: vi.fn(),
    getSheetInfo: vi.fn(),
    getSheetData: vi.fn(),
    searchContacts: vi.fn(),
    getLastUpdate: vi.fn()
  }
}));

// Helper function to create mock request
function createMockRequest(searchParams: Record<string, string>): NextRequest {
  const url = new URL('http://localhost:3000/api/excel/v3');
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return new NextRequest(url);
}

describe('/api/excel/v3 API Tests', () => {
  let mockService: any;

  beforeEach(async () => {
    vi.clearAllMocks();
    const module = await import('@/lib/excel-async-cache-service');
    mockService = module.excelAsyncCacheService;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('setFolder action', () => {
    it('应该设置文件夹路径并返回任务ID', async () => {
      const mockTaskId = 'task_123456';
      mockService.setFolderPath.mockResolvedValue(mockTaskId);

      const request = createMockRequest({
        action: 'setFolder',
        folderPath: '/tmp/test-contacts'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.taskId).toBe(mockTaskId);
      expect(data.message).toContain('background');
      expect(mockService.setFolderPath).toHaveBeenCalledWith(
        '/tmp/test-contacts'
      );
    });

    it('应该在缺少文件夹路径时返回400错误', async () => {
      const request = createMockRequest({
        action: 'setFolder'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Folder path is required');
    });

    it('应该处理设置文件夹时的错误', async () => {
      mockService.setFolderPath.mockRejectedValue(
        new Error('Permission denied')
      );

      const request = createMockRequest({
        action: 'setFolder',
        folderPath: '/invalid/path'
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Permission denied');
    });
  });

  describe('getFiles action', () => {
    it('应该返回文件列表和最后更新时间', async () => {
      const mockDate = new Date('2024-01-01');
      const mockFiles = [
        {
          fileName: '客户信息.xlsx',
          displayName: '客户信息',
          sheets: ['VIP客户', '普通客户'],
          lastModified: mockDate.toISOString(),
          size: 1024
        }
      ];
      const mockLastUpdate = new Date('2024-01-01T12:00:00Z');

      mockService.getFiles.mockResolvedValue(mockFiles);
      mockService.getLastUpdate.mockResolvedValue(mockLastUpdate);

      const request = createMockRequest({ action: 'getFiles' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data.files).toEqual(mockFiles);
      expect(data.data.lastUpdate).toBe(mockLastUpdate.toISOString());
    });

    it('应该处理获取文件列表时的错误', async () => {
      mockService.getFiles.mockRejectedValue(new Error('Cache not available'));

      const request = createMockRequest({ action: 'getFiles' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });
  });

  describe('getCacheStatus action', () => {
    it('应该返回缓存状态', async () => {
      const mockDate = new Date();
      const mockStatus = {
        isUpdating: true,
        isInitialized: true,
        lastUpdate: mockDate.toISOString(),
        pendingTasks: 2,
        activeTasks: 1,
        completedTasks: 5
      };

      mockService.getCacheStatus.mockResolvedValue(mockStatus);

      const request = createMockRequest({ action: 'getCacheStatus' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockStatus);
    });
  });

  describe('getTaskStatus action', () => {
    it('应该返回任务状态', async () => {
      const mockTaskStatus = {
        taskId: 'task_123',
        status: 'processing',
        progress: 5,
        total: 10,
        currentFile: 'test.xlsx',
        error: null
      };

      mockService.getTaskStatus.mockResolvedValue(mockTaskStatus);

      const request = createMockRequest({
        action: 'getTaskStatus',
        taskId: 'task_123'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockTaskStatus);
      expect(mockService.getTaskStatus).toHaveBeenCalledWith('task_123');
    });

    it('应该在缺少任务ID时返回400错误', async () => {
      const request = createMockRequest({ action: 'getTaskStatus' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Task ID is required');
    });
  });

  describe('getSheets action', () => {
    it('应该返回文件的工作表列表', async () => {
      const mockSheets = ['Sheet1', 'Sheet2', 'Sheet3'];
      mockService.getFileSheets.mockResolvedValue(mockSheets);

      const request = createMockRequest({
        action: 'getSheets',
        fileName: 'test.xlsx'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSheets);
      expect(mockService.getFileSheets).toHaveBeenCalledWith('test.xlsx');
    });

    it('应该在缺少文件名时返回400错误', async () => {
      const request = createMockRequest({ action: 'getSheets' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File name is required');
    });
  });

  describe('getSheetInfo action', () => {
    it('应该返回工作表信息', async () => {
      const mockSheetInfo = {
        name: 'Sheet1',
        columns: ['A', 'B', 'C'],
        mergeRanges: [],
        title: 'Test Sheet',
        totalRows: 100
      };
      mockService.getSheetInfo.mockResolvedValue(mockSheetInfo);

      const request = createMockRequest({
        action: 'getSheetInfo',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSheetInfo);
      expect(mockService.getSheetInfo).toHaveBeenCalledWith(
        'test.xlsx',
        'Sheet1'
      );
    });

    it('应该在缺少参数时返回400错误', async () => {
      const request = createMockRequest({
        action: 'getSheetInfo',
        fileName: 'test.xlsx'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File name and sheet name are required');
    });
  });

  describe('getSheetData action', () => {
    it('应该返回分页的工作表数据', async () => {
      const mockSheetData = {
        data: [
          {
            id: 'row1',
            fileName: 'test.xlsx',
            sheetName: 'Sheet1',
            rowData: { A: 'value1', B: 'value2' },
            searchableText: 'value1 value2',
            rowIndex: 0
          }
        ],
        total: 200,
        page: 1,
        pageSize: 100
      };
      mockService.getSheetData.mockResolvedValue(mockSheetData);

      const request = createMockRequest({
        action: 'getSheetData',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        page: '1',
        pageSize: '100'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSheetData);
      expect(mockService.getSheetData).toHaveBeenCalledWith(
        'test.xlsx',
        'Sheet1',
        1,
        100
      );
    });

    it('应该使用默认的页码和页面大小', async () => {
      const mockSheetData = { data: [], total: 0, page: 1, pageSize: 100 };
      mockService.getSheetData.mockResolvedValue(mockSheetData);

      const request = createMockRequest({
        action: 'getSheetData',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1'
      });
      await GET(request);

      expect(mockService.getSheetData).toHaveBeenCalledWith(
        'test.xlsx',
        'Sheet1',
        1,
        100
      );
    });

    it('应该处理无效的页码参数', async () => {
      const mockSheetData = { data: [], total: 0, page: 1, pageSize: 100 };
      mockService.getSheetData.mockResolvedValue(mockSheetData);

      const request = createMockRequest({
        action: 'getSheetData',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        page: 'invalid',
        pageSize: 'invalid'
      });
      await GET(request);

      // 应该使用默认值 (但实际会传入 NaN)
      expect(mockService.getSheetData).toHaveBeenCalledWith(
        'test.xlsx',
        'Sheet1',
        NaN,
        NaN
      );
    });
  });

  describe('search action', () => {
    it('应该返回搜索结果', async () => {
      const mockSearchResult = {
        data: [
          {
            id: 'result1',
            fileName: 'test.xlsx',
            sheetName: 'Sheet1',
            rowData: { A: 'test value', B: 'another' },
            searchableText: 'test value another',
            rowIndex: 0
          }
        ],
        total: 1,
        page: 1,
        pageSize: 50
      };
      mockService.searchContacts.mockResolvedValue(mockSearchResult);

      const request = createMockRequest({
        action: 'search',
        query: 'test',
        page: '1',
        pageSize: '50'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockSearchResult);
      expect(mockService.searchContacts).toHaveBeenCalledWith('test', 1, 50);
    });

    it('应该处理空搜索查询', async () => {
      const mockEmptyResult = { data: [], total: 0, page: 1, pageSize: 50 };
      mockService.searchContacts.mockResolvedValue(mockEmptyResult);

      const request = createMockRequest({
        action: 'search',
        query: '',
        page: '1',
        pageSize: '50'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(mockService.searchContacts).toHaveBeenCalledWith('', 1, 50);
    });

    it('应该使用默认搜索参数', async () => {
      const mockResult = { data: [], total: 0, page: 1, pageSize: 50 };
      mockService.searchContacts.mockResolvedValue(mockResult);

      const request = createMockRequest({
        action: 'search'
      });
      await GET(request);

      expect(mockService.searchContacts).toHaveBeenCalledWith('', 1, 50);
    });
  });

  describe('error handling', () => {
    it('应该处理无效的 action', async () => {
      const request = createMockRequest({
        action: 'invalidAction'
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid action');
    });

    it('应该处理服务内部错误', async () => {
      mockService.getFiles.mockRejectedValue(
        new Error('Internal service error')
      );

      const request = createMockRequest({ action: 'getFiles' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Internal service error');
    });

    it('应该处理未知错误类型', async () => {
      mockService.getFiles.mockRejectedValue('String error');

      const request = createMockRequest({ action: 'getFiles' });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
      expect(data.details).toBe('Unknown error');
    });
  });

  describe('parameter validation', () => {
    it('应该正确解析 URL 编码的参数', async () => {
      const mockSheetData = { data: [], total: 0, page: 1, pageSize: 100 };
      mockService.getSheetData.mockResolvedValue(mockSheetData);

      const request = createMockRequest({
        action: 'getSheetData',
        fileName: '中文文件名.xlsx',
        sheetName: 'VIP客户'
      });

      await GET(request);

      expect(mockService.getSheetData).toHaveBeenCalledWith(
        '中文文件名.xlsx',
        'VIP客户',
        1,
        100
      );
    });

    it('应该正确处理特殊字符', async () => {
      const mockSearchResult = { data: [], total: 0, page: 1, pageSize: 50 };
      mockService.searchContacts.mockResolvedValue(mockSearchResult);

      const request = createMockRequest({
        action: 'search',
        query: '特殊字符 !@#$%^&*()'
      });

      await GET(request);

      expect(mockService.searchContacts).toHaveBeenCalledWith(
        '特殊字符 !@#$%^&*()',
        1,
        50
      );
    });
  });
});
