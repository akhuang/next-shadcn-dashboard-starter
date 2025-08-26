import { NextRequest, NextResponse } from 'next/server';
import { createADAuth } from '@/lib/auth/ldap';
import { createMockAuth } from '@/lib/auth/mock-auth';
import { createToken } from '@/lib/auth/verify';
import { logger } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: '请输入用户名和密码' },
        { status: 400 }
      );
    }

    // Check auth mode from environment
    const authMode = process.env.AUTH_MODE || 'development';
    let user = null;

    if (authMode === 'production') {
      // Use Active Directory authentication in production
      const adAuth = createADAuth();
      user = await adAuth.authenticate(username, password);
    } else {
      // Use mock authentication in development
      const mockAuth = createMockAuth();
      user = await mockAuth.authenticate(username, password);
    }

    if (!user) {
      return NextResponse.json({ error: '用户名或密码错误' }, { status: 401 });
    }

    // Create JWT token
    const token = await createToken({
      username: user.username,
      displayName: user.displayName,
      email: user.email,
      department: user.department,
      groups: user.groups
    });

    // Set cookie
    const response = NextResponse.json(
      {
        success: true,
        user: {
          username: user.username,
          displayName: user.displayName,
          email: user.email,
          department: user.department
        }
      },
      { status: 200 }
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8 // 8 hours
    });

    // 触发前端的 storage 事件以更新 Umami 追踪
    response.headers.set('X-Auth-Status', 'logged-in');

    return response;
  } catch (error) {
    logger.error('Login error:', error);
    return NextResponse.json(
      { error: '登录失败，请检查域控制器连接' },
      { status: 500 }
    );
  }
}
