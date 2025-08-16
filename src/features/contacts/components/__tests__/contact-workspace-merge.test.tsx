import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import ContactWorkspace from '../contact-workspace';
import { vi } from 'vitest';

// Mock the API fetch
global.fetch = vi.fn();
global.EventSource = vi.fn() as any;

describe('ContactWorkspace - 合并单元格集成测试', () => {
  beforeEach(() => {
    // Mock EventSource
    (global.EventSource as any).mockImplementation(() => ({
      onopen: vi.fn(),
      onmessage: vi.fn(),
      onerror: vi.fn(),
      close: vi.fn()
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('应该正确传递合并信息到ExcelTable', async () => {
    const mockData = {
      success: true,
      data: {
        contacts: [
          {
            id: '1',
            fileName: 'test.xlsx',
            sheetName: 'Sheet1',
            rowData: { Col1: 'A1', Col2: 'B1' },
            searchableText: 'A1 B1',
            rowIndex: 0
          },
          {
            id: '2',
            fileName: 'test.xlsx',
            sheetName: 'Sheet1',
            rowData: { Col1: 'A2', Col2: 'B2' },
            searchableText: 'A2 B2',
            rowIndex: 1
          }
        ],
        lastUpdated: new Date().toISOString(),
        files: ['test.xlsx'],
        sheetInfoMap: {
          'test.xlsx': {
            Sheet1: {
              name: 'Sheet1',
              contacts: [],
              columns: ['Col1', 'Col2'],
              mergeRanges: [{ startRow: 0, endRow: 1, startCol: 0, endCol: 0 }]
            }
          }
        }
      }
    };

    (global.fetch as any).mockResolvedValueOnce({
      json: async () => mockData
    });

    const { container } = render(<ContactWorkspace />);

    // 等待数据加载
    await waitFor(
      () => {
        expect(screen.queryByText('暂无数据')).not.toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // 检查数据是否显示
    await waitFor(() => {
      expect(screen.getByText('A1')).toBeInTheDocument();
    });

    // 检查合并单元格属性
    const a1Cell = screen.getByText('A1').closest('td');
    console.log('A1 cell attributes:', {
      rowSpan: a1Cell?.getAttribute('rowSpan'),
      colSpan: a1Cell?.getAttribute('colSpan'),
      className: a1Cell?.className
    });

    // 验证合并信息是否正确应用
    expect(a1Cell).toHaveAttribute('rowSpan', '2');
  });
});
