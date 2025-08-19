import { NextRequest } from 'next/server';
import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';
import { excelWorkerManager } from '@/lib/excel-worker-manager';
import redis, { REDIS_KEYS } from '@/lib/redis';

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Send initial connection success
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ 
          type: 'connected',
          timestamp: new Date().toISOString()
        })}\n\n`)
      );

      // Send initial cache status
      const initialStatus = await excelAsyncCacheService.getCacheStatus();
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ 
          type: 'cache_status',
          data: initialStatus,
          timestamp: new Date().toISOString()
        })}\n\n`)
      );

      // Listen to worker manager events
      const progressHandler = (event: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'task_progress',
            data: event,
            timestamp: new Date().toISOString()
          })}\n\n`)
        );
      };

      const completeHandler = (event: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'task_complete',
            data: event,
            timestamp: new Date().toISOString()
          })}\n\n`)
        );
      };

      const errorHandler = (event: any) => {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ 
            type: 'task_error',
            data: event,
            timestamp: new Date().toISOString()
          })}\n\n`)
        );
      };

      excelWorkerManager.on('progress', progressHandler);
      excelWorkerManager.on('complete', completeHandler);
      excelWorkerManager.on('error', errorHandler);

      // Periodic status updates
      const interval = setInterval(async () => {
        try {
          const status = await excelAsyncCacheService.getCacheStatus();
          const lastUpdate = await redis.get(REDIS_KEYS.LAST_UPDATE);
          
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'cache_status',
              data: {
                ...status,
                lastUpdate
              },
              timestamp: new Date().toISOString()
            })}\n\n`)
          );

          // Send heartbeat
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'heartbeat',
              timestamp: new Date().toISOString()
            })}\n\n`)
          );
        } catch (error) {
          console.error('SSE status update error:', error);
        }
      }, 3000); // Every 3 seconds

      // Cleanup function
      const cleanup = () => {
        clearInterval(interval);
        excelWorkerManager.off('progress', progressHandler);
        excelWorkerManager.off('complete', completeHandler);
        excelWorkerManager.off('error', errorHandler);
      };

      request.signal.addEventListener('abort', () => {
        cleanup();
        controller.close();
      });

      // Handle client disconnect after a timeout
      setTimeout(() => {
        if (!request.signal.aborted) {
          cleanup();
          controller.close();
        }
      }, 5 * 60 * 1000); // 5 minutes timeout
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    }
  });
}