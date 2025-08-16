import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ExcelTable from '../excel-table';
import { Contact, MergeRange } from '@/types/excel';

describe('ExcelTable - 真实合并单元格显示', () => {
  const mockContacts: Contact[] = [
    {
      id: '1',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: { A: 'A1', B: 'B1', C: 'C1', D: 'D1' },
      searchableText: 'A1 B1 C1 D1',
      rowIndex: 0
    },
    {
      id: '2',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: { A: 'A2', B: 'B2', C: 'C2', D: 'D2' },
      searchableText: 'A2 B2 C2 D2',
      rowIndex: 1
    },
    {
      id: '3',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: { A: 'A3', B: 'B3', C: 'C3', D: 'D3' },
      searchableText: 'A3 B3 C3 D3',
      rowIndex: 2
    },
    {
      id: '4',
      fileName: 'test.xlsx',
      sheetName: 'Sheet1',
      rowData: { A: 'A4', B: 'B4', C: 'C4', D: 'D4' },
      searchableText: 'A4 B4 C4 D4',
      rowIndex: 3
    }
  ];

  const mockColumns = ['A', 'B', 'C', 'D'];

  it('应该正确显示传入的合并单元格', () => {
    const mergeRanges: MergeRange[] = [
      { startRow: 0, endRow: 1, startCol: 0, endCol: 0 }, // A1-A2 合并
      { startRow: 0, endRow: 0, startCol: 1, endCol: 2 }, // B1-C1 合并
      { startRow: 2, endRow: 3, startCol: 2, endCol: 3 } // C3-D4 合并
    ];

    render(
      <ExcelTable
        contacts={mockContacts}
        columns={mockColumns}
        mergeRanges={mergeRanges}
        enableAutoMerge={false}
      />
    );

    // 检查A1单元格应该有rowSpan=2
    const a1Cell = screen.getByText('A1').closest('td');
    expect(a1Cell).toHaveAttribute('rowSpan', '2');

    // 检查B1单元格应该有colSpan=2
    const b1Cell = screen.getByText('B1').closest('td');
    expect(b1Cell).toHaveAttribute('colSpan', '2');

    // 检查C3单元格应该有rowSpan=2和colSpan=2
    const c3Cell = screen.getByText('C3').closest('td');
    expect(c3Cell).toHaveAttribute('rowSpan', '2');
    expect(c3Cell).toHaveAttribute('colSpan', '2');

    // A2单元格应该不存在（被合并了）
    const a2Cells = screen.queryAllByText('A2');
    // A2的数据可能被复制到合并单元格中，所以检查独立的td
    const allCells = screen.getAllByRole('cell');
    const a2IndependentCell = allCells.find(
      (cell) => cell.textContent === 'A2' && !cell.hasAttribute('rowSpan')
    );
    expect(a2IndependentCell).toBeUndefined();
  });

  it('应该正确跳过被合并的单元格', () => {
    const mergeRanges: MergeRange[] = [
      { startRow: 0, endRow: 1, startCol: 0, endCol: 1 } // A1-B2 大合并
    ];

    const { container } = render(
      <ExcelTable
        contacts={mockContacts}
        columns={mockColumns}
        mergeRanges={mergeRanges}
        enableAutoMerge={false}
      />
    );

    // 第一行应该有: 行号 + A1(合并) + C1 + D1 = 4个单元格
    const firstRow = container.querySelectorAll('tbody tr')[0];
    const firstRowCells = firstRow.querySelectorAll('td');
    expect(firstRowCells.length).toBe(4); // 行号 + A1(2x2) + C1 + D1

    // 第二行应该有: 行号 + C2 + D2 = 3个单元格（A2和B2被跳过）
    const secondRow = container.querySelectorAll('tbody tr')[1];
    const secondRowCells = secondRow.querySelectorAll('td');
    expect(secondRowCells.length).toBe(3); // 行号 + C2 + D2
  });

  it('不应该自动合并相同值的单元格当enableAutoMerge为false', () => {
    const contactsWithSameValues: Contact[] = [
      {
        id: '1',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        rowData: { A: 'Same', B: 'B1' },
        searchableText: 'Same B1',
        rowIndex: 0
      },
      {
        id: '2',
        fileName: 'test.xlsx',
        sheetName: 'Sheet1',
        rowData: { A: 'Same', B: 'B2' },
        searchableText: 'Same B2',
        rowIndex: 1
      }
    ];

    render(
      <ExcelTable
        contacts={contactsWithSameValues}
        columns={['A', 'B']}
        mergeRanges={[]}
        enableAutoMerge={false}
      />
    );

    // 应该有两个独立的"Same"单元格，没有合并
    const sameCells = screen.getAllByText('Same');
    expect(sameCells).toHaveLength(2);

    // 都不应该有rowSpan属性
    sameCells.forEach((cell) => {
      const td = cell.closest('td');
      expect(td).not.toHaveAttribute('rowSpan');
    });
  });
});
