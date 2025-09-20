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

// Mock use-debounce
vi.mock('use-debounce', () => ({
  useDebouncedCallback: (fn: any) => fn
}));

// Test data that matches actual structure
const mockContacts = [
  {
    id: '1',
    fileName: 'customers.xlsx',
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
    fileName: 'customers.xlsx',
    sheetName: 'Sheet1',
    rowData: {
      姓名: '李四',
      邮箱: 'lisi@example.com',
      电话: '13900139000'
    },
    searchableText: '李四 lisi@example.com 13900139000'
  },
  {
    id: '3',
    fileName: 'customers.xlsx',
    sheetName: 'Sheet1',
    rowData: {
      姓名: '王五',
      邮箱: 'wangwu@example.com',
      电话: '13700137000'
    },
    searchableText: '王五 wangwu@example.com 13700137000'
  }
];

describe('ContactWorkspace Table Data Integration', () => {
  it('should create table with contact data correctly', () => {
    const columns = createContactColumns(['姓名', '邮箱', '电话']);

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
    expect(result.current.table.getRowModel().rows).toHaveLength(3);

    // Check that data is accessible through the table
    const firstRow = result.current.table.getRowModel().rows[0];
    expect(firstRow.original.id).toBe('1');
    expect(firstRow.original.rowData['姓名']).toBe('张三');
  });

  it('should handle column data extraction correctly', () => {
    const columns = createContactColumns(['姓名', '邮箱']);

    // Test accessorFn for name column
    const nameColumn = columns.find((col) => col.id === '姓名');
    expect(nameColumn).toBeDefined();

    if (nameColumn && nameColumn.accessorFn) {
      const nameValue = nameColumn.accessorFn(mockContacts[0]);
      expect(nameValue).toBe('张三');
    }

    // Test accessorFn for email column
    const emailColumn = columns.find((col) => col.id === '邮箱');
    expect(emailColumn).toBeDefined();

    if (emailColumn && emailColumn.accessorFn) {
      const emailValue = emailColumn.accessorFn(mockContacts[1]);
      expect(emailValue).toBe('lisi@example.com');
    }
  });

  it('should verify table renders rows correctly', () => {
    const columns = createContactColumns(['姓名', '邮箱', '电话']);

    const { result } = renderHook(() =>
      useDataTable({
        data: mockContacts,
        columns,
        pageCount: 1,
        shallow: false,
        debounceMs: 300
      })
    );

    const table = result.current.table;
    const rows = table.getRowModel().rows;

    expect(rows).toHaveLength(3);

    // Check that each row has the right data
    expect(rows[0].original.rowData['姓名']).toBe('张三');
    expect(rows[1].original.rowData['姓名']).toBe('李四');
    expect(rows[2].original.rowData['姓名']).toBe('王五');

    // Check pagination state
    expect(table.getPageCount()).toBe(1);
    expect(table.getCanPreviousPage()).toBe(false);
    expect(table.getCanNextPage()).toBe(false);
  });

  it('should handle empty columns array', () => {
    const columns = createContactColumns([]);

    const { result } = renderHook(() =>
      useDataTable({
        data: mockContacts,
        columns,
        pageCount: 1,
        shallow: false,
        debounceMs: 300
      })
    );

    expect(result.current.table).toBeDefined();
    expect(result.current.table.getAllColumns()).toHaveLength(0);
  });
});
