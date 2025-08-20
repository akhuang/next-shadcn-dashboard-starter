import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import redis from '@/lib/redis';

// POST - 从 Redis 同步导航数据到 PostgreSQL
export async function POST(req: NextRequest) {
  try {
    // 从 Redis 获取导航数据
    const navigationDataJson = await redis.get('navigation:data');

    if (!navigationDataJson) {
      return NextResponse.json(
        { error: 'No navigation data found in Redis' },
        { status: 404 }
      );
    }

    const navigationCategories = JSON.parse(navigationDataJson);
    let totalItems = 0;
    let syncedItems = 0;

    // 遍历所有分类和项目
    for (const category of navigationCategories) {
      for (const item of category.items) {
        totalItems++;

        try {
          // 更新或创建导航项
          await prisma.navigationItem.upsert({
            where: { id: item.id },
            update: {
              category: item.category,
              name: item.name,
              url: item.url,
              description: item.description || null,
              isExternal: item.isExternal ?? true,
              sortOrder: item.sortOrder ?? 0,
              updatedAt: new Date()
            },
            create: {
              id: item.id,
              category: item.category,
              name: item.name,
              url: item.url,
              description: item.description || null,
              isExternal: item.isExternal ?? true,
              sortOrder: item.sortOrder ?? 0
            }
          });

          syncedItems++;
        } catch (error) {
          console.error(`Error syncing item ${item.id}:`, error);
        }
      }

      // 更新或创建分类
      await prisma.navigationCategory.upsert({
        where: { name: category.name },
        update: {
          description: null,
          updatedAt: new Date()
        },
        create: {
          name: category.name,
          description: null,
          sortOrder: 0
        }
      });
    }

    return NextResponse.json({
      message: 'Sync completed',
      totalItems,
      syncedItems,
      categories: navigationCategories.length
    });
  } catch (error) {
    console.error('Error syncing navigation data:', error);
    return NextResponse.json(
      { error: 'Failed to sync navigation data' },
      { status: 500 }
    );
  }
}

// GET - 获取同步状态
export async function GET(req: NextRequest) {
  try {
    // 检查 Redis 中的数据
    const redisData = await redis.get('navigation:data');
    const redisLastUpdate = await redis.get('navigation:last_update');

    // 检查 PostgreSQL 中的数据
    const [itemCount, categoryCount] = await Promise.all([
      prisma.navigationItem.count(),
      prisma.navigationCategory.count()
    ]);

    return NextResponse.json({
      redis: {
        hasData: !!redisData,
        lastUpdate: redisLastUpdate ? new Date(redisLastUpdate) : null
      },
      database: {
        itemCount,
        categoryCount
      }
    });
  } catch (error) {
    console.error('Error checking sync status:', error);
    return NextResponse.json(
      { error: 'Failed to check sync status' },
      { status: 500 }
    );
  }
}
