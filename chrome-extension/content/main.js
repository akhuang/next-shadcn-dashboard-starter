// 主内容脚本
// 协调各个模块，处理用户交互

class ContactQueryExtension {
  constructor() {
    this.initialized = false;
    this.detectors = null;
    this.extractor = null;
    this.ui = null;
    this.config = null;
    this.searchResults = new Map();
  }

  // 初始化扩展
  async init() {
    if (this.initialized) return;

    try {
      // 加载配置
      await this.loadConfig();

      // 初始化检测器
      this.initDetectors();

      // 初始化提取器
      this.initExtractor();

      // 初始化UI
      await this.initUI();

      // 设置事件监听
      this.setupEventListeners();

      // 执行初始扫描
      this.performInitialScan();

      this.initialized = true;
      console.log('联系人查询助手已初始化');
    } catch (error) {
      console.error('初始化失败:', error);
    }
  }

  // 加载配置
  async loadConfig() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type: 'GET_CONFIG' }, (response) => {
        this.config = response || {
          displayMode: 'sidebar',
          autoDetect: true,
          highlightResults: true,
          cacheEnabled: true
        };
        resolve();
      });
    });
  }

  // 初始化检测器
  initDetectors() {
    this.detectors = {
      table: new window.CRMDetectors.TableDetector(),
      selection: new window.CRMDetectors.SelectionDetector(),
      form: new window.CRMDetectors.FormDetector()
    };

    // 启动选择监听
    this.detectors.selection.startListening();

    // 启动表格监听
    if (this.config.autoDetect) {
      this.detectors.table.observeTables();
    }
  }

  // 初始化提取器
  initExtractor() {
    this.extractor = new window.CRMExtractors.DataExtractor();
    this.recognizer = new window.CRMExtractors.SmartRecognizer();
    this.validator = new window.CRMExtractors.DataValidator();
  }

  // 初始化UI
  async initUI() {
    this.ui = {
      floatingButton: new window.CRMUIComponents.FloatingButton(),
      sidebar: new window.CRMUIComponents.Sidebar(),
      inlineResults: new window.CRMUIComponents.InlineResults(),
      quickCard: new window.CRMUIComponents.QuickCard()
    };

    // 根据配置初始化默认UI
    if (this.config.displayMode === 'sidebar') {
      this.ui.sidebar.init();
    }
  }

  // 设置事件监听
  setupEventListeners() {
    // 监听文本选择事件
    window.addEventListener(
      'textSelected',
      this.handleTextSelection.bind(this)
    );

    // 监听表格更新事件
    window.addEventListener(
      'tablesUpdated',
      this.handleTablesUpdate.bind(this)
    );

    // 监听来自后台的消息
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // 监听键盘快捷键
    document.addEventListener('keydown', this.handleKeydown.bind(this));
  }

  // 执行初始扫描
  performInitialScan() {
    if (!this.config.autoDetect) return;

    // 检测表格
    const tables = this.detectors.table.detectTables();

    tables.forEach((table) => {
      if (this.detectors.table.isContactTable(table)) {
        // 在表格旁显示增强按钮
        this.ui.floatingButton.show({
          position: {
            x: table.position.right + 10,
            y: table.position.top
          },
          onClick: () => this.enhanceTable(table)
        });
      }
    });

    console.log(`检测到 ${tables.length} 个可能包含联系人信息的表格`);
  }

  // 处理文本选择
  async handleTextSelection(event) {
    const { text, queryType, position, isDoubleClick } = event.detail;

    // 如果是双击且识别为姓名或联系方式，自动查询
    if (isDoubleClick && queryType.type !== 'unknown') {
      this.queryContact(text, { position });
    } else {
      // 显示查询按钮
      this.ui.floatingButton.show({
        position,
        text: `查询: ${text.substring(0, 10)}${text.length > 10 ? '...' : ''}`,
        onClick: () => this.queryContact(text, { position })
      });
    }
  }

  // 处理表格更新
  handleTablesUpdate(event) {
    const { tables } = event.detail;

    // 重新检查新表格
    tables.forEach((table) => {
      if (this.detectors.table.isContactTable(table)) {
        // 标记表格
        table.element.classList.add('crm-detectable-table');
      }
    });
  }

  // 处理消息
  handleMessage(request, sender, sendResponse) {
    switch (request.type) {
      case 'CONTEXT_MENU_SEARCH':
        this.queryContact(request.payload.query);
        break;

      case 'PAGE_LOADED':
        // 页面加载完成，重新初始化
        if (!this.initialized) {
          this.init();
        }
        break;

      case 'SEARCH_RESULT':
        this.handleSearchResult(request.payload);
        break;

      default:
        break;
    }
  }

  // 处理键盘快捷键
  handleKeydown(event) {
    // Ctrl/Cmd + Shift + F: 打开搜索
    if (
      (event.ctrlKey || event.metaKey) &&
      event.shiftKey &&
      event.key === 'F'
    ) {
      event.preventDefault();
      this.openQuickSearch();
    }

    // Escape: 关闭当前UI
    if (event.key === 'Escape') {
      this.closeCurrentUI();
    }
  }

  // 查询联系人
  async queryContact(query, options = {}) {
    try {
      // 显示加载状态
      this.showLoading(options.position);

      // 发送查询请求到后台
      chrome.runtime.sendMessage(
        {
          type: 'SEARCH_CONTACT',
          payload: {
            query,
            options: {
              mode: 'smart',
              limit: 10
            }
          }
        },
        (response) => {
          if (response.success) {
            this.displayResults(response.data, options);

            // 缓存结果
            this.searchResults.set(query, response.data);
          } else {
            this.showError(response.error);
          }
        }
      );
    } catch (error) {
      console.error('查询失败:', error);
      this.showError('查询失败，请重试');
    }
  }

  // 增强表格
  async enhanceTable(tableInfo) {
    try {
      // 提取表格数据
      const contacts = this.extractor.extractFromTable(tableInfo);

      // 验证数据
      const validation = this.validator.validateBatch(contacts);

      if (validation.valid.length === 0) {
        this.showError('未找到有效的联系人数据');
        return;
      }

      // 生成查询批次
      const batches = this.extractor.generateQueries(validation.valid);

      // 显示进度
      this.showProgress(0, batches.length);

      // 批量查询
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        chrome.runtime.sendMessage(
          {
            type: 'BATCH_SEARCH',
            payload: { queries: batch }
          },
          (response) => {
            if (response.success) {
              this.enhanceTableWithResults(tableInfo, response.data);
            }

            this.showProgress(i + 1, batches.length);
          }
        );
      }
    } catch (error) {
      console.error('增强表格失败:', error);
      this.showError('增强表格失败');
    }
  }

  // 使用查询结果增强表格
  enhanceTableWithResults(tableInfo, results) {
    const { element, keyColumns } = tableInfo;

    // 添加新列头
    const headerRow =
      element.querySelector('thead tr') || element.querySelector('tr');
    if (headerRow) {
      const th = document.createElement('th');
      th.textContent = '查询结果';
      th.className = 'crm-enhanced-column';
      headerRow.appendChild(th);
    }

    // 为每行添加结果
    results.results.forEach((result) => {
      const { id, matches } = result;
      const rowIndex = parseInt(id.split('_')[0]);
      const row = tableInfo.dataRows[rowIndex];

      if (row && row.element) {
        const td = document.createElement('td');
        td.className = 'crm-enhanced-cell';

        if (matches.length > 0) {
          const match = matches[0];
          td.innerHTML = this.formatContactCell(match);
        } else {
          td.innerHTML = '<span class="crm-no-match">未找到</span>';
        }

        row.element.appendChild(td);
      }
    });
  }

  // 格式化联系人单元格
  formatContactCell(contact) {
    const parts = [];

    if (contact.phone) {
      parts.push(`📱 ${window.CRMUtils.formatPhoneNumber(contact.phone)}`);
    }
    if (contact.email) {
      parts.push(`📧 ${contact.email}`);
    }
    if (contact.department) {
      parts.push(`🏢 ${contact.department}`);
    }

    return parts.join('<br>');
  }

  // 显示查询结果
  displayResults(data, options = {}) {
    const { results, total } = data;

    // 根据配置显示不同的UI
    switch (this.config.displayMode) {
      case 'sidebar':
        this.ui.sidebar.showResults(results);
        break;

      case 'inline':
        this.ui.inlineResults.show(results, options.position);
        break;

      case 'card':
        this.ui.quickCard.show(results[0], options.position);
        break;

      default:
        // 默认使用侧边栏
        this.ui.sidebar.showResults(results);
    }

    // 高亮页面中的匹配项
    if (this.config.highlightResults) {
      this.highlightMatches(results);
    }
  }

  // 高亮匹配项
  highlightMatches(results) {
    results.forEach((contact) => {
      // 高亮姓名
      if (contact.name) {
        this.highlightText(contact.name);
      }
      // 高亮电话
      if (contact.phone) {
        this.highlightText(contact.phone);
      }
      // 高亮邮箱
      if (contact.email) {
        this.highlightText(contact.email);
      }
    });
  }

  // 高亮文本
  highlightText(text) {
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while ((node = walker.nextNode())) {
      if (node.nodeValue.includes(text)) {
        const span = document.createElement('span');
        span.className = 'crm-highlight';
        span.innerHTML = window.CRMUtils.highlightText(node.nodeValue, text);
        node.parentNode.replaceChild(span, node);
      }
    }
  }

  // 打开快速搜索
  openQuickSearch() {
    this.ui.sidebar.toggle();
    if (this.ui.sidebar.isVisible) {
      this.ui.sidebar.focusSearch();
    }
  }

  // 关闭当前UI
  closeCurrentUI() {
    this.ui.floatingButton.hide();
    this.ui.sidebar.hide();
    this.ui.inlineResults.hide();
    this.ui.quickCard.hide();
  }

  // 显示加载状态
  showLoading(position) {
    if (position) {
      this.ui.quickCard.showLoading(position);
    } else {
      this.ui.sidebar.showLoading();
    }
  }

  // 显示进度
  showProgress(current, total) {
    const percent = Math.round((current / total) * 100);
    this.ui.sidebar.showProgress(percent, `处理中: ${current}/${total}`);
  }

  // 显示错误
  showError(message) {
    this.ui.quickCard.showError(message);
    console.error('错误:', message);
  }
}

// 初始化扩展
const contactQueryExtension = new ContactQueryExtension();

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    contactQueryExtension.init();
  });
} else {
  contactQueryExtension.init();
}

// 导出实例供其他模块使用
window.CRMExtension = contactQueryExtension;
