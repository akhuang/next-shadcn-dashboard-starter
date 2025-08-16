// 存储管理模块
// 处理扩展的配置和数据存储

class StorageManager {
  constructor() {
    this.cache = new Map();
  }

  // 获取配置
  async getConfig(key) {
    return new Promise((resolve) => {
      if (key) {
        chrome.storage.sync.get(key, (result) => {
          resolve(result[key]);
        });
      } else {
        chrome.storage.sync.get(null, (result) => {
          resolve(result);
        });
      }
    });
  }

  // 设置配置
  async setConfig(data) {
    return new Promise((resolve) => {
      chrome.storage.sync.set(data, () => {
        resolve();
      });
    });
  }

  // 获取本地数据
  async getLocal(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key]);
      });
    });
  }

  // 设置本地数据
  async setLocal(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, () => {
        resolve();
      });
    });
  }

  // 获取搜索历史
  async getSearchHistory(limit = 10) {
    const history = (await this.getLocal('searchHistory')) || [];
    return history.slice(0, limit);
  }

  // 添加搜索历史
  async addSearchHistory(query) {
    let history = (await this.getLocal('searchHistory')) || [];

    // 移除重复项
    history = history.filter((item) => item.query !== query);

    // 添加到开头
    history.unshift({
      query,
      timestamp: Date.now()
    });

    // 限制数量
    history = history.slice(0, 50);

    await this.setLocal('searchHistory', history);
  }

  // 清除搜索历史
  async clearSearchHistory() {
    await this.setLocal('searchHistory', []);
  }

  // 获取收藏的联系人
  async getFavorites() {
    return (await this.getLocal('favorites')) || [];
  }

  // 添加收藏
  async addFavorite(contact) {
    const favorites = await this.getFavorites();

    // 检查是否已存在
    const exists = favorites.some(
      (fav) =>
        (fav.email && fav.email === contact.email) ||
        (fav.phone && fav.phone === contact.phone)
    );

    if (!exists) {
      favorites.push({
        ...contact,
        addedAt: Date.now()
      });

      await this.setLocal('favorites', favorites);
    }
  }

  // 移除收藏
  async removeFavorite(contact) {
    let favorites = await this.getFavorites();

    favorites = favorites.filter(
      (fav) =>
        !(fav.email && fav.email === contact.email) &&
        !(fav.phone && fav.phone === contact.phone)
    );

    await this.setLocal('favorites', favorites);
  }

  // 获取自定义规则
  async getRules() {
    return (await this.getLocal('customRules')) || [];
  }

  // 添加自定义规则
  async addRule(rule) {
    const rules = await this.getRules();
    rules.push({
      ...rule,
      id: Date.now().toString(),
      createdAt: Date.now()
    });

    await this.setLocal('customRules', rules);
  }

  // 更新规则
  async updateRule(id, updates) {
    let rules = await this.getRules();

    rules = rules.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    );

    await this.setLocal('customRules', rules);
  }

  // 删除规则
  async deleteRule(id) {
    let rules = await this.getRules();
    rules = rules.filter((rule) => rule.id !== id);

    await this.setLocal('customRules', rules);
  }

  // 获取统计数据
  async getStats() {
    return (
      (await this.getLocal('stats')) || {
        totalSearches: 0,
        successfulSearches: 0,
        failedSearches: 0,
        lastSearchDate: null
      }
    );
  }

  // 更新统计数据
  async updateStats(type) {
    const stats = await this.getStats();

    stats.totalSearches++;
    if (type === 'success') {
      stats.successfulSearches++;
    } else if (type === 'failed') {
      stats.failedSearches++;
    }
    stats.lastSearchDate = Date.now();

    await this.setLocal('stats', stats);
  }

  // 监听配置变化
  onConfigChange(callback) {
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync') {
        const changedItems = {};
        for (const key in changes) {
          changedItems[key] = changes[key].newValue;
        }
        callback(changedItems);
      }
    });
  }

  // 导出所有数据
  async exportData() {
    const config = await this.getConfig();
    const searchHistory = await this.getSearchHistory(50);
    const favorites = await this.getFavorites();
    const rules = await this.getRules();
    const stats = await this.getStats();

    return {
      config,
      searchHistory,
      favorites,
      rules,
      stats,
      exportedAt: Date.now()
    };
  }

  // 导入数据
  async importData(data) {
    if (data.config) {
      await this.setConfig(data.config);
    }

    if (data.searchHistory) {
      await this.setLocal('searchHistory', data.searchHistory);
    }

    if (data.favorites) {
      await this.setLocal('favorites', data.favorites);
    }

    if (data.rules) {
      await this.setLocal('customRules', data.rules);
    }

    if (data.stats) {
      await this.setLocal('stats', data.stats);
    }
  }

  // 重置所有数据
  async resetAll() {
    await chrome.storage.sync.clear();
    await chrome.storage.local.clear();

    // 设置默认配置
    await this.setConfig({
      apiUrl: 'http://localhost:3000',
      displayMode: 'sidebar',
      autoDetect: true,
      highlightResults: true,
      cacheEnabled: true,
      cacheTTL: 300000
    });
  }
}

// 创建全局实例
window.CRMStorage = new StorageManager();
