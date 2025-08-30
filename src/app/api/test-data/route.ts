import { NextResponse } from 'next/server';
import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';

export async function GET() {
  try {
    // 获取文件列表
    const files = await excelAsyncCacheService.getFiles();
    const lastUpdate = await excelAsyncCacheService.getLastUpdate();

    // 获取第一个文件的第一个工作表数据
    let sheetData = null;
    if (files.length > 0 && files[0].sheets && files[0].sheets.length > 0) {
      sheetData = await excelAsyncCacheService.getSheetData(
        files[0].fileName,
        files[0].sheets[0],
        1,
        10
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        files,
        lastUpdate,
        sheetData,
        debug: {
          filesCount: files.length,
          firstFile: files[0] || null
        }
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
