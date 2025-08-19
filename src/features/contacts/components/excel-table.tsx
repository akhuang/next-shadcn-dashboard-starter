'use client';

import React, { useCallback, useMemo } from 'react';
import '@/styles/excel-table.css';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Contact, MergeRange } from '@/types/excel';

interface ExcelTableProps {
  contacts: Contact[];
  columns: string[];
  onExport?: () => void;
  mergeRanges?: MergeRange[];
  enableAutoMerge?: boolean;
}

export default function ExcelTable({
  contacts,
  columns,
  onExport,
  mergeRanges = [],
  enableAutoMerge = false
}: ExcelTableProps) {
  // 计算每列的最小宽度
  const columnMinWidths = useMemo(() => {
    const widths: { [key: string]: number } = {};

    columns.forEach((col) => {
      // 基础宽度：列名长度
      let maxLength = col.length;

      // 检查前10行数据的最大长度
      contacts.slice(0, 10).forEach((contact) => {
        const value = String(contact.rowData[col] || '');
        maxLength = Math.max(maxLength, value.length);
      });

      // 计算宽度：每个字符约8px，中文字符约16px
      // 最小120px，最大400px
      const hasChineseChar =
        /[\u4e00-\u9fa5]/.test(col) ||
        contacts.some((c) =>
          /[\u4e00-\u9fa5]/.test(String(c.rowData[col] || ''))
        );
      const charWidth = hasChineseChar ? 12 : 8;
      const calculatedWidth = Math.min(
        400,
        Math.max(120, maxLength * charWidth + 24)
      ); // +24 for padding

      widths[col] = calculatedWidth;
    });

    return widths;
  }, [columns, contacts]);
  // 计算自动合并的单元格
  const autoMergeRanges = useMemo(() => {
    if (!enableAutoMerge || contacts.length === 0) return [];

    const merges: MergeRange[] = [];

    // 对每一列进行检查
    columns.forEach((col, colIndex) => {
      let startRow = 0;
      let currentValue = contacts[0].rowData[col];

      for (let rowIndex = 1; rowIndex <= contacts.length; rowIndex++) {
        const nextValue = contacts[rowIndex]?.rowData[col];

        // 如果值不同或到达末尾，检查是否需要合并
        if (nextValue !== currentValue || rowIndex === contacts.length) {
          if (rowIndex - startRow > 1) {
            merges.push({
              startRow,
              endRow: rowIndex - 1,
              startCol: colIndex,
              endCol: colIndex
            });
          }
          startRow = rowIndex;
          currentValue = nextValue;
        }
      }
    });

    return merges;
  }, [contacts, columns, enableAutoMerge]);

  // 合并所有的合并范围
  const allMergeRanges = useMemo(() => {
    return [...mergeRanges, ...autoMergeRanges];
  }, [mergeRanges, autoMergeRanges]);

  // 检查单元格是否需要被跳过（因为被合并了）
  const shouldSkipCell = useCallback(
    (rowIndex: number, colIndex: number) => {
      return allMergeRanges.some(
        (range) =>
          rowIndex >= range.startRow &&
          rowIndex <= range.endRow &&
          colIndex >= range.startCol &&
          colIndex <= range.endCol &&
          !(rowIndex === range.startRow && colIndex === range.startCol)
      );
    },
    [allMergeRanges]
  );

  // 获取单元格的合并属性
  const getCellMergeProps = useCallback(
    (rowIndex: number, colIndex: number) => {
      const range = allMergeRanges.find(
        (r) => r.startRow === rowIndex && r.startCol === colIndex
      );

      if (!range) return {};

      const props: any = {};
      const rowSpan = range.endRow - range.startRow + 1;
      const colSpan = range.endCol - range.startCol + 1;

      if (rowSpan > 1) props.rowSpan = rowSpan;
      if (colSpan > 1) props.colSpan = colSpan;

      return props;
    },
    [allMergeRanges]
  );

  const handleCopy = useCallback(() => {
    // 简化复制功能 - 复制当前数据
    if (contacts.length === 0) return;

    try {
      const headers = columns.join('\t');
      const rows = contacts
        .map((contact) =>
          columns.map((col) => contact.rowData[col] || '').join('\t')
        )
        .join('\n');

      const textToCopy = headers + '\n' + rows;
      navigator.clipboard.writeText(textToCopy);
    } catch (error) {
      // ignore copy error
    }
  }, [contacts, columns]);

  return (
    <div className='flex h-full w-full flex-col overflow-hidden bg-white'>
      {/* 表格区域 - 固定高度，内部滚动（支持横向滚动） */}
      <div className='min-h-0 flex-1 overflow-auto'>
        {contacts.length > 0 && columns.length > 0 ? (
          <table
            className='border-collapse border border-gray-300'
            style={{ tableLayout: 'auto', minWidth: 'max-content' }}
          >
            <thead className='bg-gray-50'>
              <tr>
                <th className='sticky left-0 z-10 w-[3.5rem] max-w-[3.5rem] border border-gray-300 bg-gray-50 px-3 py-2 text-left text-sm font-semibold'>
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className='border border-gray-300 px-3 py-2 text-left text-sm font-semibold'
                    style={{ minWidth: `${columnMinWidths[column]}px` }}
                  >
                    <div className='truncate' title={column}>
                      {column}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, rowIndex) => (
                <tr key={contact.id} className='hover:bg-gray-50'>
                  <td className='sticky left-0 z-10 w-[3.5rem] max-w-[3.5rem] border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-500'>
                    {rowIndex + 1}
                  </td>
                  {columns.map((column, colIndex) => {
                    // 检查是否需要跳过这个单元格
                    if (shouldSkipCell(rowIndex, colIndex)) {
                      return null;
                    }

                    // 获取合并属性
                    const mergeProps = getCellMergeProps(rowIndex, colIndex);
                    const isMerged = mergeProps.rowSpan || mergeProps.colSpan;

                    return (
                      <td
                        key={colIndex}
                        className={cn(
                          'border border-gray-300 px-3 py-2 text-sm',
                          isMerged && 'bg-gray-50 text-center align-middle'
                        )}
                        style={{ minWidth: `${columnMinWidths[column]}px` }}
                        title={contact.rowData[column] || ''}
                        {...mergeProps}
                      >
                        <div
                          className={cn('truncate', isMerged && 'text-center')}
                        >
                          {contact.rowData[column] || ''}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className='flex h-full items-center justify-center text-gray-500'>
            <div className='text-center'>
              <div className='mb-2 text-lg'>暂无数据</div>
              <div className='text-sm'>请检查数据源或调整搜索条件</div>
            </div>
          </div>
        )}
      </div>

      {/* 状态栏 - 固定高度 */}
      <div className='flex-shrink-0 border-t bg-gray-50 px-4 py-2 text-xs text-gray-600'>
        <div>
          {columns.length} 列 × {contacts.length} 行
        </div>
      </div>
    </div>
  );
}
