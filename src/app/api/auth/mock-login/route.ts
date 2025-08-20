import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

// POST - 模拟登录
export async function POST(req: NextRequest) {
  try {
    const { email, username } = await req.json();

    if (!email && !username) {
      return NextResponse.json(
        { error: 'Email or username is required' },
        { status: 400 }
      );
    }

    // 查找或创建用户
    let user = await prisma.user.findFirst({
      where: {
        OR: [{ email: email || '' }, { username: username || '' }]
      }
    });

    if (!user) {
      // 创建新用户
      user = await prisma.user.create({
        data: {
          email: email || `${username}@company.com`,
          username: username || email?.split('@')[0] || 'user',
          displayName: username || email?.split('@')[0] || 'User',
          department: '技术部'
        }
      });
    }

    // 设置 cookie
    const cookieStore = await cookies();
    cookieStore.set('mock-user-id', user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return NextResponse.json({
      message: 'Logged in successfully',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName
      }
    });
  } catch (error) {
    console.error('Error during mock login:', error);
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}

// GET - 获取当前登录用户
export async function GET(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get('mock-user-id')?.value;

    if (!userId) {
      return NextResponse.json({ error: 'Not logged in' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        displayName: user.displayName,
        department: user.department
      }
    });
  } catch (error) {
    console.error('Error fetching current user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user' },
      { status: 500 }
    );
  }
}

// DELETE - 登出
export async function DELETE(req: NextRequest) {
  try {
    const cookieStore = await cookies();
    cookieStore.delete('mock-user-id');

    return NextResponse.json({
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error during logout:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
