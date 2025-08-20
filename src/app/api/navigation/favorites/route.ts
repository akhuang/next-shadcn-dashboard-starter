import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

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

// POST - 添加收藏
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

    // 检查是否已收藏
    const existing = await prisma.navigationFavorite.findUnique({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId
        }
      }
    });

    if (existing) {
      return NextResponse.json(
        { message: 'Already favorited' },
        { status: 200 }
      );
    }

    // 添加收藏
    const favorite = await prisma.navigationFavorite.create({
      data: {
        userId: user.id,
        itemId
      },
      include: { item: true }
    });

    return NextResponse.json({
      message: 'Added to favorites',
      favorite
    });
  } catch (error) {
    console.error('Error adding favorite:', error);
    return NextResponse.json(
      { error: 'Failed to add favorite' },
      { status: 500 }
    );
  }
}

// DELETE - 取消收藏
export async function DELETE(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // 删除收藏
    await prisma.navigationFavorite.delete({
      where: {
        userId_itemId: {
          userId: user.id,
          itemId
        }
      }
    });

    return NextResponse.json({
      message: 'Removed from favorites'
    });
  } catch (error) {
    console.error('Error removing favorite:', error);
    return NextResponse.json(
      { error: 'Failed to remove favorite' },
      { status: 500 }
    );
  }
}
