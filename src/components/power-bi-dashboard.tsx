'use client';

import { useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';

interface PowerBIDashboardProps {
  embedUrl: string;
  accessToken?: string; // 如果需要认证
  reportId: string;
  height?: string | number;
  onError?: (error: Error) => void;
}

export function PowerBIDashboard({
  embedUrl,
  accessToken,
  reportId,
  height = 600,
  onError
}: PowerBIDashboardProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 如果使用 Power BI JavaScript SDK
    // 需要先安装: npm install powerbi-client
    // 示例代码（需要 Power BI SDK）：
    /*
    const embedConfiguration = {
      type: 'report',
      tokenType: models.TokenType.Embed,
      accessToken: accessToken,
      embedUrl: embedUrl,
      id: reportId,
      permissions: models.Permissions.All,
      settings: {
        panes: {
          filters: { visible: false },
          pageNavigation: { visible: true }
        }
      }
    };
    
    const report = powerbi.embed(containerRef.current, embedConfiguration);
    
    report.on('error', (event) => {
      onError?.(new Error(event.detail));
    });
    */
  }, [embedUrl, accessToken, reportId, onError]);

  // 简化版 - 使用 iframe
  return (
    <div className='relative w-full' style={{ height }}>
      <iframe
        src={embedUrl}
        width='100%'
        height='100%'
        frameBorder='0'
        allowFullScreen
        className='rounded-lg border-0'
      />
    </div>
  );
}

// 配置示例
export const POWER_BI_CONFIG = {
  // Power BI 配置
  workspaceId: 'your-workspace-id',
  reportId: 'your-report-id',

  // 获取嵌入 URL 的函数
  getEmbedUrl: (reportId: string) => {
    return `https://app.powerbi.com/reportEmbed?reportId=${reportId}&autoAuth=true&ctid=your-tenant-id`;
  },

  // 获取访问令牌的函数（需要后端支持）
  getAccessToken: async () => {
    // 从你的后端 API 获取 Power BI 访问令牌
    // const response = await fetch('/api/powerbi/token');
    // const { token } = await response.json();
    // return token;
    return 'mock-token';
  }
};
