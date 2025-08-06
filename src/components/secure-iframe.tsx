'use client';

import { useEffect, useState } from 'react';

interface SecureIframeProps
  extends React.IframeHTMLAttributes<HTMLIFrameElement> {
  src: string;
  fallbackMessage?: string;
}

/**
 * 安全的iframe组件，自动处理HTTP/HTTPS混合内容问题
 *
 * 功能：
 * 1. 自动检测HTTP URL并通过代理转换
 * 2. 支持内网IP地址的HTTP服务
 * 3. 保持原始HTTPS URL不变
 */
export function SecureIframe({
  src,
  fallbackMessage = '无法加载内容',
  ...props
}: SecureIframeProps) {
  const [proxiedSrc, setProxiedSrc] = useState(src);
  const [error, setError] = useState(false);

  useEffect(() => {
    // 解析URL
    try {
      const url = new URL(src, window.location.origin);

      // 如果是HTTP协议且在HTTPS环境下
      if (url.protocol === 'http:' && window.location.protocol === 'https:') {
        // 检查是否是IP地址
        const ipPattern = /^(\d{1,3}\.){3}\d{1,3}$/;
        if (ipPattern.test(url.hostname)) {
          // 通过Nginx代理转换HTTP为HTTPS
          const proxyPath = `/http-proxy/${url.hostname}:${url.port || 80}${url.pathname}${url.search}`;
          setProxiedSrc(proxyPath);
          console.log(`🔄 HTTP URL已代理: ${src} -> ${proxyPath}`);
        } else {
          // 非IP地址的HTTP URL，显示错误
          console.warn(`⚠️ 无法在HTTPS页面中加载HTTP内容: ${src}`);
          setError(true);
        }
      } else {
        // HTTPS或相对路径，直接使用
        setProxiedSrc(src);
      }
    } catch (e) {
      // URL解析失败，可能是相对路径，直接使用
      setProxiedSrc(src);
    }
  }, [src]);

  if (error) {
    return (
      <div className='flex h-full items-center justify-center rounded-lg bg-gray-100 p-8'>
        <div className='text-center'>
          <svg
            className='mx-auto h-12 w-12 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M12 15v2m0 0v2m0-2h2m-2 0h-2m3-6V9a3 3 0 00-6 0v2m12 0a9 9 0 11-18 0 9 9 0 0118 0z'
            />
          </svg>
          <h3 className='mt-2 text-sm font-medium text-gray-900'>安全限制</h3>
          <p className='mt-1 text-sm text-gray-500'>{fallbackMessage}</p>
          <p className='mt-1 text-xs text-gray-400'>
            HTTPS页面无法直接加载HTTP内容
          </p>
          <details className='mt-4 text-left'>
            <summary className='cursor-pointer text-xs text-blue-600'>
              查看原始URL
            </summary>
            <code className='mt-2 block rounded bg-gray-200 p-2 text-xs break-all'>
              {src}
            </code>
          </details>
        </div>
      </div>
    );
  }

  return <iframe {...props} src={proxiedSrc} onError={() => setError(true)} />;
}
