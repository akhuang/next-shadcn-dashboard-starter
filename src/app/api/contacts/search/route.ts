import { NextRequest, NextResponse } from 'next/server';
import { excelService } from '@/lib/excel-service';

// OPTIONS 请求处理（CORS）
export async function OPTIONS(request: NextRequest) {
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
    const { query, limit = 10 } = body;

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // 使用 Excel 服务搜索
    const searchResults = excelService.searchContacts(query);

    // 返回结果，添加 CORS 头
    return NextResponse.json(
      {
        results: searchResults.slice(0, limit),
        total: searchResults.length,
        suggestion:
          searchResults.length === 0
            ? `未找到"${query}"的结果，请尝试其他关键词`
            : searchResults.length > 10
              ? `找到${searchResults.length}条结果，请尝试更精确的搜索词`
              : undefined
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
    console.error('Search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
