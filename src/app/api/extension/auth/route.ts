import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(_request: NextRequest) {
  try {
    // 内部系统，直接生成 token，无需验证
    const token = await generateToken('internal');

    // 返回 token，添加 CORS 头
    return NextResponse.json(
      {
        token,
        expiresIn: 86400, // 24小时
        permissions: ['contacts:read', 'contacts:search']
      },
      {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type'
        }
      }
    );
  } catch (error) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// 生成 JWT Token
async function generateToken(source: string): Promise<string> {
  // 使用环境变量中的密钥，如果没有则使用默认值（仅用于开发）
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
  );

  const token = await new SignJWT({
    source,
    permissions: ['contacts:read', 'contacts:search']
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1h')
    .sign(secret);

  return token;
}

// OPTIONS 请求处理（CORS）
export async function OPTIONS(_request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-API-Key'
    }
  });
}
