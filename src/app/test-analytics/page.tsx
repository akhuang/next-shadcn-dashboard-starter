'use client';

import { useEffect } from 'react';

export default function TestAnalyticsPage() {
  useEffect(() => {
    // 检查 plausible 是否加载
    const checkPlausible = () => {
      if (typeof window !== 'undefined' && (window as any).plausible) {
        console.log('✅ Plausible loaded successfully');
        // 手动触发一个事件
        (window as any).plausible('pageview');
        (window as any).plausible('test-event', { props: { test: 'value' } });
        console.log('📊 Test events sent');
      } else {
        console.log('❌ Plausible not loaded yet');
      }
    };

    // 立即检查
    checkPlausible();

    // 延迟检查（等待脚本加载）
    const timer = setTimeout(checkPlausible, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className='p-8'>
      <h1 className='mb-4 text-2xl font-bold'>Analytics Test Page</h1>
      <p>Open browser console to see Plausible status.</p>
      <div className='mt-4 space-y-2'>
        <button
          onClick={() => {
            if ((window as any).plausible) {
              (window as any).plausible('button-click');
              alert('Event sent!');
            } else {
              alert('Plausible not loaded');
            }
          }}
          className='rounded bg-blue-500 px-4 py-2 text-white'
        >
          Send Test Event
        </button>
      </div>
    </div>
  );
}
