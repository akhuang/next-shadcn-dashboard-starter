export interface MergeRange {
  startRow: number;
  endRow: number;
  startCol: number;
  endCol: number;
}

export interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
  rowIndex?: number; // 原始行索引
}

export interface SheetInfo {
  name: string;
  contacts: Contact[];
  columns: string[];
  mergeRanges: MergeRange[]; // Sheet的合并单元格信息
}

export interface ExcelData {
  contacts: Contact[];
  lastUpdated: Date;
  files: string[];
  sheetInfoMap?: Record<string, SheetInfo>; // fileName -> sheetName -> SheetInfo
}
