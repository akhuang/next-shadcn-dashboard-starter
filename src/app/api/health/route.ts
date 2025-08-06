import { NextResponse } from 'next/server';

export async function GET() {
  // 基础健康检查
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    node: process.version,

    // 内存使用情况
    memory: {
      rss: Math.round(process.memoryUsage().rss / 1024 / 1024) + ' MB',
      heapTotal:
        Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB',
      heapUsed:
        Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
      external: Math.round(process.memoryUsage().external / 1024 / 1024) + ' MB'
    },

    // 检查关键服务（可扩展）
    services: {
      database: 'not_configured', // 如果有数据库，在这里检查连接
      cache: 'not_configured' // 如果有缓存服务，在这里检查
    }
  };

  // 返回健康状态
  return NextResponse.json(health, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      Pragma: 'no-cache',
      Expires: '0'
    }
  });
}

// HEAD 请求支持（用于简单的健康检查）
export async function HEAD() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    }
  });
}
