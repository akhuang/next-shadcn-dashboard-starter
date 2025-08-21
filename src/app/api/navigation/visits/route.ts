import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { logger } from '@/lib/logger';

// 获取当前用户
async function getCurrentUser() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('mock-user-id')?.value;

  if (!userId) {
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@company.com' }
    });
    return testUser;
  }

  return await prisma.user.findUnique({
    where: { id: userId }
  });
}

// POST - 记录访问
export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { itemId } = await req.json();

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // 更新或创建访问记录
    const visit = await prisma.navigationVisit.upsert({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId
        }
      },
      update: {
        count: { increment: 1 },
        lastVisitAt: new Date()
      },
      create: {
        userId: user.id,
        itemId,
        count: 1,
        lastVisitAt: new Date()
      },
      include: { item: true }
    });

    return NextResponse.json({
      message: 'Visit recorded',
      visit
    });
  } catch (error) {
    logger.error('Error recording visit:', error);
    return NextResponse.json(
      { error: 'Failed to record visit' },
      { status: 500 }
    );
  }
}

// DELETE - 清空访问记录
export async function DELETE() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // 删除用户的所有访问记录
    await prisma.navigationVisit.deleteMany({
      where: { userId: user.id }
    });

    return NextResponse.json({
      message: 'Visit history cleared'
    });
  } catch (error) {
    logger.error('Error clearing visits:', error);
    return NextResponse.json(
      { error: 'Failed to clear visits' },
      { status: 500 }
    );
  }
}
