'use client';

import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ExternalDashboardProps {
  src: string;
  title?: string;
  height?: string | number;
  className?: string;
  allowFullScreen?: boolean;
}

export function ExternalDashboard({
  src,
  title = 'External Dashboard',
  height = 600,
  className,
  allowFullScreen = true
}: ExternalDashboardProps) {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <div className={cn('relative w-full', className)}>
      {isLoading && (
        <div className='bg-background/80 absolute inset-0 z-10 flex items-center justify-center'>
          <Loader2 className='h-8 w-8 animate-spin' />
        </div>
      )}
      <iframe
        src={src}
        title={title}
        width='100%'
        height={height}
        allowFullScreen={allowFullScreen}
        onLoad={() => setIsLoading(false)}
        className={cn('rounded-lg border-0')}
        style={{ border: 0 }}
        sandbox='allow-same-origin allow-scripts allow-popups allow-forms allow-popups-to-escape-sandbox'
      />
    </div>
  );
}
