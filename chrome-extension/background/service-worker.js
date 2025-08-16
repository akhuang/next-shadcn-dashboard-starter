// Service Worker - 后台服务脚本
// 处理 Extension 的后台任务和 API 通信

// 初始化
chrome.runtime.onInstalled.addListener(() => {
  console.log('联系人查询助手已安装');

  // 创建右键菜单
  chrome.contextMenus.create({
    id: 'search-contact',
    title: '查询联系人: "%s"',
    contexts: ['selection']
  });

  // 设置默认配置
  chrome.storage.sync.get(['apiUrl'], (result) => {
    if (!result.apiUrl) {
      chrome.storage.sync.set({
        apiUrl: 'http://localhost:3000',
        cacheEnabled: true,
        cacheTTL: 300000, // 5分钟
        displayMode: 'sidebar' // sidebar | inline | card
      });
    }
  });
});

// API 通信类
class APIClient {
  constructor() {
    this.token = null;
    this.tokenExpiry = null;
  }

  async getConfig() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['apiUrl'], resolve);
    });
  }

  async authenticate() {
    const { apiUrl } = await this.getConfig();

    try {
      const response = await fetch(`${apiUrl}/api/extension/auth`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('认证失败');
      }

      const data = await response.json();
      this.token = data.token;
      this.tokenExpiry = Date.now() + data.expiresIn * 1000;

      return this.token;
    } catch (error) {
      console.error('认证错误:', error);
      throw error;
    }
  }

  async ensureAuth() {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token;
  }

  async searchContacts(query, options = {}) {
    const token = await this.ensureAuth();
    const { apiUrl } = await this.getConfig();

    try {
      const response = await fetch(`${apiUrl}/api/contacts/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          query,
          mode: options.mode || 'smart',
          fields: options.fields,
          limit: options.limit || 10
        })
      });

      if (!response.ok) {
        throw new Error('搜索失败');
      }

      return await response.json();
    } catch (error) {
      console.error('搜索错误:', error);
      throw error;
    }
  }

  async batchSearch(queries) {
    const token = await this.ensureAuth();
    const { apiUrl } = await this.getConfig();

    try {
      const response = await fetch(`${apiUrl}/api/contacts/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ queries })
      });

      if (!response.ok) {
        throw new Error('批量搜索失败');
      }

      return await response.json();
    } catch (error) {
      console.error('批量搜索错误:', error);
      throw error;
    }
  }
}

// 缓存管理
class CacheManager {
  constructor() {
    this.cache = new Map();
  }

  generateKey(query, options) {
    return `${query}_${JSON.stringify(options)}`;
  }

  async get(key) {
    const config = await new Promise((resolve) => {
      chrome.storage.sync.get(['cacheEnabled', 'cacheTTL'], resolve);
    });

    if (!config.cacheEnabled) {
      return null;
    }

    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < config.cacheTTL) {
      return item.data;
    }

    this.cache.delete(key);
    return null;
  }

  set(key, data) {
    // 限制缓存大小
    if (this.cache.size >= 100) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clear() {
    this.cache.clear();
  }
}

// 初始化全局对象
const apiClient = new APIClient();
const cacheManager = new CacheManager();

// 处理来自 Content Script 的消息
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log('收到消息:', request);

  switch (request.type) {
    case 'SEARCH_CONTACT':
      handleSearch(request.payload, sendResponse);
      return true; // 保持消息通道开放

    case 'BATCH_SEARCH':
      handleBatchSearch(request.payload, sendResponse);
      return true;

    case 'CLEAR_CACHE':
      cacheManager.clear();
      sendResponse({ success: true });
      break;

    case 'GET_CONFIG':
      chrome.storage.sync.get(null, sendResponse);
      return true;

    case 'TEST_CONNECTION':
      testConnection(sendResponse);
      return true;

    default:
      console.warn('未知消息类型:', request.type);
  }
});

// 处理搜索请求
async function handleSearch(payload, sendResponse) {
  const { query, options } = payload;
  const cacheKey = cacheManager.generateKey(query, options);

  try {
    // 尝试从缓存获取
    const cached = await cacheManager.get(cacheKey);
    if (cached) {
      console.log('使用缓存结果:', query);
      sendResponse({ success: true, data: cached, fromCache: true });
      return;
    }

    // 调用 API
    const result = await apiClient.searchContacts(query, options);

    // 缓存结果
    cacheManager.set(cacheKey, result);

    sendResponse({ success: true, data: result, fromCache: false });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 处理批量搜索
async function handleBatchSearch(payload, sendResponse) {
  try {
    const result = await apiClient.batchSearch(payload.queries);
    sendResponse({ success: true, data: result });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 测试连接
async function testConnection(sendResponse) {
  try {
    await apiClient.authenticate();
    sendResponse({ success: true, message: '连接成功' });
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// 处理右键菜单点击
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'search-contact') {
    chrome.tabs.sendMessage(tab.id, {
      type: 'CONTEXT_MENU_SEARCH',
      payload: { query: info.selectionText }
    });
  }
});

// 监听标签页更新
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    // 可以在这里初始化一些内容
    chrome.tabs.sendMessage(
      tabId,
      {
        type: 'PAGE_LOADED',
        payload: { url: tab.url }
      },
      () => {
        // 忽略错误（页面可能不需要处理此消息）
        if (chrome.runtime.lastError) {
          // Silent error
        }
      }
    );
  }
});

// 处理扩展图标点击
chrome.action.onClicked.addListener((tab) => {
  // 如果设置了 popup，这个事件不会触发
  // 可以用来切换侧边栏等
});

console.log('Service Worker 已启动');
