import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DataTable } from '@/components/ui/table/data-table';
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

const mockContacts = [
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
];

// 测试组件直接使用DataTable
function TestTableComponent() {
  const columns = createContactColumns(['姓名', '邮箱', '电话']);

  const { table } = useDataTable({
    data: mockContacts,
    columns,
    pageCount: 1,
    shallow: false,
    debounceMs: 300,
    initialState: {
      sorting: [],
      columnFilters: [],
      columnVisibility: {}
    }
  });

  // 输出调试信息
  console.log('表格行数:', table.getRowModel().rows.length);
  console.log('列数:', table.getAllColumns().length);
  console.log('第一行数据:', table.getRowModel().rows[0]?.original);

  return (
    <div data-testid='table-container' style={{ height: '400px' }}>
      <div>表格行数: {table.getRowModel().rows.length}</div>
      <div>列数: {table.getAllColumns().length}</div>
      <DataTable table={table} />
    </div>
  );
}

describe('直接DataTable测试', () => {
  it('应该显示表格数据', async () => {
    render(<TestTableComponent />);

    // 先检查调试信息
    screen.debug();

    // 检查基本信息
    expect(screen.getByText('表格行数: 2')).toBeInTheDocument();
    expect(screen.getByText('列数: 3')).toBeInTheDocument();

    // 检查表头是否存在
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('邮箱')).toBeInTheDocument();
    expect(screen.getByText('电话')).toBeInTheDocument();

    // 检查数据行 - 使用更宽松的查找
    const zhangsan = screen.queryByText('张三');
    const email = screen.queryByText('zhangsan@example.com');
    const phone = screen.queryByText('13800138000');

    console.log('找到张三:', zhangsan);
    console.log('找到邮箱:', email);
    console.log('找到电话:', phone);

    // 如果没找到数据，检查是否显示"No results"
    const noResults = screen.queryByText('No results.');
    console.log('No results显示:', noResults);

    if (noResults) {
      throw new Error('表格显示"No results"而不是实际数据');
    }

    expect(zhangsan).toBeInTheDocument();
    expect(email).toBeInTheDocument();
    expect(phone).toBeInTheDocument();
  });
});
