// iframe 卡片组件
// 嵌入现有的联系人查询页面

class IframeCard {
  constructor() {
    this.card = null;
    this.isVisible = false;
    this.baseUrl = 'http://localhost:3000'; // 默认值
  }

  // 初始化
  async init() {
    // 获取配置的基础 URL
    const result = await chrome.storage.sync.get('apiBaseUrl');
    this.baseUrl = result.apiBaseUrl || 'http://localhost:3000';
  }

  // 显示卡片
  async show(query, position) {
    // 如果卡片已存在，先移除
    if (this.card) {
      this.hide();
    }

    // 创建卡片
    this.card = this.createElement(query);

    // 设置位置
    if (position) {
      this.setPosition(position);
    }

    // 添加到页面
    document.body.appendChild(this.card);
    this.isVisible = true;

    // 动画显示
    requestAnimationFrame(() => {
      this.card.classList.add('crm-iframe-card-visible');
    });

    // 设置事件监听
    this.setupEventListeners();
  }

  // 创建卡片元素
  createElement(query) {
    const card = document.createElement('div');
    card.className = 'crm-iframe-card';

    // 创建 iframe URL，使用嵌入式路由
    const encodedQuery = encodeURIComponent(query);
    const iframeUrl = `${this.baseUrl}/dashboard/contacts/embed?q=${encodedQuery}`;

    card.innerHTML = `
      <div class="crm-iframe-card-header">
        <span class="crm-iframe-card-title">联系人查询</span>
        <button class="crm-iframe-card-close">×</button>
      </div>
      <div class="crm-iframe-card-body">
        <iframe 
          src="${iframeUrl}"
          class="crm-iframe-card-iframe"
          frameborder="0"
          allowfullscreen
        ></iframe>
      </div>
      <div class="crm-iframe-card-resize-handle"></div>
    `;

    // 保存查询数据
    card.dataset.query = query;

    return card;
  }

  // 设置位置
  setPosition(position) {
    if (!this.card) return;

    const { x, y } = position;
    const cardWidth = 800; // 默认宽度
    const cardHeight = 600; // 默认高度

    let left = x;
    let top = y + 20; // 在选中文本下方显示

    // 确保不超出视窗右边界
    if (left + cardWidth > window.innerWidth) {
      left = window.innerWidth - cardWidth - 20;
    }

    // 确保不超出视窗底部
    if (top + cardHeight > window.innerHeight) {
      top = y - cardHeight - 20; // 改为在选中文本上方显示
    }

    // 确保不超出视窗顶部
    if (top < 0) {
      top = 20;
    }

    this.card.style.left = `${left}px`;
    this.card.style.top = `${top}px`;
  }

  // 设置事件监听
  setupEventListeners() {
    // 关闭按钮
    const closeBtn = this.card.querySelector('.crm-iframe-card-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.hide();
      });
    }

    // 拖拽功能
    this.setupDraggable();

    // 调整大小功能
    this.setupResizable();

    // 点击外部关闭（可选）
    const handleClickOutside = (e) => {
      if (this.card && !this.card.contains(e.target)) {
        // 可以选择是否点击外部关闭
        // this.hide();
        // document.removeEventListener('click', handleClickOutside);
      }
    };

    // 监听来自 iframe 的消息
    window.addEventListener('message', this.handleIframeMessage.bind(this));
  }

  // 处理 iframe 消息
  handleIframeMessage(event) {
    // 验证消息来源
    if (!event.origin.startsWith(this.baseUrl)) return;

    // 处理不同类型的消息
    switch (event.data.type) {
      case 'CLOSE_IFRAME':
        this.hide();
        break;
      case 'RESIZE_IFRAME':
        if (event.data.width) {
          this.card.style.width = `${event.data.width}px`;
        }
        if (event.data.height) {
          this.card.style.height = `${event.data.height}px`;
        }
        break;
      case 'COPY_DATA':
        this.copyToClipboard(event.data.content);
        break;
    }
  }

  // 设置拖拽功能
  setupDraggable() {
    const header = this.card.querySelector('.crm-iframe-card-header');
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;

    header.style.cursor = 'move';

    header.addEventListener('mousedown', (e) => {
      if (e.target.tagName === 'BUTTON') return;

      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = this.card.offsetLeft;
      initialTop = this.card.offsetTop;

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });

    const handleMouseMove = (e) => {
      if (!isDragging) return;

      const deltaX = e.clientX - startX;
      const deltaY = e.clientY - startY;

      this.card.style.left = `${initialLeft + deltaX}px`;
      this.card.style.top = `${initialTop + deltaY}px`;
    };

    const handleMouseUp = () => {
      isDragging = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  // 设置调整大小功能
  setupResizable() {
    const handle = this.card.querySelector('.crm-iframe-card-resize-handle');
    if (!handle) return;

    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      startWidth = parseInt(window.getComputedStyle(this.card).width, 10);
      startHeight = parseInt(window.getComputedStyle(this.card).height, 10);

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      e.preventDefault();
    });

    const handleMouseMove = (e) => {
      if (!isResizing) return;

      const width = startWidth + e.clientX - startX;
      const height = startHeight + e.clientY - startY;

      // 设置最小尺寸
      if (width > 400) {
        this.card.style.width = `${width}px`;
      }
      if (height > 300) {
        this.card.style.height = `${height}px`;
      }
    };

    const handleMouseUp = () => {
      isResizing = false;
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }

  // 复制到剪贴板
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      this.showToast('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  }

  // 显示提示
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'crm-toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('crm-toast-visible');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('crm-toast-visible');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 300);
    }, 2000);
  }

  // 隐藏卡片
  hide() {
    if (!this.card) return;

    this.card.classList.remove('crm-iframe-card-visible');

    setTimeout(() => {
      if (this.card && this.card.parentNode) {
        this.card.parentNode.removeChild(this.card);
      }
      this.card = null;
      this.isVisible = false;
    }, 300);

    // 移除消息监听
    window.removeEventListener('message', this.handleIframeMessage);
  }
}

// 导出组件
window.CRMUIComponents = window.CRMUIComponents || {};
window.CRMUIComponents.IframeCard = IframeCard;
