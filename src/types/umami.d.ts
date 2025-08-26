export interface UmamiEventData {
  [key: string]: string | number | boolean | undefined;
}

export interface UmamiTracker {
  track(event: string, data?: UmamiEventData): void;
  track(callback: (props: any) => any): void;
  identify(id: string, data?: UmamiEventData): void;
}

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

export {};
