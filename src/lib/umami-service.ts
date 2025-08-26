'use client';

import type { UmamiEventData } from '@/types/umami';

export interface UserData {
  id: string;
  email?: string;
  department?: string;
  role?: string;
  domainAccount?: string;
}

class UmamiService {
  private userId: string | null = null;
  private userData: UserData | null = null;
  private isInitialized = false;

  private get tracker() {
    return typeof window !== 'undefined' ? window.umami : undefined;
  }

  initialize(websiteId?: string) {
    if (this.isInitialized || typeof window === 'undefined') return;

    const scriptId = 'umami-script';
    if (document.getElementById(scriptId)) {
      this.isInitialized = true;
      return;
    }

    const umamiUrl = process.env.NEXT_PUBLIC_UMAMI_URL;
    const siteId = websiteId || process.env.NEXT_PUBLIC_UMAMI_WEBSITE_ID;

    if (!umamiUrl || !siteId) {
      console.warn(
        'Umami: Missing configuration (NEXT_PUBLIC_UMAMI_URL or NEXT_PUBLIC_UMAMI_WEBSITE_ID)'
      );
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = `${umamiUrl}/script.js`;
    script.dataset.websiteId = siteId;
    script.defer = true;
    script.onload = () => {
      this.isInitialized = true;
      console.log('Umami analytics initialized');
    };
    script.onerror = () => {
      console.error('Failed to load Umami analytics script');
    };

    document.head.appendChild(script);
  }

  identify(userId: string, userData?: UserData) {
    this.userId = userId;
    this.userData = userData || null;

    if (this.tracker) {
      const identifyData: UmamiEventData = {
        ...userData,
        timestamp: new Date().toISOString()
      };
      this.tracker.identify(userId, identifyData);
    }
  }

  track(eventName: string, eventData?: UmamiEventData) {
    if (!this.tracker) return;

    const enrichedData: UmamiEventData = {
      ...eventData,
      userId: this.userId || undefined,
      timestamp: Date.now()
    };

    if (this.userData?.department) {
      enrichedData.department = this.userData.department;
    }

    this.tracker.track(eventName, enrichedData);
  }

  trackPageView(url?: string, referrer?: string, title?: string) {
    if (!this.tracker) return;

    this.tracker.track((props: any) => ({
      ...props,
      url: url || props.url,
      referrer: referrer || props.referrer,
      title: title || props.title,
      userId: this.userId || undefined
    }));
  }

  trackUserAction(action: string, data?: UmamiEventData) {
    this.track(`user_${action}`, {
      ...data,
      userAction: action
    });
  }

  trackError(error: Error, context?: string) {
    this.track('error', {
      message: error.message,
      stack: error.stack?.substring(0, 500),
      context,
      url: window.location.href
    });
  }

  trackFormSubmit(formName: string, success: boolean, data?: UmamiEventData) {
    this.track('form_submit', {
      formName,
      success,
      ...data
    });
  }

  trackSearch(query: string, resultsCount?: number, searchType?: string) {
    this.track('search', {
      query: query.substring(0, 100),
      resultsCount,
      searchType
    });
  }

  trackDownload(fileName: string, fileType?: string, fileSize?: number) {
    this.track('file_download', {
      fileName,
      fileType,
      fileSize
    });
  }

  trackNavigation(from: string, to: string, navigationType?: string) {
    this.track('navigation', {
      from,
      to,
      navigationType
    });
  }

  logout() {
    this.userId = null;
    this.userData = null;
  }

  isReady() {
    return this.isInitialized && !!this.tracker;
  }
}

export const umamiService = new UmamiService();
export default umamiService;
