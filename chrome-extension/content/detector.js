// 页面元素检测器
// 负责检测页面中的表格、表单等关键元素

class TableDetector {
  constructor() {
    this.tables = [];
    this.keyColumnPatterns = {
      name: /姓名|名字|用户|客户|联系人|name|user|customer|contact/i,
      phone: /电话|手机|座机|tel|mobile|phone|cell/i,
      email: /邮箱|邮件|email|mail|e-mail/i,
      dept: /部门|科室|单位|department|dept|division|unit/i,
      title: /职位|职务|岗位|职称|title|position|role|job/i,
      company: /公司|企业|单位|机构|company|corp|organization|org/i
    };
  }

  // 检测页面中的所有表格
  detectTables() {
    const tables = document.querySelectorAll('table');
    this.tables = Array.from(tables).map((table, index) => ({
      id: `table_${index}`,
      element: table,
      headers: this.extractHeaders(table),
      keyColumns: this.identifyKeyColumns(table),
      dataRows: this.extractDataRows(table),
      position: this.getTablePosition(table)
    }));

    return this.tables.filter((table) => table.keyColumns.length > 0);
  }

  // 提取表头信息
  extractHeaders(table) {
    const headers = [];

    // 尝试从 thead 提取
    const thead = table.querySelector('thead');
    if (thead) {
      const headerRow = thead.querySelector('tr');
      if (headerRow) {
        headerRow.querySelectorAll('th, td').forEach((cell, index) => {
          headers.push({
            index,
            text: cell.textContent.trim(),
            element: cell
          });
        });
      }
    }

    // 如果没有 thead，尝试从第一行提取
    if (headers.length === 0) {
      const firstRow = table.querySelector('tr');
      if (firstRow) {
        firstRow.querySelectorAll('th, td').forEach((cell, index) => {
          headers.push({
            index,
            text: cell.textContent.trim(),
            element: cell
          });
        });
      }
    }

    return headers;
  }

  // 识别关键列
  identifyKeyColumns(table) {
    const headers = this.extractHeaders(table);
    const keyColumns = [];

    headers.forEach((header) => {
      for (const [key, pattern] of Object.entries(this.keyColumnPatterns)) {
        if (pattern.test(header.text)) {
          keyColumns.push({
            type: key,
            index: header.index,
            headerText: header.text
          });
          break;
        }
      }
    });

    return keyColumns;
  }

  // 提取数据行
  extractDataRows(table, limit = 100) {
    const rows = [];
    const tbody = table.querySelector('tbody') || table;
    const dataRows = tbody.querySelectorAll('tr');

    // 跳过表头行
    const startIndex = table.querySelector('thead') ? 0 : 1;

    for (
      let i = startIndex;
      i < Math.min(dataRows.length, startIndex + limit);
      i++
    ) {
      const row = dataRows[i];
      const cells = row.querySelectorAll('td');

      if (cells.length > 0) {
        const rowData = {
          element: row,
          cells: Array.from(cells).map((cell) => ({
            text: cell.textContent.trim(),
            element: cell
          }))
        };
        rows.push(rowData);
      }
    }

    return rows;
  }

  // 获取表格位置
  getTablePosition(table) {
    const rect = table.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      right: rect.right + window.scrollX,
      bottom: rect.bottom + window.scrollY,
      width: rect.width,
      height: rect.height
    };
  }

  // 检查表格是否包含联系人信息
  isContactTable(table) {
    const keyColumns = this.identifyKeyColumns(table);

    // 至少包含姓名和一个联系方式
    const hasName = keyColumns.some((col) => col.type === 'name');
    const hasContact = keyColumns.some(
      (col) => col.type === 'phone' || col.type === 'email'
    );

    return hasName || hasContact;
  }

  // 监听表格变化
  observeTables() {
    const observer = new MutationObserver((mutations) => {
      let shouldRedetect = false;

      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          // 检查是否有表格被添加或删除
          mutation.addedNodes.forEach((node) => {
            if (
              node.nodeName === 'TABLE' ||
              (node.querySelector && node.querySelector('table'))
            ) {
              shouldRedetect = true;
            }
          });
        }
      });

      if (shouldRedetect) {
        console.log('检测到表格变化，重新扫描');
        this.detectTables();
        window.dispatchEvent(
          new CustomEvent('tablesUpdated', {
            detail: { tables: this.tables }
          })
        );
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return observer;
  }
}

// 选择文本检测器
class SelectionDetector {
  constructor() {
    this.lastSelection = '';
    this.selectionTimeout = null;
  }

  // 启动选择监听
  startListening() {
    document.addEventListener('mouseup', this.handleMouseUp.bind(this));
    document.addEventListener('dblclick', this.handleDoubleClick.bind(this));
  }

  // 处理鼠标抬起事件
  handleMouseUp(event) {
    // 延迟处理，等待选择完成
    clearTimeout(this.selectionTimeout);
    this.selectionTimeout = setTimeout(() => {
      const selection = window.getSelection().toString().trim();

      if (selection && selection !== this.lastSelection) {
        this.lastSelection = selection;
        this.processSelection(selection, event);
      }
    }, 200);
  }

  // 处理双击事件
  handleDoubleClick(event) {
    setTimeout(() => {
      const selection = window.getSelection().toString().trim();
      if (selection) {
        this.processSelection(selection, event, true);
      }
    }, 50);
  }

  // 处理选中的文本
  processSelection(text, event, isDoubleClick = false) {
    const queryType = window.CRMUtils.detectQueryType(text);

    // 触发自定义事件
    window.dispatchEvent(
      new CustomEvent('textSelected', {
        detail: {
          text,
          queryType,
          position: {
            x: event.pageX,
            y: event.pageY
          },
          isDoubleClick
        }
      })
    );
  }

  // 停止监听
  stopListening() {
    document.removeEventListener('mouseup', this.handleMouseUp);
    document.removeEventListener('dblclick', this.handleDoubleClick);
    clearTimeout(this.selectionTimeout);
  }
}

// 表单检测器
class FormDetector {
  constructor() {
    this.forms = [];
    this.inputPatterns = {
      name: /name|姓名|名字|用户/i,
      phone: /phone|tel|mobile|电话|手机/i,
      email: /email|mail|邮箱|邮件/i
    };
  }

  // 检测页面中的表单
  detectForms() {
    const forms = document.querySelectorAll('form');
    const standaloneinputs = this.detectStandaloneInputs();

    this.forms = [
      ...Array.from(forms).map((form) => this.analyzeForm(form)),
      ...standaloneinputs
    ];

    return this.forms;
  }

  // 分析表单
  analyzeForm(form) {
    const inputs = form.querySelectorAll('input, select, textarea');
    const fields = [];

    inputs.forEach((input) => {
      const fieldInfo = this.analyzeField(input);
      if (fieldInfo) {
        fields.push(fieldInfo);
      }
    });

    return {
      element: form,
      fields,
      position: this.getElementPosition(form)
    };
  }

  // 分析字段
  analyzeField(input) {
    const name = input.name || input.id || '';
    const placeholder = input.placeholder || '';
    const label = this.findLabel(input);
    const text = `${name} ${placeholder} ${label}`.toLowerCase();

    for (const [type, pattern] of Object.entries(this.inputPatterns)) {
      if (pattern.test(text)) {
        return {
          type,
          element: input,
          name: input.name,
          id: input.id,
          value: input.value,
          label
        };
      }
    }

    return null;
  }

  // 查找标签
  findLabel(input) {
    // 通过 for 属性查找
    if (input.id) {
      const label = document.querySelector(`label[for="${input.id}"]`);
      if (label) {
        return label.textContent.trim();
      }
    }

    // 查找父级 label
    const parentLabel = input.closest('label');
    if (parentLabel) {
      return parentLabel.textContent.trim();
    }

    // 查找相邻的文本
    const prevSibling = input.previousElementSibling;
    if (prevSibling && prevSibling.tagName === 'LABEL') {
      return prevSibling.textContent.trim();
    }

    return '';
  }

  // 检测独立的输入框
  detectStandaloneInputs() {
    const inputs = document.querySelectorAll('input:not(form input)');
    const groups = [];

    // 按位置分组相近的输入框
    const grouped = new Map();

    inputs.forEach((input) => {
      const rect = input.getBoundingClientRect();
      const key = `${Math.floor(rect.top / 100)}_${Math.floor(rect.left / 200)}`;

      if (!grouped.has(key)) {
        grouped.set(key, []);
      }
      grouped.get(key).push(input);
    });

    grouped.forEach((group) => {
      if (group.length > 0) {
        const fields = group
          .map((input) => this.analyzeField(input))
          .filter(Boolean);
        if (fields.length > 0) {
          groups.push({
            element: group[0].parentElement,
            fields,
            position: this.getElementPosition(group[0])
          });
        }
      }
    });

    return groups;
  }

  // 获取元素位置
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return {
      top: rect.top + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
      height: rect.height
    };
  }
}

// 导出检测器
window.CRMDetectors = {
  TableDetector,
  SelectionDetector,
  FormDetector
};
