'use client';

import { useEffect } from 'react';

export function PlausibleScript() {
  useEffect(() => {
    // 动态获取当前域名（包含端口）
    const domain = window.location.host;

    // 检查是否已经加载了脚本
    if (document.getElementById('plausible-script')) {
      return;
    }

    // 创建 script 元素
    const script = document.createElement('script');
    script.id = 'plausible-script';
    script.defer = true;
    script.async = true;
    script.setAttribute('data-domain', domain);
    script.setAttribute('data-api', '/api/event');
    script.src = '/js/script.js';

    // 添加到 head
    document.head.appendChild(script);

    console.log(`Plausible Analytics loaded for domain: ${domain}`);
  }, []);

  return null;
}
