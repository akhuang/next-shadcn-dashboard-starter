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
  title?: string; // 顶部合并的大标题（如有）
  totalRows?: number; // 数据行总数（不包含表头），某些缓存/分页接口会提供
}

export interface ExcelData {
  contacts: Contact[];
  lastUpdated: Date;
  files: string[];
  sheetInfoMap?: Record<string, Record<string, SheetInfo>>; // fileName -> sheetName -> SheetInfo
}
