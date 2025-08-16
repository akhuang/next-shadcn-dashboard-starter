import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExcelTable from '../excel-table';

describe('ExcelTable - 合并单元格功能', () => {
  const mockContacts = [
    {
      id: '1',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: {
        姓名: '张三',
        部门: '技术部',
        职位: '工程师',
        电话: '13800138000'
      },
      searchableText: '张三 技术部 工程师 13800138000'
    },
    {
      id: '2',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: {
        姓名: '李四',
        部门: '技术部', // 相同部门，应该合并
        职位: '经理',
        电话: '13800138001'
      },
      searchableText: '李四 技术部 经理 13800138001'
    },
    {
      id: '3',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: {
        姓名: '王五',
        部门: '销售部',
        职位: '销售',
        电话: '13800138002'
      },
      searchableText: '王五 销售部 销售 13800138002'
    }
  ];

  const mockColumns = ['姓名', '部门', '职位', '电话'];

  // 合并信息：部门列的第1-2行应该合并（都是"技术部"）
  const mockMergeRanges = [
    {
      startRow: 0,
      endRow: 1,
      startCol: 1, // 部门列
      endCol: 1
    }
  ];

  it('应该正确渲染基本表格', () => {
    render(<ExcelTable contacts={mockContacts} columns={mockColumns} />);

    // 检查表头
    expect(screen.getByText('姓名')).toBeInTheDocument();
    expect(screen.getByText('部门')).toBeInTheDocument();
    expect(screen.getByText('职位')).toBeInTheDocument();
    expect(screen.getByText('电话')).toBeInTheDocument();

    // 检查数据
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
    expect(screen.getByText('王五')).toBeInTheDocument();
  });

  it('应该正确处理合并单元格的rowSpan', () => {
    render(
      <ExcelTable
        contacts={mockContacts}
        columns={mockColumns}
        mergeRanges={mockMergeRanges}
      />
    );

    // 获取所有的部门单元格
    const deptCells = screen.getAllByText('技术部');

    // 第一个技术部单元格应该有rowSpan=2
    const firstTechDeptCell = deptCells[0].closest('td');
    expect(firstTechDeptCell).toHaveAttribute('rowSpan', '2');

    // 应该只渲染一个"技术部"单元格（因为第二个被合并了）
    expect(deptCells).toHaveLength(1);
  });

  it('应该正确处理空数据', () => {
    render(<ExcelTable contacts={[]} columns={mockColumns} />);

    expect(screen.getByText('暂无数据')).toBeInTheDocument();
  });

  it('应该正确处理水平合并（colSpan）', () => {
    const horizontalMergeRanges = [
      {
        startRow: 0,
        endRow: 0,
        startCol: 0,
        endCol: 1 // 姓名和部门列合并
      }
    ];

    render(
      <ExcelTable
        contacts={mockContacts}
        columns={mockColumns}
        mergeRanges={horizontalMergeRanges}
      />
    );

    // 第一行的姓名单元格应该有colSpan=2
    const nameCell = screen.getByText('张三').closest('td');
    expect(nameCell).toHaveAttribute('colSpan', '2');
  });

  it('应该正确计算相同值的连续单元格进行自动合并', () => {
    const autoMergeContacts = [
      {
        id: '1',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        rowData: { 部门: '技术部', 项目: 'A项目' },
        searchableText: '技术部 A项目'
      },
      {
        id: '2',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        rowData: { 部门: '技术部', 项目: 'A项目' },
        searchableText: '技术部 A项目'
      },
      {
        id: '3',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        rowData: { 部门: '技术部', 项目: 'B项目' },
        searchableText: '技术部 B项目'
      }
    ];

    render(
      <ExcelTable
        contacts={autoMergeContacts}
        columns={['部门', '项目']}
        enableAutoMerge={true}
      />
    );

    // 部门列应该合并所有3行
    const deptCells = screen.getAllByText('技术部');
    expect(deptCells).toHaveLength(1);
    expect(deptCells[0].closest('td')).toHaveAttribute('rowSpan', '3');

    // 项目列前两行应该合并
    const projectACells = screen.getAllByText('A项目');
    expect(projectACells).toHaveLength(1);
    expect(projectACells[0].closest('td')).toHaveAttribute('rowSpan', '2');
  });

  it('应该正确应用合并单元格的样式', () => {
    render(
      <ExcelTable
        contacts={mockContacts}
        columns={mockColumns}
        mergeRanges={mockMergeRanges}
      />
    );

    const mergedCell = screen.getAllByText('技术部')[0].closest('td');

    // 检查合并单元格的样式类
    expect(mergedCell).toHaveClass('align-middle');
    expect(mergedCell).toHaveClass('text-center');
  });
});
