// 行内结果组件
// 在页面内直接显示搜索结果

class InlineResults {
  constructor() {
    this.container = null;
    this.isVisible = false;
  }

  // 显示结果
  show(results, position) {
    // 如果容器已存在，先移除
    if (this.container) {
      this.hide();
    }

    // 创建容器
    this.container = this.createElement(results);

    // 设置位置
    this.setPosition(position);

    // 添加到页面
    document.body.appendChild(this.container);
    this.isVisible = true;

    // 动画显示
    requestAnimationFrame(() => {
      this.container.classList.add('crm-inline-results-visible');
    });

    // 设置事件监听
    this.setupEventListeners();
  }

  // 创建元素
  createElement(results) {
    const container = document.createElement('div');
    container.className = 'crm-inline-results';

    if (results.length === 0) {
      container.innerHTML = `
        <div class="crm-inline-results-empty">
          未找到联系人信息
        </div>
      `;
    } else {
      const resultsHTML = results
        .slice(0, 3)
        .map((contact) => this.createResultItem(contact))
        .join('');

      container.innerHTML = `
        <div class="crm-inline-results-list">
          ${resultsHTML}
        </div>
        ${
          results.length > 3
            ? `
          <div class="crm-inline-results-more">
            还有 ${results.length - 3} 个结果...
          </div>
        `
            : ''
        }
      `;
    }

    return container;
  }

  // 创建结果项
  createResultItem(contact) {
    const name = contact['姓名'] || contact.name || '未知';
    const phone = contact['电话'] || contact.phone || '';
    const email = contact['邮箱'] || contact.email || '';
    const dept = contact['部门'] || contact.department || '';

    return `
      <div class="crm-inline-result-item">
        <div class="crm-inline-result-name">${name}</div>
        ${dept ? `<div class="crm-inline-result-dept">${dept}</div>` : ''}
        <div class="crm-inline-result-contacts">
          ${phone ? `<span class="crm-inline-result-phone">📱 ${window.CRMUtils.formatPhoneNumber(phone)}</span>` : ''}
          ${email ? `<span class="crm-inline-result-email">📧 ${email}</span>` : ''}
        </div>
      </div>
    `;
  }

  // 设置位置
  setPosition(position) {
    if (!this.container || !position) return;

    const { x, y } = position;
    const rect = this.container.getBoundingClientRect();

    let left = x;
    let top = y + 20; // 在位置下方显示

    // 确保不超出视窗
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 10;
    }

    if (top + rect.height > window.innerHeight) {
      top = y - rect.height - 20; // 改为在上方显示
    }

    this.container.style.left = `${left}px`;
    this.container.style.top = `${top}px`;
  }

  // 设置事件监听
  setupEventListeners() {
    // 点击外部关闭
    const handleClickOutside = (e) => {
      if (this.container && !this.container.contains(e.target)) {
        this.hide();
        document.removeEventListener('click', handleClickOutside);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);

    // ESC 键关闭
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });
  }

  // 隐藏结果
  hide() {
    if (!this.container) return;

    this.container.classList.remove('crm-inline-results-visible');

    setTimeout(() => {
      if (this.container && this.container.parentNode) {
        this.container.parentNode.removeChild(this.container);
      }
      this.container = null;
      this.isVisible = false;
    }, 300);
  }
}

// 导出组件
window.CRMUIComponents = window.CRMUIComponents || {};
window.CRMUIComponents.InlineResults = InlineResults;
