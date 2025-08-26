'use client';

import { useEffect, useCallback } from 'react';
import { umamiService, type UserData } from '@/lib/umami-service';
import type { UmamiEventData } from '@/types/umami';

export function useUmami() {
  useEffect(() => {
    umamiService.initialize();
  }, []);

  const identify = useCallback((userId: string, userData?: UserData) => {
    umamiService.identify(userId, userData);
  }, []);

  const track = useCallback((eventName: string, eventData?: UmamiEventData) => {
    umamiService.track(eventName, eventData);
  }, []);

  const trackPageView = useCallback(
    (url?: string, referrer?: string, title?: string) => {
      umamiService.trackPageView(url, referrer, title);
    },
    []
  );

  const trackUserAction = useCallback(
    (action: string, data?: UmamiEventData) => {
      umamiService.trackUserAction(action, data);
    },
    []
  );

  const trackError = useCallback((error: Error, context?: string) => {
    umamiService.trackError(error, context);
  }, []);

  const trackFormSubmit = useCallback(
    (formName: string, success: boolean, data?: UmamiEventData) => {
      umamiService.trackFormSubmit(formName, success, data);
    },
    []
  );

  const trackSearch = useCallback(
    (query: string, resultsCount?: number, searchType?: string) => {
      umamiService.trackSearch(query, resultsCount, searchType);
    },
    []
  );

  const trackDownload = useCallback(
    (fileName: string, fileType?: string, fileSize?: number) => {
      umamiService.trackDownload(fileName, fileType, fileSize);
    },
    []
  );

  const trackNavigation = useCallback(
    (from: string, to: string, navigationType?: string) => {
      umamiService.trackNavigation(from, to, navigationType);
    },
    []
  );

  return {
    identify,
    track,
    trackPageView,
    trackUserAction,
    trackError,
    trackFormSubmit,
    trackSearch,
    trackDownload,
    trackNavigation,
    isReady: umamiService.isReady()
  };
}
