import { NextRequest, NextResponse } from 'next/server';
import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';
import { logger } from '@/lib/logger';

// 创建无缓存响应
function createNoCacheResponse(data: any, status: number = 200) {
  return createNoCacheResponse(data, {
    status,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      Pragma: 'no-cache',
      Expires: '0'
    }
  });
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'setFolder': {
        const folderPath = searchParams.get('folderPath');
        if (!folderPath) {
          return createNoCacheResponse(
            { error: 'Folder path is required' },
            400
          );
        }
        const taskId = await excelAsyncCacheService.setFolderPath(folderPath);
        return createNoCacheResponse({
          success: true,
          taskId,
          message: 'Folder path set, data is being cached in background'
        });
      }

      case 'getFiles': {
        const files = await excelAsyncCacheService.getFiles();
        const lastUpdate = await excelAsyncCacheService.getLastUpdate();
        return createNoCacheResponse({
          success: true,
          data: {
            files,
            lastUpdate
          }
        });
      }

      case 'getCacheStatus': {
        const status = await excelAsyncCacheService.getCacheStatus();
        return createNoCacheResponse({
          success: true,
          data: status
        });
      }

      case 'getTaskStatus': {
        const taskId = searchParams.get('taskId');
        if (!taskId) {
          return createNoCacheResponse({ error: 'Task ID is required' }, 400);
        }
        const status = await excelAsyncCacheService.getTaskStatus(taskId);
        return createNoCacheResponse({
          success: true,
          data: status
        });
      }

      case 'getSheets': {
        const fileName = searchParams.get('fileName');
        if (!fileName) {
          return createNoCacheResponse({ error: 'File name is required' }, 400);
        }
        const sheets = await excelAsyncCacheService.getFileSheets(fileName);
        return createNoCacheResponse({
          success: true,
          data: sheets
        });
      }

      case 'getSheetInfo': {
        const fileName = searchParams.get('fileName');
        const sheetName = searchParams.get('sheetName');
        if (!fileName || !sheetName) {
          return createNoCacheResponse(
            { error: 'File name and sheet name are required' },
            400
          );
        }
        const info = await excelAsyncCacheService.getSheetInfo(
          fileName,
          sheetName
        );
        return createNoCacheResponse({
          success: true,
          data: info
        });
      }

      case 'getSheetData': {
        const fileName = searchParams.get('fileName');
        const sheetName = searchParams.get('sheetName');
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '100');

        if (!fileName || !sheetName) {
          return createNoCacheResponse(
            { error: 'File name and sheet name are required' },
            400
          );
        }

        const result = await excelAsyncCacheService.getSheetData(
          fileName,
          sheetName,
          page,
          pageSize
        );
        return createNoCacheResponse({
          success: true,
          data: result
        });
      }

      case 'search': {
        const query = searchParams.get('query') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const pageSize = parseInt(searchParams.get('pageSize') || '50');

        const result = await excelAsyncCacheService.searchContacts(
          query,
          page,
          pageSize
        );
        return createNoCacheResponse({
          success: true,
          data: result
        });
      }

      default:
        return createNoCacheResponse({ error: 'Invalid action' }, 400);
    }
  } catch (error) {
    logger.error('API error:', error);
    return createNoCacheResponse(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      500
    );
  }
}
