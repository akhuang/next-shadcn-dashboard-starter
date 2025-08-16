// 快速卡片组件
// 显示单个联系人的详细信息

class QuickCard {
  constructor() {
    this.card = null;
    this.isVisible = false;
  }

  // 显示卡片
  show(contact, position) {
    // 如果卡片已存在，先移除
    if (this.card) {
      this.hide();
    }

    // 创建卡片
    this.card = this.createElement(contact);

    // 设置位置
    if (position) {
      this.setPosition(position);
    }

    // 添加到页面
    document.body.appendChild(this.card);
    this.isVisible = true;

    // 动画显示
    requestAnimationFrame(() => {
      this.card.classList.add('crm-quick-card-visible');
    });

    // 设置事件监听
    this.setupEventListeners();
  }

  // 创建卡片元素
  createElement(contact) {
    const card = document.createElement('div');
    card.className = 'crm-quick-card';

    const name = contact['姓名'] || contact.name || '未知';
    const phone = contact['电话'] || contact.phone || '';
    const email = contact['邮箱'] || contact.email || '';
    const dept = contact['部门'] || contact.department || '';
    const title = contact['职位'] || contact.title || '';
    const company = contact['公司'] || contact.company || '';

    card.innerHTML = `
      <div class="crm-quick-card-header">
        <div class="crm-quick-card-avatar">${name.charAt(0)}</div>
        <div class="crm-quick-card-info">
          <div class="crm-quick-card-name">${name}</div>
          ${title ? `<div class="crm-quick-card-title">${title}</div>` : ''}
        </div>
        <button class="crm-quick-card-close">×</button>
      </div>
      
      <div class="crm-quick-card-body">
        ${
          company
            ? `
          <div class="crm-quick-card-field">
            <span class="crm-quick-card-label">公司</span>
            <span class="crm-quick-card-value">${company}</span>
          </div>
        `
            : ''
        }
        
        ${
          dept
            ? `
          <div class="crm-quick-card-field">
            <span class="crm-quick-card-label">部门</span>
            <span class="crm-quick-card-value">${dept}</span>
          </div>
        `
            : ''
        }
        
        ${
          phone
            ? `
          <div class="crm-quick-card-field">
            <span class="crm-quick-card-label">电话</span>
            <span class="crm-quick-card-value crm-quick-card-clickable" data-copy="${phone}">
              ${window.CRMUtils.formatPhoneNumber(phone)}
            </span>
          </div>
        `
            : ''
        }
        
        ${
          email
            ? `
          <div class="crm-quick-card-field">
            <span class="crm-quick-card-label">邮箱</span>
            <span class="crm-quick-card-value crm-quick-card-clickable" data-copy="${email}">
              ${email}
            </span>
          </div>
        `
            : ''
        }
      </div>
      
      <div class="crm-quick-card-footer">
        <button class="crm-quick-card-copy-all">复制全部</button>
        <button class="crm-quick-card-view-more">查看更多</button>
      </div>
    `;

    // 保存联系人数据
    card.dataset.contact = JSON.stringify(contact);

    return card;
  }

  // 设置位置
  setPosition(position) {
    if (!this.card) return;

    const { x, y } = position;
    const rect = this.card.getBoundingClientRect();

    let left = x;
    let top = y;

    // 确保不超出视窗
    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 10;
    }

    if (top + rect.height > window.innerHeight) {
      top = window.innerHeight - rect.height - 10;
    }

    this.card.style.left = `${left}px`;
    this.card.style.top = `${top}px`;
  }

  // 设置事件监听
  setupEventListeners() {
    // 关闭按钮
    this.card
      .querySelector('.crm-quick-card-close')
      .addEventListener('click', () => {
        this.hide();
      });

    // 复制功能
    this.card.querySelectorAll('[data-copy]').forEach((element) => {
      element.addEventListener('click', async (e) => {
        const value = e.target.dataset.copy;
        const success = await window.CRMUtils.copyToClipboard(value);

        if (success) {
          this.showTooltip(e.target, '已复制');
        }
      });
    });

    // 复制全部
    this.card
      .querySelector('.crm-quick-card-copy-all')
      .addEventListener('click', async () => {
        const contact = JSON.parse(this.card.dataset.contact);
        const text = window.CRMUtils.formatContactInfo(contact);
        const success = await window.CRMUtils.copyToClipboard(text);

        if (success) {
          this.showTooltip(
            this.card.querySelector('.crm-quick-card-copy-all'),
            '已复制全部信息'
          );
        }
      });

    // 查看更多
    this.card
      .querySelector('.crm-quick-card-view-more')
      .addEventListener('click', () => {
        // 打开侧边栏显示更多信息
        if (window.CRMExtension) {
          window.CRMExtension.ui.sidebar.show();
          window.CRMExtension.ui.sidebar.showResults([
            JSON.parse(this.card.dataset.contact)
          ]);
        }
        this.hide();
      });

    // 点击外部关闭
    const handleClickOutside = (e) => {
      if (this.card && !this.card.contains(e.target)) {
        this.hide();
        document.removeEventListener('click', handleClickOutside);
      }
    };

    setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 100);
  }

  // 显示提示
  showTooltip(element, text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'crm-quick-card-tooltip';
    tooltip.textContent = text;

    const rect = element.getBoundingClientRect();
    tooltip.style.left = `${rect.left + rect.width / 2}px`;
    tooltip.style.top = `${rect.top - 30}px`;

    document.body.appendChild(tooltip);

    setTimeout(() => {
      tooltip.classList.add('crm-quick-card-tooltip-visible');
    }, 10);

    setTimeout(() => {
      tooltip.classList.remove('crm-quick-card-tooltip-visible');
      setTimeout(() => {
        if (tooltip.parentNode) {
          tooltip.parentNode.removeChild(tooltip);
        }
      }, 300);
    }, 2000);
  }

  // 显示加载状态
  showLoading(position) {
    const card = document.createElement('div');
    card.className = 'crm-quick-card crm-quick-card-loading';
    card.innerHTML = `
      <div class="crm-quick-card-spinner"></div>
      <div class="crm-quick-card-loading-text">查询中...</div>
    `;

    if (this.card) {
      this.hide();
    }

    this.card = card;

    if (position) {
      this.setPosition(position);
    }

    document.body.appendChild(this.card);
    this.isVisible = true;

    requestAnimationFrame(() => {
      this.card.classList.add('crm-quick-card-visible');
    });
  }

  // 显示错误
  showError(message) {
    if (!this.card) {
      this.card = document.createElement('div');
      this.card.className = 'crm-quick-card';
      document.body.appendChild(this.card);
    }

    this.card.className = 'crm-quick-card crm-quick-card-error';
    this.card.innerHTML = `
      <div class="crm-quick-card-error-icon">⚠️</div>
      <div class="crm-quick-card-error-message">${message}</div>
    `;

    this.card.classList.add('crm-quick-card-visible');

    setTimeout(() => {
      this.hide();
    }, 3000);
  }

  // 隐藏卡片
  hide() {
    if (!this.card) return;

    this.card.classList.remove('crm-quick-card-visible');

    setTimeout(() => {
      if (this.card && this.card.parentNode) {
        this.card.parentNode.removeChild(this.card);
      }
      this.card = null;
      this.isVisible = false;
    }, 300);
  }
}

// 导出组件
window.CRMUIComponents = window.CRMUIComponents || {};
window.CRMUIComponents.QuickCard = QuickCard;
