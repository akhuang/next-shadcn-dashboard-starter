import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDataTable } from '@/hooks/use-data-table';
import { createContactColumns } from '../contact-table-columns';

// Mock nuqs
vi.mock('nuqs', () => ({
  parseAsInteger: {
    withOptions: () => ({
      withDefault: (defaultValue: number) => ({
        default: defaultValue
      })
    })
  },
  parseAsArrayOf: () => ({
    withOptions: () => ({})
  }),
  parseAsString: {
    withOptions: () => ({})
  },
  useQueryState: vi.fn(() => [1, vi.fn()]),
  useQueryStates: vi.fn(() => [{}, vi.fn()])
}));

// Mock useDebouncedCallback
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn
}));

const mockContacts = [
  {
    id: '1',
    fileName: 'test.xlsx',
    sheetName: 'Sheet1',
    rowData: { Name: 'John', Email: 'john@test.com' },
    searchableText: 'John john@test.com'
  },
  {
    id: '2',
    fileName: 'test.xlsx',
    sheetName: 'Sheet1',
    rowData: { Name: 'Jane', Email: 'jane@test.com' },
    searchableText: 'Jane jane@test.com'
  }
];

describe('Contact Table Configuration', () => {
  it('should create table with correct configuration', () => {
    const columns = createContactColumns(['Name', 'Email']);

    const { result } = renderHook(() =>
      useDataTable({
        data: mockContacts,
        columns,
        pageCount: Math.ceil(mockContacts.length / 10),
        shallow: false,
        debounceMs: 300
      })
    );

    expect(result.current.table).toBeDefined();
    expect(result.current.table.getRowModel().rows).toHaveLength(2);
  });

  it('should handle empty data correctly', () => {
    const columns = createContactColumns(['Name', 'Email']);

    const { result } = renderHook(() =>
      useDataTable({
        data: [],
        columns,
        pageCount: 0,
        shallow: false,
        debounceMs: 300
      })
    );

    expect(result.current.table).toBeDefined();
    expect(result.current.table.getRowModel().rows).toHaveLength(0);
  });

  it('should use correct page configuration', () => {
    const columns = createContactColumns(['Name']);
    const largeDataSet = Array.from({ length: 25 }, (_, i) => ({
      id: String(i + 1),
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: { Name: `User ${i + 1}` },
      searchableText: `User ${i + 1}`
    }));

    const { result } = renderHook(() =>
      useDataTable({
        data: largeDataSet,
        columns,
        pageCount: Math.ceil(largeDataSet.length / 10),
        shallow: false,
        debounceMs: 300
      })
    );

    expect(result.current.table).toBeDefined();
    // 应该只显示第一页的数据（由于分页）
    expect(result.current.table.getRowModel().rows.length).toBeLessThanOrEqual(
      10
    );
  });
});
