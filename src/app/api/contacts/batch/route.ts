import { NextRequest, NextResponse } from 'next/server';
import { excelService } from '@/lib/excel-service';

// OPTIONS 请求处理（CORS）
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    }
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { queries } = body;

    if (!queries || !Array.isArray(queries)) {
      return NextResponse.json(
        { error: 'Queries array is required' },
        { status: 400 }
      );
    }

    if (queries.length > 100) {
      return NextResponse.json(
        { error: 'Maximum 100 queries allowed per batch' },
        { status: 400 }
      );
    }

    // 执行批量搜索
    const results = queries.map((queryItem) => {
      const matches = excelService.searchContacts(queryItem.query);

      return {
        id: queryItem.id,
        matches: matches.slice(0, 5) // 每个查询最多返回5个结果
      };
    });

    // 返回结果，添加 CORS 头
    return NextResponse.json(
      {
        results
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
      }
    );
  } catch (error) {
    console.error('Batch search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
