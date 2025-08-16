import { NextRequest } from 'next/server';
import { excelService } from '@/lib/excel-service';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // 发送初始数据
      const initialData = excelService.getExcelData();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify(initialData)}\n\n`)
      );

      // 设置监听器
      const listener = (data: any) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch (error) {
          // swallow SSE delivery errors
        }
      };

      excelService.addListener(listener);

      // 定期发送心跳包
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(':heartbeat\n\n'));
        } catch (error) {
          clearInterval(heartbeat);
        }
      }, 30000);

      // 清理函数
      request.signal.addEventListener('abort', () => {
        excelService.removeListener(listener);
        clearInterval(heartbeat);
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  });
}
