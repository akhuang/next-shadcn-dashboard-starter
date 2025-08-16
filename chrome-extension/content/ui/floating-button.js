// 悬浮按钮组件
// 在页面中显示查询按钮

class FloatingButton {
  constructor() {
    this.button = null;
    this.isVisible = false;
  }

  // 显示按钮
  show(options = {}) {
    const {
      position = { x: 0, y: 0 },
      text = '查询联系人',
      onClick = () => {}
    } = options;

    // 如果按钮已存在，先移除
    if (this.button) {
      this.hide();
    }

    // 创建按钮
    this.button = this.createElement(text);

    // 设置位置
    this.setPosition(position);

    // 绑定点击事件
    this.button.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
      this.hide();
    });

    // 添加到页面
    document.body.appendChild(this.button);
    this.isVisible = true;

    // 动画显示
    requestAnimationFrame(() => {
      this.button.classList.add('crm-floating-button-visible');
    });

    // 自动隐藏
    this.setupAutoHide();
  }

  // 创建按钮元素
  createElement(text) {
    const button = document.createElement('div');
    button.className = 'crm-floating-button';
    button.innerHTML = `
      <span class="crm-floating-button-icon">🔍</span>
      <span class="crm-floating-button-text">${text}</span>
    `;

    return button;
  }

  // 设置位置
  setPosition(position) {
    if (!this.button) return;

    const { x, y } = position;
    const rect = this.button.getBoundingClientRect();

    // 确保按钮不超出视窗
    let left = x;
    let top = y;

    if (left + rect.width > window.innerWidth) {
      left = window.innerWidth - rect.width - 10;
    }

    if (top + rect.height > window.innerHeight) {
      top = y - rect.height - 10;
    }

    this.button.style.left = `${left}px`;
    this.button.style.top = `${top}px`;
  }

  // 设置自动隐藏
  setupAutoHide() {
    let hideTimeout;

    const startHideTimer = () => {
      clearTimeout(hideTimeout);
      hideTimeout = setTimeout(() => {
        this.hide();
      }, 5000);
    };

    const stopHideTimer = () => {
      clearTimeout(hideTimeout);
    };

    // 鼠标进入时停止计时
    this.button.addEventListener('mouseenter', stopHideTimer);

    // 鼠标离开时开始计时
    this.button.addEventListener('mouseleave', startHideTimer);

    // 点击页面其他地方时隐藏
    document.addEventListener('click', (e) => {
      if (!this.button.contains(e.target)) {
        this.hide();
      }
    });

    // 开始计时
    startHideTimer();
  }

  // 隐藏按钮
  hide() {
    if (!this.button) return;

    this.button.classList.remove('crm-floating-button-visible');

    setTimeout(() => {
      if (this.button && this.button.parentNode) {
        this.button.parentNode.removeChild(this.button);
      }
      this.button = null;
      this.isVisible = false;
    }, 300);
  }

  // 更新文本
  updateText(text) {
    if (!this.button) return;

    const textElement = this.button.querySelector('.crm-floating-button-text');
    if (textElement) {
      textElement.textContent = text;
    }
  }

  // 显示加载状态
  showLoading() {
    if (!this.button) return;

    this.button.classList.add('crm-floating-button-loading');
    this.updateText('查询中...');
  }

  // 显示错误状态
  showError() {
    if (!this.button) return;

    this.button.classList.add('crm-floating-button-error');
    this.updateText('查询失败');

    setTimeout(() => {
      this.hide();
    }, 2000);
  }
}

// 导出组件
window.CRMUIComponents = window.CRMUIComponents || {};
window.CRMUIComponents.FloatingButton = FloatingButton;
