'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { umamiService } from '@/lib/umami-service';
import type { UserSession } from '@/lib/auth/verify';

export function UmamiProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, setUser] = useState<UserSession | null>(null);

  // Initialize Umami on mount
  useEffect(() => {
    umamiService.initialize();
  }, []);

  // Fetch user session from API
  useEffect(() => {
    const fetchSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        const data = await response.json();

        if (data.user) {
          setUser(data.user);

          // 识别域账号用户
          const userData = {
            id: data.user.username,
            email: data.user.email,
            domainAccount: data.user.username,
            department: data.user.department
          };

          umamiService.identify(data.user.username, userData);
        } else {
          setUser(null);
          umamiService.logout();
        }
      } catch (error) {
        console.error('Failed to fetch session:', error);
        setUser(null);
        umamiService.logout();
      }
    };

    fetchSession();

    // 监听存储事件以跟踪登录/登出
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'auth-status') {
        fetchSession();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Track page views on route changes
  useEffect(() => {
    const url =
      pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '');
    umamiService.trackPageView(url);
  }, [pathname, searchParams]);

  return <>{children}</>;
}
