import { NextRequest, NextResponse } from 'next/server';
import { excelService } from '@/lib/excel-service';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');
  const query = searchParams.get('query');
  const folderPath = searchParams.get('folderPath');

  try {
    switch (action) {
      case 'setFolder':
        if (!folderPath) {
          return NextResponse.json(
            { error: 'Folder path is required' },
            { status: 400 }
          );
        }
        excelService.setFolderPath(folderPath);
        return NextResponse.json({
          success: true,
          data: excelService.getExcelData()
        });

      case 'search':
        const searchResults = excelService.searchContacts(query || '');
        return NextResponse.json({
          success: true,
          data: searchResults,
          total: searchResults.length
        });

      case 'getData':
      default:
        return NextResponse.json({
          success: true,
          data: excelService.getExcelData()
        });
    }
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
