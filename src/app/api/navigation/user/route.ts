import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// 模拟获取当前用户（后续替换为真实认证）
async function getCurrentUser() {
  // 从 cookie 获取模拟用户 ID
  const cookieStore = await cookies();
  const userId = cookieStore.get('mock-user-id')?.value;

  if (!userId) {
    // 如果没有 cookie，返回默认测试用户
    const testUser = await prisma.user.findFirst({
      where: { email: 'test@company.com' }
    });

    if (!testUser) {
      // 创建测试用户
      return await prisma.user.create({
        data: {
          email: 'test@company.com',
          username: 'testuser',
          displayName: '测试用户',
          department: '技术部'
        }
      });
    }

    return testUser;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  return user;
}

// GET - 获取用户数据（收藏和访问记录）
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // 获取用户收藏
    const favorites = await prisma.navigationFavorite.findMany({
      where: { userId: user.id },
      include: { item: true },
      orderBy: { createdAt: 'desc' }
    });

    // 获取最近访问记录（最近20条）
    const visits = await prisma.navigationVisit.findMany({
      where: { userId: user.id },
      include: { item: true },
      orderBy: { lastVisitAt: 'desc' },
      take: 20
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName
      },
      favorites: favorites.map((f) => f.item),
      recentVisits: visits.map((v) => ({
        ...v.item,
        visitCount: v.count,
        lastVisitAt: v.lastVisitAt
      }))
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}
