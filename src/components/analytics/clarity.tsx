'use client';

import Script from 'next/script';

interface PlausibleProps {
  domain?: string;
  selfHosted?: boolean;
  scriptPath?: string;
}

export function PlausibleAnalytics({
  domain,
  selfHosted = false,
  scriptPath = '/js/script.js'
}: PlausibleProps) {
  // window is not available during SSR; compute safely
  const siteDomain =
    domain ||
    process.env.NEXT_PUBLIC_SITE_DOMAIN ||
    (typeof window !== 'undefined' ? window.location.host : 'localhost:3000');

  // 使用自托管的 Plausible 脚本路径
  const scriptSrc = selfHosted
    ? scriptPath
    : 'https://plausible.io/js/script.js';
  const apiEndpoint = selfHosted
    ? '/api/event'
    : 'https://plausible.io/api/event';

  return (
    <Script
      id='plausible-analytics'
      strategy='afterInteractive'
      data-domain={siteDomain}
      data-api={apiEndpoint}
      src={scriptSrc}
    />
  );
}

// 保留旧的 Clarity 组件名称以保持向后兼容
export const Clarity = PlausibleAnalytics;
