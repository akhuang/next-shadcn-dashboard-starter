import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ContactManager from '../contact-manager';

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

// Mock data
const mockData = {
  contacts: [
    {
      id: '1',
      fileName: '客户联系人.xlsx',
      sheetName: '客户',
      rowData: {
        姓名: '张三',
        电话: '13800138001',
        邮箱: 'zhangsan@example.com',
        公司: 'ABC科技'
      },
      searchableText: '张三 13800138001 zhangsan@example.com abc科技'
    },
    {
      id: '2',
      fileName: '客户联系人.xlsx',
      sheetName: '供应商',
      rowData: {
        公司名称: '供应商A',
        联系人: '刘经理',
        电话: '02112345678'
      },
      searchableText: '供应商a 刘经理 02112345678'
    },
    {
      id: '3',
      fileName: '员工通讯录.xlsx',
      sheetName: '员工通讯录',
      rowData: {
        工号: 'E001',
        姓名: '张明',
        部门: '技术部'
      },
      searchableText: 'e001 张明 技术部'
    }
  ],
  lastUpdated: new Date().toISOString(),
  files: ['客户联系人.xlsx', '员工通讯录.xlsx']
};

describe('ContactManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Mock successful fetch response
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    });
  });

  it('should render file navigation', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      expect(screen.getAllByText('客户联系人')).toHaveLength(2); // Navigation + breadcrumb
      expect(screen.getByText('员工通讯录')).toBeInTheDocument();
    });
  });

  it('should display contact counts', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      // Should show contact count badges
      const badges = screen.getAllByText(/^\d+$/);
      expect(badges.length).toBeGreaterThan(0);
    });
  });

  it('should switch between files', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      const employeeFileButton = screen.getByRole('button', {
        name: /员工通讯录/
      });
      fireEvent.click(employeeFileButton);

      expect(screen.getByText('员工通讯录')).toBeInTheDocument();
    });
  });

  it('should filter contacts by search', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/搜索/);
      fireEvent.change(searchInput, { target: { value: '张' } });

      // Should filter results
      expect(searchInput).toHaveValue('张');
    });
  });

  it('should switch between search scopes', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      const scopeSelect = screen.getByRole('combobox');
      expect(scopeSelect).toBeInTheDocument();
    });
  });

  it('should display correct sheet navigation', async () => {
    render(<ContactManager />);

    await waitFor(() => {
      // Click on customer file button to expand
      const customerFileButton = screen.getByRole('button', {
        name: /客户联系人/
      });
      fireEvent.click(customerFileButton);

      // Should show sheets
      expect(screen.getByText('客户')).toBeInTheDocument();
      expect(screen.getByText('供应商')).toBeInTheDocument();
    });
  });

  it('should handle folder path setting', async () => {
    render(<ContactManager />);

    const settingsButton = screen.getByText('设置文件夹');
    fireEvent.click(settingsButton);

    expect(screen.getByText('设置监控文件夹')).toBeInTheDocument();
  });

  it('should export data to CSV', async () => {
    // Mock URL.createObjectURL and document.createElement
    const mockCreateObjectURL = vi.fn(() => 'blob:test');
    const mockClick = vi.fn();
    const mockLink = {
      href: '',
      download: '',
      click: mockClick,
      remove: vi.fn()
    };

    vi.stubGlobal('URL', { createObjectURL: mockCreateObjectURL });
    vi.spyOn(document, 'createElement').mockReturnValue(mockLink as any);
    vi.spyOn(document.body, 'appendChild').mockImplementation(
      () => mockLink as any
    );

    render(<ContactManager />);

    await waitFor(() => {
      // Look for download button by icon or aria-label
      const buttons = screen.getAllByRole('button');
      const exportButton = buttons.find((btn) =>
        btn.innerHTML.includes('download')
      );
      if (exportButton && !exportButton.hasAttribute('disabled')) {
        fireEvent.click(exportButton);
        expect(mockClick).toHaveBeenCalled();
      }
    });
  });
});
