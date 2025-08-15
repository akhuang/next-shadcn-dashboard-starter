import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactWorkspace from '../contact-workspace';
import { KBarProvider } from 'kbar';

// Mock fetch API
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock EventSource
const mockEventSource = {
  onopen: vi.fn(),
  onmessage: vi.fn(),
  onerror: vi.fn(),
  close: vi.fn()
};
global.EventSource = vi.fn(() => mockEventSource);

// Mock IntersectionObserver
const mockIntersectionObserver = vi.fn();
global.IntersectionObserver = mockIntersectionObserver;
mockIntersectionObserver.mockReturnValue({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
});

// Mock data with more than 50 contacts to test scrolling
const generateMockData = (count: number) => ({
  contacts: Array.from({ length: count }, (_, i) => ({
    id: `contact-${i}`,
    fileName: '测试数据.xlsx',
    sheetName: '联系人',
    rowData: {
      姓名: `联系人${i}`,
      电话: `1380000${String(i).padStart(4, '0')}`,
      邮箱: `contact${i}@test.com`,
      公司: `测试公司${i}`,
      职位: i % 3 === 0 ? '经理' : i % 2 === 0 ? '主管' : '专员'
    },
    searchableText: `联系人${i} 1380000${String(i).padStart(4, '0')} contact${i}@test.com 测试公司${i}`
  })),
  lastUpdated: new Date().toISOString(),
  files: ['测试数据.xlsx']
});

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <KBarProvider actions={[]}>{children}</KBarProvider>
);

describe('ContactWorkspace', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response with 100 contacts
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: generateMockData(100) })
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Infinite Scrolling', () => {
    it('should initially display only 50 contacts', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        // Wait for data to load
        expect(screen.getByText('联系人0')).toBeInTheDocument();
      });

      // Should show "显示 50 / 100 条记录"
      expect(screen.getByText(/显示 50 \/ 100 条记录/)).toBeInTheDocument();

      // Should show scroll hint
      expect(screen.getByText(/向下滚动加载更多/)).toBeInTheDocument();
    });

    it('should load more contacts when scrolling near bottom', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('联系人0')).toBeInTheDocument();
      });

      // Find the scrollable container
      const scrollContainer =
        document.querySelector('[data-testid="scroll-container"]') ||
        document.querySelector('.overflow-auto');

      expect(scrollContainer).toBeInTheDocument();

      if (scrollContainer) {
        // Mock scroll to near bottom
        Object.defineProperty(scrollContainer, 'scrollTop', {
          value: 1000,
          writable: true
        });
        Object.defineProperty(scrollContainer, 'scrollHeight', {
          value: 1200,
          writable: true
        });
        Object.defineProperty(scrollContainer, 'clientHeight', {
          value: 800,
          writable: true
        });

        // Trigger scroll event
        fireEvent.scroll(scrollContainer);

        // Wait for loading indicator
        await waitFor(() => {
          expect(screen.getByText('正在加载更多...')).toBeInTheDocument();
        });

        // Wait for more data to load
        await waitFor(
          () => {
            expect(
              screen.getByText(/显示 100 \/ 100 条记录/)
            ).toBeInTheDocument();
          },
          { timeout: 1000 }
        );
      }
    });

    it('should show end-of-data indicator when all data is loaded', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('联系人0')).toBeInTheDocument();
      });

      // Simulate loading all data
      const scrollContainer = document.querySelector('.overflow-auto');
      if (scrollContainer) {
        // Trigger multiple scroll events to load all data
        for (let i = 0; i < 3; i++) {
          Object.defineProperty(scrollContainer, 'scrollTop', {
            value: 1000 * (i + 1),
            writable: true
          });
          Object.defineProperty(scrollContainer, 'scrollHeight', {
            value: 1200 * (i + 1),
            writable: true
          });
          Object.defineProperty(scrollContainer, 'clientHeight', {
            value: 800,
            writable: true
          });
          fireEvent.scroll(scrollContainer);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Should show end indicator
        await waitFor(
          () => {
            expect(
              screen.getByText(/已显示全部 100 条数据/)
            ).toBeInTheDocument();
          },
          { timeout: 2000 }
        );
      }
    });
  });

  describe('Layout and Scrolling Structure', () => {
    it('should have proper flex layout for scrolling', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('联系人0')).toBeInTheDocument();
      });

      // Check main container has proper height
      const mainContainer = document.querySelector('.h-full.flex.flex-col');
      expect(mainContainer).toBeInTheDocument();

      // Check scrollable area exists
      const scrollArea = document.querySelector('.overflow-auto');
      expect(scrollArea).toBeInTheDocument();

      // Check table container has proper classes for scrolling
      expect(scrollArea).toHaveClass('flex-1', 'overflow-auto', 'min-h-0');
    });

    it('should handle empty state correctly', async () => {
      // Mock empty data
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: { contacts: [], files: [] } })
      });

      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('选择一个数据源开始查看')).toBeInTheDocument();
      });
    });

    it('should handle error state correctly', async () => {
      // Mock API error
      mockFetch.mockRejectedValue(new Error('API Error'));

      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      // Should still render the component
      expect(
        screen.getByText(/使用右上角搜索框可搜索联系人数据/)
      ).toBeInTheDocument();

      consoleSpy.mockRestore();
    });
  });

  describe('File and Sheet Navigation', () => {
    it('should display file list with contact counts', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        // Should show file name without extension
        expect(screen.getByText('测试数据')).toBeInTheDocument();
        // Should show sheet count and contact count
        expect(screen.getByText(/1 个分类 · 100 条记录/)).toBeInTheDocument();
      });
    });

    it('should switch between files correctly', async () => {
      // Mock data with multiple files
      const multiFileData = {
        contacts: [
          ...generateMockData(50).contacts.map((c) => ({
            ...c,
            fileName: '客户数据.xlsx'
          })),
          ...generateMockData(30).contacts.map((c) => ({
            ...c,
            fileName: '员工数据.xlsx',
            sheetName: '员工'
          }))
        ],
        lastUpdated: new Date().toISOString(),
        files: ['客户数据.xlsx', '员工数据.xlsx']
      };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true, data: multiFileData })
      });

      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('客户数据')).toBeInTheDocument();
        expect(screen.getByText('员工数据')).toBeInTheDocument();
      });

      // Click on employee data file
      const employeeFileButton = screen.getByText('员工数据').closest('button');
      if (employeeFileButton) {
        fireEvent.click(employeeFileButton);

        await waitFor(() => {
          // Should show employee data statistics
          expect(screen.getByText(/显示 30 \/ 30 条记录/)).toBeInTheDocument();
        });
      }
    });
  });

  describe('Export Functionality', () => {
    it('should have export button available', async () => {
      render(
        <TestWrapper>
          <ContactWorkspace />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('联系人0')).toBeInTheDocument();
      });

      // Export button should be present and not disabled
      const exportButtons = screen.getAllByRole('button');
      const exportButton = exportButtons.find(
        (btn) => btn.querySelector('svg') && !btn.hasAttribute('disabled')
      );
      expect(exportButton).toBeInTheDocument();
    });
  });
});
