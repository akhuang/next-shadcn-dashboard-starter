'use client';

import { ColumnDef } from '@tanstack/react-table';
import { DataTableColumnHeader } from '@/components/ui/table/data-table-column-header';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

export function createContactColumns(
  columnNames: string[]
): ColumnDef<Contact>[] {
  return columnNames.map((columnName) => ({
    id: columnName,
    accessorFn: (row) => row.rowData[columnName] || '',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={columnName} />
    ),
    cell: ({ getValue }) => {
      const value = getValue() as string;
      return (
        <div className='max-w-[200px] truncate' title={value}>
          {value || '-'}
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true
  }));
}
