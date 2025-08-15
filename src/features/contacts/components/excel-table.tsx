'use client';

import React, { useCallback } from 'react';
import '@/styles/excel-table.css';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

interface ExcelTableProps {
  contacts: Contact[];
  columns: string[];
  onExport?: () => void;
}

export default function ExcelTable({
  contacts,
  columns,
  onExport
}: ExcelTableProps) {
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
      console.error('复制失败:', error);
    }
  }, [contacts, columns]);

  return (
    <div className='flex h-full w-full flex-col overflow-hidden bg-white'>
      {/* 表格区域 - 固定高度，内部滚动（支持横向滚动） */}
      <div className='min-h-0 flex-1 overflow-auto overflow-x-auto'>
        {contacts.length > 0 && columns.length > 0 ? (
          <table
            className='w-full min-w-max border-collapse border border-gray-300'
            style={{ tableLayout: 'auto' }}
          >
            <thead className='bg-gray-50'>
              <tr>
                <th className='sticky left-0 z-10 min-w-[3rem] border border-gray-300 bg-gray-50 px-3 py-2 text-left text-sm font-semibold'>
                  #
                </th>
                {columns.map((column, index) => (
                  <th
                    key={index}
                    className='border border-gray-300 px-3 py-2 text-left text-sm font-semibold'
                  >
                    <div className='truncate'>{column}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts.map((contact, rowIndex) => (
                <tr key={contact.id} className='hover:bg-gray-50'>
                  <td className='sticky left-0 z-10 border border-gray-300 bg-white px-3 py-2 text-center text-sm text-gray-500'>
                    {rowIndex + 1}
                  </td>
                  {columns.map((column, colIndex) => (
                    <td
                      key={colIndex}
                      className='border border-gray-300 px-3 py-2 text-sm'
                      title={contact.rowData[column] || ''}
                    >
                      <div className='max-w-xs truncate'>
                        {contact.rowData[column] || ''}
                      </div>
                    </td>
                  ))}
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
