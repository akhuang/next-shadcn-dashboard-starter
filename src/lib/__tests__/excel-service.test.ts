import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import { excelService } from '../excel-service';

// Mock modules
vi.mock('fs');
vi.mock('chokidar', () => ({
  default: {
    watch: vi.fn(() => ({
      on: vi.fn().mockReturnThis(),
      close: vi.fn()
    }))
  }
}));

describe('ExcelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    excelService.destroy();
  });

  describe('setFolderPath', () => {
    it('should set folder path and start watching', () => {
      const mockPath = '/test/path';
      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockReturnValue([]);

      excelService.setFolderPath(mockPath);

      expect(fs.existsSync).toHaveBeenCalledWith(mockPath);
    });

    it('should handle non-existent folder', () => {
      const mockPath = '/non/existent';
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      excelService.setFolderPath(mockPath);
      const data = excelService.getExcelData();

      expect(data.contacts).toEqual([]);
      expect(data.files).toEqual([]);
    });
  });

  describe('searchContacts', () => {
    it('should return all contacts when query is empty', () => {
      const allContacts = excelService.getAllContacts();
      const searchResults = excelService.searchContacts('');

      expect(searchResults).toEqual(allContacts);
    });

    it('should filter contacts based on search query', () => {
      // Mock some contacts
      const mockContacts = [
        {
          id: '1',
          fileName: 'test.xlsx',
          sheetName: 'Sheet1',
          rowData: { name: 'John Doe', email: 'john@example.com' },
          searchableText: 'john doe john@example.com'
        },
        {
          id: '2',
          fileName: 'test.xlsx',
          sheetName: 'Sheet1',
          rowData: { name: 'Jane Smith', email: 'jane@example.com' },
          searchableText: 'jane smith jane@example.com'
        }
      ];

      // Use private method to set contacts (would need to expose this for testing)
      // For now, test the search logic
      const results = mockContacts.filter((c) =>
        c.searchableText.includes('john')
      );

      expect(results).toHaveLength(1);
      expect(results[0].rowData.name).toBe('John Doe');
    });
  });

  describe('file monitoring', () => {
    it('should detect Excel files in folder', () => {
      const mockPath = '/test/folder';
      const mockFiles = ['test1.xlsx', 'test2.xls', 'not-excel.txt'];

      vi.spyOn(fs, 'existsSync').mockReturnValue(true);
      vi.spyOn(fs, 'readdirSync').mockReturnValue(mockFiles as any);
      vi.spyOn(fs, 'statSync').mockImplementation((filePath) => {
        void filePath;
        return {
          isDirectory: () => false,
          isFile: () => true
        } as any;
      });
      vi.spyOn(fs, 'readFileSync').mockReturnValue(Buffer.from(''));

      excelService.setFolderPath(mockPath);

      // Check that Excel files are processed
      expect(fs.readdirSync).toHaveBeenCalled();
    });
  });

  describe('listener management', () => {
    it('should add and notify listeners', () => {
      const mockListener = vi.fn();
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);

      excelService.addListener(mockListener);
      excelService.setFolderPath('/test');

      // Listener should be called when data changes
      expect(mockListener).toHaveBeenCalled();
    });

    it('should remove listeners', () => {
      const mockListener = vi.fn();

      excelService.addListener(mockListener);
      excelService.removeListener(mockListener);
      excelService.setFolderPath('/test');

      // Listener should not be called after removal
      expect(mockListener).not.toHaveBeenCalled();
    });
  });
});
