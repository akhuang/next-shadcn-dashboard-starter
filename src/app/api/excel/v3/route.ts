import { NextRequest, NextResponse } from 'next/server';
import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'setFolder': {
        const folderPath = searchParams.get('folderPath');
        if (!folderPath) {
          return NextResponse.json(
            { error: 'Folder path is required' },
            { status: 400 }
          );
        }
        const taskId = await excelAsyncCacheService.setFolderPath(folderPath);
        return NextResponse.json({
          success: true,
          taskId,
          message: 'Folder path set, data is being cached in background'
        });
      }

      case 'getFiles': {
        const files = await excelAsyncCacheService.getFiles();
        const lastUpdate = await excelAsyncCacheService.getLastUpdate();
        return NextResponse.json({
          success: true,
          data: {
            files,
            lastUpdate
          }
        });
      }

      case 'getCacheStatus': {
        const status = await excelAsyncCacheService.getCacheStatus();
        return NextResponse.json({
          success: true,
          data: status
        });
      }

      case 'getTaskStatus': {
        const taskId = searchParams.get('taskId');
        if (!taskId) {
          return NextResponse.json(
            { error: 'Task ID is required' },
            { status: 400 }
          );
        }
        const status = await excelAsyncCacheService.getTaskStatus(taskId);
        return NextResponse.json({
          success: true,
          data: status
        });
      }

      case 'getSheets': {
        const fileName = searchParams.get('fileName');
        if (!fileName) {
          return NextResponse.json(
            { error: 'File name is required' },
            { status: 400 }
          );
        }
        const sheets = await excelAsyncCacheService.getFileSheets(fileName);
        return NextResponse.json({
          success: true,
          data: sheets
        });
      }

      case 'getSheetInfo': {
        const fileName = searchParams.get('fileName');
        const sheetName = searchParams.get('sheetName');
        if (!fileName || !sheetName) {
          return NextResponse.json(
            { error: 'File name and sheet name are required' },
            { status: 400 }
          );
        }
        const info = await excelAsyncCacheService.getSheetInfo(fileName, sheetName);
        return NextResponse.json({
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
          return NextResponse.json(
            { error: 'File name and sheet name are required' },
            { status: 400 }
          );
        }
        
        const result = await excelAsyncCacheService.getSheetData(
          fileName,
          sheetName,
          page,
          pageSize
        );
        return NextResponse.json({
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
        return NextResponse.json({
          success: true,
          data: result
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}