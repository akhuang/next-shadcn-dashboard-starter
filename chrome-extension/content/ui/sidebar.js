// 侧边栏组件
// 显示完整的搜索结果和操作界面

class Sidebar {
  constructor() {
    this.container = null;
    this.isVisible = false;
    this.searchInput = null;
    this.resultsContainer = null;
    this.currentResults = [];
  }

  // 初始化侧边栏
  init() {
    if (this.container) return;

    // 创建容器
    this.container = this.createElement();

    // 添加到页面
    document.body.appendChild(this.container);

    // 设置事件监听
    this.setupEventListeners();
  }

  // 创建侧边栏元素
  createElement() {
    const container = document.createElement('div');
    container.className = 'crm-sidebar';
    container.innerHTML = `
      <div class="crm-sidebar-header">
        <h3 class="crm-sidebar-title">联系人查询</h3>
        <button class="crm-sidebar-close" aria-label="关闭">×</button>
      </div>
      
      <div class="crm-sidebar-search">
        <input 
          type="text" 
          class="crm-sidebar-search-input" 
          placeholder="输入姓名、电话或邮箱..."
        />
        <button class="crm-sidebar-search-button">搜索</button>
      </div>
      
      <div class="crm-sidebar-filters">
        <select class="crm-sidebar-filter-type">
          <option value="all">全部类型</option>
          <option value="name">姓名</option>
          <option value="phone">电话</option>
          <option value="email">邮箱</option>
        </select>
        
        <button class="crm-sidebar-filter-clear">清除筛选</button>
      </div>
      
      <div class="crm-sidebar-results">
        <div class="crm-sidebar-results-empty">
          请输入关键词开始搜索
        </div>
      </div>
      
      <div class="crm-sidebar-footer">
        <div class="crm-sidebar-status"></div>
        <div class="crm-sidebar-actions">
          <button class="crm-sidebar-export">导出结果</button>
          <button class="crm-sidebar-settings">设置</button>
        </div>
      </div>
    `;

    // 保存引用
    this.searchInput = container.querySelector('.crm-sidebar-search-input');
    this.resultsContainer = container.querySelector('.crm-sidebar-results');

    return container;
  }

  // 设置事件监听
  setupEventListeners() {
    // 关闭按钮
    this.container
      .querySelector('.crm-sidebar-close')
      .addEventListener('click', () => {
        this.hide();
      });

    // 搜索按钮
    this.container
      .querySelector('.crm-sidebar-search-button')
      .addEventListener('click', () => {
        this.performSearch();
      });

    // 回车搜索
    this.searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.performSearch();
      }
    });

    // 筛选器变化
    this.container
      .querySelector('.crm-sidebar-filter-type')
      .addEventListener('change', (e) => {
        this.filterResults(e.target.value);
      });

    // 清除筛选
    this.container
      .querySelector('.crm-sidebar-filter-clear')
      .addEventListener('click', () => {
        this.clearFilters();
      });

    // 导出按钮
    this.container
      .querySelector('.crm-sidebar-export')
      .addEventListener('click', () => {
        this.exportResults();
      });

    // 设置按钮
    this.container
      .querySelector('.crm-sidebar-settings')
      .addEventListener('click', () => {
        this.openSettings();
      });

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  // 显示侧边栏
  show() {
    if (!this.container) {
      this.init();
    }

    this.container.classList.add('crm-sidebar-visible');
    this.isVisible = true;

    // 聚焦搜索框
    setTimeout(() => {
      this.searchInput.focus();
    }, 300);
  }

  // 隐藏侧边栏
  hide() {
    if (!this.container) return;

    this.container.classList.remove('crm-sidebar-visible');
    this.isVisible = false;
  }

  // 切换显示/隐藏
  toggle() {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  // 聚焦搜索框
  focusSearch() {
    if (this.searchInput) {
      this.searchInput.focus();
      this.searchInput.select();
    }
  }

  // 执行搜索
  performSearch() {
    const query = this.searchInput.value.trim();

    if (!query) {
      this.showMessage('请输入搜索关键词');
      return;
    }

    this.showLoading();

    // 发送搜索请求
    chrome.runtime.sendMessage(
      {
        type: 'SEARCH_CONTACT',
        payload: {
          query,
          options: {
            mode: 'smart',
            limit: 20
          }
        }
      },
      (response) => {
        if (response.success) {
          this.showResults(response.data.results);
        } else {
          this.showError(response.error);
        }
      }
    );
  }

  // 显示搜索结果
  showResults(results) {
    this.currentResults = results;

    if (results.length === 0) {
      this.resultsContainer.innerHTML = `
        <div class="crm-sidebar-results-empty">
          未找到匹配的联系人
        </div>
      `;
      return;
    }

    // 构建结果HTML
    const resultsHTML = results
      .map((contact) => this.createResultItem(contact))
      .join('');

    this.resultsContainer.innerHTML = `
      <div class="crm-sidebar-results-count">
        找到 ${results.length} 个联系人
      </div>
      <div class="crm-sidebar-results-list">
        ${resultsHTML}
      </div>
    `;

    // 绑定结果项事件
    this.bindResultEvents();
  }

  // 创建结果项
  createResultItem(contact) {
    const phone = contact['电话'] || contact.phone || '';
    const email = contact['邮箱'] || contact.email || '';
    const name = contact['姓名'] || contact.name || '未知';
    const dept = contact['部门'] || contact.department || '';
    const title = contact['职位'] || contact.title || '';

    return `
      <div class="crm-sidebar-result-item" data-id="${contact.id || ''}">
        <div class="crm-sidebar-result-header">
          <span class="crm-sidebar-result-name">${name}</span>
          ${title ? `<span class="crm-sidebar-result-title">${title}</span>` : ''}
        </div>
        
        <div class="crm-sidebar-result-details">
          ${dept ? `<div class="crm-sidebar-result-dept">🏢 ${dept}</div>` : ''}
          ${phone ? `<div class="crm-sidebar-result-phone">📱 ${window.CRMUtils.formatPhoneNumber(phone)}</div>` : ''}
          ${email ? `<div class="crm-sidebar-result-email">📧 ${email}</div>` : ''}
        </div>
        
        <div class="crm-sidebar-result-actions">
          ${phone ? `<button class="crm-sidebar-result-copy" data-value="${phone}" data-type="phone">复制电话</button>` : ''}
          ${email ? `<button class="crm-sidebar-result-copy" data-value="${email}" data-type="email">复制邮箱</button>` : ''}
          <button class="crm-sidebar-result-copy-all">复制全部</button>
        </div>
      </div>
    `;
  }

  // 绑定结果项事件
  bindResultEvents() {
    // 复制按钮
    this.resultsContainer
      .querySelectorAll('.crm-sidebar-result-copy')
      .forEach((button) => {
        button.addEventListener('click', (e) => {
          const value = e.target.dataset.value;
          const type = e.target.dataset.type;
          this.copyToClipboard(value, type);
        });
      });

    // 复制全部按钮
    this.resultsContainer
      .querySelectorAll('.crm-sidebar-result-copy-all')
      .forEach((button) => {
        button.addEventListener('click', (e) => {
          const item = e.target.closest('.crm-sidebar-result-item');
          const index = Array.from(item.parentNode.children).indexOf(item);
          const contact = this.currentResults[index];

          if (contact) {
            const text = window.CRMUtils.formatContactInfo(contact);
            this.copyToClipboard(text, 'all');
          }
        });
      });
  }

  // 复制到剪贴板
  async copyToClipboard(text, type) {
    const success = await window.CRMUtils.copyToClipboard(text);

    if (success) {
      this.showMessage(
        `已复制${type === 'phone' ? '电话' : type === 'email' ? '邮箱' : '联系人信息'}`
      );
    } else {
      this.showMessage('复制失败，请手动复制');
    }
  }

  // 筛选结果
  filterResults(type) {
    if (type === 'all') {
      this.showResults(this.currentResults);
      return;
    }

    const filtered = this.currentResults.filter((contact) => {
      switch (type) {
        case 'name':
          return contact['姓名'] || contact.name;
        case 'phone':
          return contact['电话'] || contact.phone;
        case 'email':
          return contact['邮箱'] || contact.email;
        default:
          return true;
      }
    });

    this.showResults(filtered);
  }

  // 清除筛选
  clearFilters() {
    this.container.querySelector('.crm-sidebar-filter-type').value = 'all';
    this.showResults(this.currentResults);
  }

  // 导出结果
  exportResults() {
    if (this.currentResults.length === 0) {
      this.showMessage('没有可导出的数据');
      return;
    }

    // 转换为CSV格式
    const csv = this.convertToCSV(this.currentResults);

    // 创建下载链接
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `contacts_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    URL.revokeObjectURL(url);
    this.showMessage('导出成功');
  }

  // 转换为CSV
  convertToCSV(data) {
    if (data.length === 0) return '';

    // 获取所有字段
    const headers = Object.keys(data[0]).filter((k) => k !== '_source');

    // 构建CSV
    const rows = [
      headers.join(','),
      ...data.map((row) =>
        headers
          .map((header) => {
            const value = row[header] || '';
            // 如果包含逗号或引号，需要用引号包裹
            if (
              value.toString().includes(',') ||
              value.toString().includes('"')
            ) {
              return `"${value.toString().replace(/"/g, '""')}"`;
            }
            return value;
          })
          .join(',')
      )
    ];

    return rows.join('\n');
  }

  // 打开设置
  openSettings() {
    chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
  }

  // 显示加载状态
  showLoading() {
    this.resultsContainer.innerHTML = `
      <div class="crm-sidebar-loading">
        <div class="crm-sidebar-loading-spinner"></div>
        <div class="crm-sidebar-loading-text">搜索中...</div>
      </div>
    `;
  }

  // 显示进度
  showProgress(percent, text) {
    const status = this.container.querySelector('.crm-sidebar-status');
    if (status) {
      status.innerHTML = `
        <div class="crm-sidebar-progress">
          <div class="crm-sidebar-progress-bar" style="width: ${percent}%"></div>
        </div>
        <div class="crm-sidebar-progress-text">${text}</div>
      `;
    }
  }

  // 显示错误
  showError(message) {
    this.resultsContainer.innerHTML = `
      <div class="crm-sidebar-error">
        <div class="crm-sidebar-error-icon">⚠️</div>
        <div class="crm-sidebar-error-message">${message}</div>
      </div>
    `;
  }

  // 显示消息
  showMessage(message) {
    const status = this.container.querySelector('.crm-sidebar-status');
    if (status) {
      status.textContent = message;
      setTimeout(() => {
        status.textContent = '';
      }, 3000);
    }
  }
}

// 导出组件
window.CRMUIComponents = window.CRMUIComponents || {};
window.CRMUIComponents.Sidebar = Sidebar;
