import React from 'react';
import { cn } from '@/lib/utils';

interface DashboardContainerProps {
  children: React.ReactNode;
  fullWidth?: boolean;
  className?: string;
}

export default function DashboardContainer({
  children,
  fullWidth = false,
  className
}: DashboardContainerProps) {
  return (
    <div
      className={cn(
        'h-[calc(100vh-52px)] overflow-auto',
        !fullWidth && 'p-4 md:p-6',
        fullWidth && 'px-4 md:px-8',
        className
      )}
    >
      {children}
    </div>
  );
}
