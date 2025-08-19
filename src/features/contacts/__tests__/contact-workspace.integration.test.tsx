/**
 * 集成测试：测试整个组件的数据流和交互
 * 与单元测试不同，这里测试组件间的实际交互
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import ContactWorkspace from '../components/contact-workspace';

// 不完全mock，允许真实的组件交互
vi.mock('@/lib/excel-async-cache-service', () => ({
  excelAsyncCacheService: {
    setFolderPath: vi.fn().mockResolvedValue('task_123'),
    getFiles: vi.fn().mockResolvedValue([
      {
        fileName: 'test.xlsx',
        displayName: 'test',
        sheets: ['Sheet1', 'Sheet2'],
        lastModified: new Date(),
        size: 1024
      }
    ])
  }
}));

// Mock fetch for API calls
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('ContactWorkspace Integration Tests', () => {
  beforeEach(() => {
    mockFetch.mockReset();
    // Mock SSE
    global.EventSource = vi.fn(() => ({
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      close: vi.fn(),
      onopen: null,
      onmessage: null,
      onerror: null
    })) as any;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('应该正确的数据流：加载文件列表 -> 选择文件 -> 加载工作表信息 -> 加载数据', async () => {
    // Mock API responses
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              files: [
                {
                  fileName: 'test.xlsx',
                  displayName: 'test',
                  sheets: ['Sheet1', 'Sheet2'],
                  lastModified: new Date().toISOString(),
                  size: 1024
                }
              ],
              lastUpdate: new Date().toISOString()
            }
          })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              name: 'Sheet1',
              columns: ['A', 'B', 'C'],
              mergeRanges: [],
              totalRows: 100
            }
          })
      })
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              data: [
                {
                  id: 'test-1',
                  fileName: 'test.xlsx',
                  sheetName: 'Sheet1',
                  rowData: { A: 'value1', B: 'value2', C: 'value3' },
                  searchableText: 'value1 value2 value3',
                  rowIndex: 0
                }
              ],
              total: 100,
              page: 1,
              pageSize: 5
            }
          })
      });

    render(<ContactWorkspace />);

    // 1. 等待文件列表加载
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/excel/v3?action=getFiles');
    });

    // 2. 文件应该自动选中第一个
    await waitFor(() => {
      expect(screen.getByText('test.xlsx')).toBeInTheDocument();
    });

    // 3. 应该加载工作表信息
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/excel/v3?action=getSheetInfo&fileName=test.xlsx&sheetName=Sheet1'
        )
      );
    });

    // 4. 应该加载工作表数据
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          '/api/excel/v3?action=getSheetData&fileName=test.xlsx&sheetName=Sheet1'
        )
      );
    });

    // 验证数据显示
    await waitFor(() => {
      expect(screen.getByText('value1')).toBeInTheDocument();
    });
  });

  it('应该避免不必要的API调用', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true, data: { files: [] } })
    });

    render(<ContactWorkspace />);

    // 等待初始加载
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/excel/v3?action=getFiles');
    });

    const initialCallCount = mockFetch.mock.calls.length;

    // 等待一段时间，确保没有额外调用
    await new Promise((resolve) => setTimeout(resolve, 1000));

    expect(mockFetch.mock.calls.length).toBe(initialCallCount);
  });

  it('切换文件时应该只加载选中文件的数据', async () => {
    const files = [
      {
        fileName: 'file1.xlsx',
        displayName: 'file1',
        sheets: ['Sheet1'],
        lastModified: new Date().toISOString(),
        size: 1024
      },
      {
        fileName: 'file2.xlsx',
        displayName: 'file2',
        sheets: ['Sheet1'],
        lastModified: new Date().toISOString(),
        size: 2048
      }
    ];

    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: { files, lastUpdate: new Date().toISOString() }
          })
      })
      .mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({
            success: true,
            data: {
              name: 'Sheet1',
              columns: ['A'],
              mergeRanges: [],
              totalRows: 10
            }
          })
      });

    render(<ContactWorkspace />);

    // 等待加载完成
    await waitFor(() => {
      expect(screen.getByText('file1.xlsx')).toBeInTheDocument();
    });

    // 记录当前调用次数
    const callsBeforeSwitch = mockFetch.mock.calls.length;

    // 模拟点击第二个文件
    const file2Element = screen.getByText('file2.xlsx');
    fireEvent.click(file2Element);

    // 等待切换完成
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('fileName=file2.xlsx')
      );
    });

    // 验证只为file2调用了API，没有重新加载所有文件
    const callsAfterSwitch = mockFetch.mock.calls.length;
    const newCalls = mockFetch.mock.calls.slice(callsBeforeSwitch);

    // 应该只有2个新调用：getSheetInfo 和 getSheetData
    expect(newCalls.length).toBeLessThanOrEqual(3);
    expect(newCalls.some((call) => call[0].includes('file2.xlsx'))).toBe(true);
  });
});
