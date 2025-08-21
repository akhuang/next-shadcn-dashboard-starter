import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET - 获取所有导航项
export async function GET(_req: NextRequest) {
  try {
    const items = await prisma.navigationItem.findMany({
      where: { isActive: true },
      orderBy: [{ category: 'asc' }, { sortOrder: 'asc' }, { name: 'asc' }]
    });

    // 按分类组织数据
    const categorizedItems = items.reduce(
      (acc, item) => {
        if (!acc[item.category]) {
          acc[item.category] = [];
        }
        acc[item.category].push(item);
        return acc;
      },
      {} as Record<string, typeof items>
    );

    const categories = Object.entries(categorizedItems).map(
      ([name, items]) => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        items
      })
    );

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching navigation items:', error);
    return NextResponse.json(
      { error: 'Failed to fetch navigation items' },
      { status: 500 }
    );
  }
}

// POST - 同步导航项（从 Excel 导入）
export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { items } = data;

    if (!Array.isArray(items)) {
      return NextResponse.json(
        { error: 'Invalid data format' },
        { status: 400 }
      );
    }

    // 批量更新或创建
    const results = await Promise.all(
      items.map((item) =>
        prisma.navigationItem.upsert({
          where: { id: item.id },
          update: {
            category: item.category,
            name: item.name,
            url: item.url,
            description: item.description,
            isExternal: item.isExternal ?? true,
            sortOrder: item.sortOrder ?? 0
          },
          create: {
            id: item.id,
            category: item.category,
            name: item.name,
            url: item.url,
            description: item.description,
            isExternal: item.isExternal ?? true,
            sortOrder: item.sortOrder ?? 0
          }
        })
      )
    );

    return NextResponse.json({
      message: 'Navigation items synced successfully',
      count: results.length
    });
  } catch (error) {
    console.error('Error syncing navigation items:', error);
    return NextResponse.json(
      { error: 'Failed to sync navigation items' },
      { status: 500 }
    );
  }
}
