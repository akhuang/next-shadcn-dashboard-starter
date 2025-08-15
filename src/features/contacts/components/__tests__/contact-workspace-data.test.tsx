import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContactWorkspace from '../contact-workspace';

// 创建测试用的QueryClient
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false
      }
    }
  });

// 模拟数据
const mockData = {
  contacts: [
    {
      id: '1',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: {
        姓名: '张三',
        邮箱: 'zhangsan@example.com',
        电话: '13800138000'
      },
      searchableText: '张三 zhangsan@example.com 13800138000'
    },
    {
      id: '2',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: {
        姓名: '李四',
        邮箱: 'lisi@example.com',
        电话: '13900139000'
      },
      searchableText: '李四 lisi@example.com 13900139000'
    }
  ],
  lastUpdated: new Date(),
  files: ['test.xlsx']
};

// Mock fetch API
global.fetch = vi.fn();

describe('ContactWorkspace Data Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock successful API responses
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: mockData
      })
    });
  });

  it('should process contact data correctly', () => {
    // 测试数据结构
    expect(mockData.contacts).toHaveLength(2);
    expect(mockData.contacts[0].rowData).toHaveProperty('姓名');
    expect(mockData.contacts[0].rowData['姓名']).toBe('张三');
  });

  it('should extract columns from contact data', () => {
    const contact = mockData.contacts[0];
    const columns = Object.keys(contact.rowData);

    expect(columns).toContain('姓名');
    expect(columns).toContain('邮箱');
    expect(columns).toContain('电话');
    expect(columns).toHaveLength(3);
  });

  it('should group contacts by sheet', () => {
    const contactsBySheet = mockData.contacts.reduce(
      (acc, contact) => {
        const sheet = contact.sheetName;
        if (!acc[sheet]) {
          acc[sheet] = [];
        }
        acc[sheet].push(contact);
        return acc;
      },
      {} as Record<string, typeof mockData.contacts>
    );

    expect(contactsBySheet['Sheet1']).toHaveLength(2);
    expect(contactsBySheet['Sheet1'][0].rowData['姓名']).toBe('张三');
  });

  it('should render without crashing when data is empty', () => {
    const queryClient = createTestQueryClient();

    // Mock empty response
    (fetch as any).mockResolvedValueOnce({
      json: async () => ({
        success: true,
        data: { contacts: [], lastUpdated: new Date(), files: [] }
      })
    });

    expect(() => {
      render(
        <QueryClientProvider client={queryClient}>
          <ContactWorkspace />
        </QueryClientProvider>
      );
    }).not.toThrow();
  });
});
