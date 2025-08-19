import { NextRequest } from 'next/server';
import redis, { REDIS_KEYS } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // 发送初始连接成功消息
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );

      // 定期检查数据更新
      const interval = setInterval(async () => {
        try {
          const lastUpdate = await redis.get(REDIS_KEYS.LAST_UPDATE);
          if (lastUpdate) {
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ 
                  type: 'update', 
                  lastUpdate 
                })}\n\n`
              )
            );
          }
        } catch (error) {
          console.error('SSE error:', error);
        }
      }, 5000); // 每5秒检查一次

      // 清理函数
      request.signal.addEventListener('abort', () => {
        clearInterval(interval);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
}