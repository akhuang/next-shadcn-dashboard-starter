import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { act } from '@testing-library/react';
import ContactWorkspace from '../contact-workspace';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
const mockEventSource = {
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  close: vi.fn(),
  onopen: null,
  onmessage: null,
  onerror: null
};

global.EventSource = vi.fn(() => mockEventSource);

// Mock data
const mockFiles = [
  {
    fileName: '01-客户信息.xlsx',
    displayName: '01-客户信息',
    sheets: ['VIP客户', '普通客户'],
    lastModified: new Date(),
    size: 1024
  }
];

const mockSheetInfo = {
  name: 'VIP客户',
  columns: ['客户ID', '公司名称', '联系人', '电话'],
  mergeRanges: [],
  totalRows: 200
};

const mockSheetData = {
  data: [
    {
      id: 'test-1',
      fileName: '01-客户信息.xlsx',
      sheetName: 'VIP客户',
      rowData: {
        客户ID: 'CUS000001',
        公司名称: '测试公司',
        联系人: '张三',
        电话: '13800138001'
      },
      searchableText: 'cus000001 测试公司 张三 13800138001',
      rowIndex: 0
    }
  ],
  total: 200,
  page: 1,
  pageSize: 100
};

const mockSearchResults = {
  data: [
    {
      id: 'test-search-1',
      fileName: '01-客户信息.xlsx',
      sheetName: 'VIP客户',
      rowData: {
        客户ID: 'CUS000001',
        公司名称: '测试公司',
        联系人: '张三',
        电话: '13800138001'
      },
      searchableText: 'cus000001 测试公司 张三 13800138001',
      rowIndex: 0
    }
  ],
  total: 1,
  page: 1,
  pageSize: 50
};

describe('ContactWorkspace - 异步功能测试', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockClear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('初始化和文件夹设置', () => {
    it('应该在设置文件夹后立即显示界面', async () => {
      // 模拟 API 响应
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, taskId: 'task-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: mockFiles } })
        });

      render(<ContactWorkspace />);

      // 应该立即显示界面，不需要等待数据加载
      expect(screen.getByText('Excel 联系人工作台')).toBeInTheDocument();

      // 点击设置按钮
      const settingsButton = screen.getByRole('button', { name: /设置/i });
      fireEvent.click(settingsButton);

      // 等待设置对话框打开
      await waitFor(() => {
        expect(screen.getByText('设置监控文件夹')).toBeInTheDocument();
      });

      // 设置文件夹路径
      const pathInput = screen.getByDisplayValue('/tmp/test-contacts');
      const confirmButton = screen.getByRole('button', { name: '' }); // 文件夹图标按钮

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // 验证 API 调用
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/excel/v3?action=setFolder')
      );
      expect(mockFetch).toHaveBeenCalledWith('/api/excel/v3?action=getFiles');
    });

    it('应该处理设置文件夹时的错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      render(<ContactWorkspace />);

      const settingsButton = screen.getByRole('button', { name: /设置/i });
      fireEvent.click(settingsButton);

      await waitFor(() => {
        expect(screen.getByText('设置监控文件夹')).toBeInTheDocument();
      });

      const confirmButton = screen.getByRole('button', { name: '' });

      await act(async () => {
        fireEvent.click(confirmButton);
      });

      // 应该优雅处理错误，不崩溃
      expect(screen.getByText('Excel 联系人工作台')).toBeInTheDocument();
    });
  });

  describe('分页数据加载', () => {
    beforeEach(() => {
      // 设置默认的 fetch 响应
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, taskId: 'task-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: mockFiles } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSheetInfo })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSheetData })
        });
    });

    it('应该按需加载 Sheet 数据', async () => {
      render(<ContactWorkspace />);

      // 等待初始化完成
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/excel/v3?action=getFiles');
      });

      // 验证加载 Sheet 信息的调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('action=getSheetInfo')
        );
      });

      // 验证加载 Sheet 数据的调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining(
            'action=getSheetData&fileName=01-%E5%AE%A2%E6%88%B7%E4%BF%A1%E6%81%AF.xlsx&sheetName=VIP%E5%AE%A2%E6%88%B7&page=1&pageSize=100'
          )
        );
      });
    });

    it('应该显示分页控件', async () => {
      render(<ContactWorkspace />);

      // 等待数据加载完成
      await waitFor(() => {
        expect(screen.getByText(/共 200 条数据/)).toBeInTheDocument();
      });

      // 验证分页控件
      expect(screen.getByText(/当前第 1 页/)).toBeInTheDocument();
      expect(screen.getByText(/每页 100 条/)).toBeInTheDocument();
      expect(screen.getByText('上一页')).toBeInTheDocument();
      expect(screen.getByText('下一页')).toBeInTheDocument();
      expect(screen.getByText('1 / 2')).toBeInTheDocument();
    });

    it('应该在切换页面时加载新数据', async () => {
      render(<ContactWorkspace />);

      // 等待初始数据加载
      await waitFor(() => {
        expect(screen.getByText(/共 200 条数据/)).toBeInTheDocument();
      });

      // 模拟第二页的数据
      const mockPage2Data = {
        ...mockSheetData,
        page: 2,
        data: [
          {
            ...mockSheetData.data[0],
            id: 'test-2',
            rowData: { ...mockSheetData.data[0].rowData, 客户ID: 'CUS000101' }
          }
        ]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockPage2Data })
      });

      // 点击下一页
      const nextButton = screen.getByText('下一页');
      expect(nextButton).not.toBeDisabled();

      await act(async () => {
        fireEvent.click(nextButton);
      });

      // 验证加载第二页数据的 API 调用
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('page=2')
        );
      });

      // 验证页码显示更新
      expect(screen.getByText(/当前第 2 页/)).toBeInTheDocument();
    });

    it('应该在加载时显示加载状态', async () => {
      render(<ContactWorkspace />);

      // 应该显示加载动画
      expect(screen.getByText('加载中...')).toBeInTheDocument();
      expect(
        screen.getByRole('img', { name: /RefreshCw/i })
      ).toBeInTheDocument();
    });

    it('应该正确处理分页按钮的禁用状态', async () => {
      render(<ContactWorkspace />);

      await waitFor(() => {
        expect(screen.getByText(/共 200 条数据/)).toBeInTheDocument();
      });

      const prevButton = screen.getByText('上一页');
      const nextButton = screen.getByText('下一页');

      // 第一页时上一页按钮应该被禁用
      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('异步搜索功能', () => {
    beforeEach(() => {
      // 设置默认响应
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, taskId: 'task-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: mockFiles } })
        });
    });

    it('应该在输入搜索词时调用搜索 API', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ success: true, data: mockSearchResults })
      });

      render(<ContactWorkspace />);

      const searchInput = screen.getByPlaceholderText('搜索所有数据...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '测试' } });
      });

      // 等待防抖完成和搜索 API 调用
      await waitFor(
        () => {
          expect(mockFetch).toHaveBeenCalledWith(
            expect.stringContaining('action=search&query=%E6%B5%8B%E8%AF%95')
          );
        },
        { timeout: 1000 }
      );
    });

    it('应该显示搜索加载状态', async () => {
      render(<ContactWorkspace />);

      const searchInput = screen.getByPlaceholderText('搜索所有数据...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '测试' } });
      });

      // 在防抖期间应该显示搜索状态
      expect(screen.getByText(/搜索中/)).toBeInTheDocument();
    });

    it('应该处理搜索错误', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Search failed'));

      render(<ContactWorkspace />);

      const searchInput = screen.getByPlaceholderText('搜索所有数据...');

      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '测试' } });
      });

      await waitFor(() => {
        // 应该优雅处理搜索错误，不崩溃应用
        expect(
          screen.getByPlaceholderText('搜索所有数据...')
        ).toBeInTheDocument();
      });
    });

    it('应该清除搜索结果当搜索词为空时', async () => {
      render(<ContactWorkspace />);

      const searchInput = screen.getByPlaceholderText('搜索所有数据...');

      // 先输入搜索词
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '测试' } });
      });

      // 再清除搜索词
      await act(async () => {
        fireEvent.change(searchInput, { target: { value: '' } });
      });

      // 应该回到正常的表格视图
      await waitFor(() => {
        expect(screen.queryByText(/搜索结果/)).not.toBeInTheDocument();
      });
    });
  });

  describe('SSE 实时更新', () => {
    it('应该连接到 SSE 端点', async () => {
      render(<ContactWorkspace />);

      expect(EventSource).toHaveBeenCalledWith('/api/excel/v3/stream');
    });

    it('应该处理缓存状态更新事件', async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, taskId: 'task-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: mockFiles } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: [...mockFiles] } })
        });

      render(<ContactWorkspace />);

      // 模拟 SSE 缓存状态更新事件
      const mockEvent = {
        data: JSON.stringify({
          type: 'cache_status',
          data: { lastUpdate: new Date().toISOString() }
        })
      };

      await act(async () => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage(mockEvent);
        }
      });

      // 应该重新加载文件列表
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('/api/excel/v3?action=getFiles');
      });
    });

    it('应该处理任务完成事件', async () => {
      // 设置初始状态
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, taskId: 'task-123' })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () =>
            Promise.resolve({ success: true, data: { files: mockFiles } })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSheetInfo })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSheetData })
        })
        .mockResolvedValueOnce({
          ok: true,
          json: () => Promise.resolve({ success: true, data: mockSheetData })
        });

      render(<ContactWorkspace />);

      // 等待初始化完成
      await waitFor(() => {
        expect(screen.getByText(/共 200 条数据/)).toBeInTheDocument();
      });

      // 模拟任务完成事件
      const mockEvent = {
        data: JSON.stringify({
          type: 'task_complete',
          data: { taskId: 'task-123' }
        })
      };

      await act(async () => {
        if (mockEventSource.onmessage) {
          mockEventSource.onmessage(mockEvent);
        }
      });

      // 应该重新加载当前 sheet 数据
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          expect.stringContaining('action=getSheetData')
        );
      });
    });

    it('应该在组件卸载时清理 SSE 连接', () => {
      const { unmount } = render(<ContactWorkspace />);

      unmount();

      expect(mockEventSource.close).toHaveBeenCalled();
    });
  });

  describe('错误处理', () => {
    it('应该处理 API 调用失败', async () => {
      mockFetch.mockRejectedValue(new Error('API Error'));

      render(<ContactWorkspace />);

      // 应用应该不会崩溃
      expect(screen.getByText('Excel 联系人工作台')).toBeInTheDocument();
    });

    it('应该处理无效的 API 响应', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: false, error: 'Invalid data' })
      });

      render(<ContactWorkspace />);

      // 应用应该优雅处理错误
      expect(screen.getByText('Excel 联系人工作台')).toBeInTheDocument();
    });

    it('应该处理网络错误', async () => {
      mockFetch.mockRejectedValue(new TypeError('Network request failed'));

      render(<ContactWorkspace />);

      // 应用应该保持稳定
      expect(screen.getByText('Excel 联系人工作台')).toBeInTheDocument();
    });
  });
});
