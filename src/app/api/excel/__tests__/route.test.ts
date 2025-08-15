import { describe, it, expect, beforeEach, vi } from 'vitest';
import { GET } from '../route';
import { NextRequest } from 'next/server';

// Mock the excel service
vi.mock('@/lib/excel-service', () => ({
  excelService: {
    setFolderPath: vi.fn(),
    searchContacts: vi.fn(() => []),
    getExcelData: vi.fn(() => ({
      contacts: [],
      lastUpdated: new Date(),
      files: []
    }))
  }
}));

describe('Excel API Route', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('GET /api/excel', () => {
    it('should set folder path when action=setFolder', async () => {
      const url = new URL(
        'http://localhost:3000/api/excel?action=setFolder&folderPath=/test/path'
      );
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should return error when folder path is missing', async () => {
      const url = new URL('http://localhost:3000/api/excel?action=setFolder');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Folder path is required');
    });

    it('should search contacts when action=search', async () => {
      const url = new URL(
        'http://localhost:3000/api/excel?action=search&query=test'
      );
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
      expect(data.total).toBeDefined();
    });

    it('should get all data by default', async () => {
      const url = new URL('http://localhost:3000/api/excel');
      const request = new NextRequest(url);

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });
  });
});
