/**
 * Plausible Analytics 自定义事件追踪
 * 用于追踪用户交互、转化等自定义事件
 */

declare global {
  interface Window {
    plausible?: (
      eventName: string,
      options?: {
        props?: Record<string, string | number | boolean>;
        callback?: () => void;
      }
    ) => void;
  }
}

/**
 * 发送自定义事件到 Plausible
 * @param eventName 事件名称
 * @param props 事件属性（可选）
 * @param callback 事件发送后的回调（可选）
 */
export function trackEvent(
  eventName: string,
  props?: Record<string, string | number | boolean>,
  callback?: () => void
) {
  // 确保 Plausible 已加载
  if (typeof window !== 'undefined' && window.plausible) {
    window.plausible(eventName, {
      props,
      callback
    });
  } else if (callback) {
    // 如果 Plausible 未加载，直接执行回调
    callback();
  }
}

/**
 * 追踪页面浏览（Plausible 默认会自动追踪，这个方法用于手动触发）
 */
export function trackPageview() {
  trackEvent('pageview');
}

/**
 * 追踪外链点击
 * @param url 外链 URL
 */
export function trackOutboundLink(url: string) {
  trackEvent('Outbound Link: Click', { url });
}

/**
 * 追踪文件下载
 * @param filename 文件名
 */
export function trackDownload(filename: string) {
  trackEvent('File Download', { filename });
}

/**
 * 追踪表单提交
 * @param formName 表单名称
 */
export function trackFormSubmit(formName: string) {
  trackEvent('Form Submit', { form: formName });
}

/**
 * 追踪搜索
 * @param query 搜索关键词
 */
export function trackSearch(query: string) {
  trackEvent('Search', { query });
}

/**
 * 追踪错误
 * @param error 错误信息
 * @param context 错误上下文
 */
export function trackError(error: string, context?: string) {
  trackEvent('Error', { error, context });
}

/**
 * 追踪用户注册
 * @param method 注册方式（如 email, google, github 等）
 */
export function trackSignup(method: string) {
  trackEvent('Signup', { method });
}

/**
 * 追踪用户登录
 * @param method 登录方式
 */
export function trackLogin(method: string) {
  trackEvent('Login', { method });
}

/**
 * 追踪转化目标
 * @param goalName 目标名称
 * @param value 目标价值（可选）
 */
export function trackGoal(goalName: string, value?: number) {
  const props: Record<string, string | number> = {};
  if (value !== undefined) {
    props.value = value;
  }
  trackEvent(goalName, props);
}
