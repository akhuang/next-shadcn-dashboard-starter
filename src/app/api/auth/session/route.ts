import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/verify';
import { cookies } from 'next/headers';
import { prisma } from '@/lib/prisma';
import { logger } from '@/lib/logger';

export async function GET() {
  try {
    // 优先尝试 JWT session
    const session = await getSession();

    if (session) {
      return NextResponse.json({ user: session }, { status: 200 });
    }

    // 如果没有 JWT session，检查 mock-user-id（开发环境）
    const cookieStore = await cookies();
    const mockUserId = cookieStore.get('mock-user-id')?.value;

    if (mockUserId) {
      // 从数据库获取 mock 用户信息
      const user = await prisma.user.findUnique({
        where: { id: mockUserId }
      });

      if (user) {
        return NextResponse.json(
          {
            user: {
              username: user.username,
              displayName: user.displayName,
              email: user.email,
              department: user.department
            }
          },
          { status: 200 }
        );
      }
    }

    return NextResponse.json({ user: null }, { status: 200 });
  } catch (error) {
    logger.error('Session API error:', error);
    return NextResponse.json({ user: null }, { status: 200 });
  }
}
