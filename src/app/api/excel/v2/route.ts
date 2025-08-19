import { NextRequest, NextResponse } from 'next/server';
import { excelCacheService } from '@/lib/excel-cache-service';

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
        excelCacheService.setFolderPath(folderPath);
        return NextResponse.json({
          success: true,
          message: 'Folder path set, data is being cached'
        });
      }

      case 'getFiles': {
        const files = await excelCacheService.getFiles();
        const lastUpdate = await excelCacheService.getLastUpdate();
        return NextResponse.json({
          success: true,
          data: {
            files,
            lastUpdate
          }
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
        const sheets = await excelCacheService.getFileSheets(fileName);
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
        const info = await excelCacheService.getSheetInfo(fileName, sheetName);
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
        
        const result = await excelCacheService.getSheetData(
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
        
        const result = await excelCacheService.searchContacts(
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