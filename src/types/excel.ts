export interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

export interface ExcelData {
  contacts: Contact[];
  lastUpdated: Date;
  files: string[];
}
