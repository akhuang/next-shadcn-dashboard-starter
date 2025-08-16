// API 通信模块
// 处理与后端的通信

class APIClient {
  constructor() {
    this.baseURL = null;
    this.apiKey = null;
    this.token = null;
    this.tokenExpiry = null;
  }

  // 初始化
  async init() {
    const config = await window.CRMStorage.getConfig();
    this.baseURL = config.apiUrl || 'http://localhost:3000';
  }

  // 认证
  async authenticate() {
    try {
      const response = await fetch(`${this.baseURL}/api/extension/auth`, {
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

  // 确保认证有效
  async ensureAuth() {
    if (!this.token || Date.now() >= this.tokenExpiry) {
      await this.authenticate();
    }
    return this.token;
  }

  // 搜索联系人
  async searchContacts(query, options = {}) {
    await this.ensureAuth();

    try {
      const response = await fetch(`${this.baseURL}/api/contacts/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
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

      const data = await response.json();

      // 更新统计
      await window.CRMStorage.updateStats('success');

      // 添加到搜索历史
      await window.CRMStorage.addSearchHistory(query);

      return data;
    } catch (error) {
      await window.CRMStorage.updateStats('failed');
      console.error('搜索错误:', error);
      throw error;
    }
  }

  // 批量搜索
  async batchSearch(queries) {
    await this.ensureAuth();

    try {
      const response = await fetch(`${this.baseURL}/api/contacts/batch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.token}`
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

  // 测试连接
  async testConnection() {
    try {
      await this.init();
      await this.authenticate();
      return { success: true, message: '连接成功' };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // 更新配置
  async updateConfig(config) {
    this.baseURL = config.apiUrl || this.baseURL;
    this.token = null; // 清除token，强制重新认证
    this.tokenExpiry = null;
  }
}

// 创建全局实例
window.CRMAPIClient = new APIClient();
