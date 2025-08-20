'use client';

import { useEffect } from 'react';
import posthog from 'posthog-js';

export function PostHogAnalytics() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host =
    process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com';

  useEffect(() => {
    if (!key) return;

    // 初始化 PostHog（仅客户端）
    posthog.init(key, {
      api_host: host,
      capture_pageview: true,
      capture_pageleave: true
    });

    // 尝试识别已登录用户
    fetch('/api/auth/session')
      .then((res) => res.json())
      .then((data) => {
        const u = data?.user as
          | {
              username?: string;
              email?: string;
              displayName?: string;
              department?: string;
            }
          | undefined;
        const distinctId = u?.email || u?.username;
        if (distinctId) {
          posthog.identify(distinctId, {
            email: u?.email,
            name: u?.displayName,
            username: u?.username,
            department: u?.department
          });
        }
      })
      .catch(() => {});
  }, [key, host]);

  return null;
}
