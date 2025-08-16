// 工具函数库

// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// 生成唯一ID
function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// 高亮文本
function highlightText(text, keyword) {
  if (!keyword) return text;

  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`(${escapedKeyword})`, 'gi');

  return text.replace(regex, '<mark class="crm-highlight">$1</mark>');
}

// 格式化电话号码
function formatPhoneNumber(phone) {
  if (!phone) return '';

  // 移除所有非数字字符
  const cleaned = phone.replace(/\D/g, '');

  // 中国手机号格式
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  }

  // 座机号码
  if (cleaned.length >= 7) {
    if (cleaned.length === 7) {
      return cleaned.replace(/(\d{3})(\d{4})/, '$1-$2');
    }
    if (cleaned.length === 8) {
      return cleaned.replace(/(\d{4})(\d{4})/, '$1-$2');
    }
    if (cleaned.length === 10) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 11) {
      return cleaned.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
    }
    if (cleaned.length === 12) {
      return cleaned.replace(/(\d{4})(\d{4})(\d{4})/, '$1-$2-$3');
    }
  }

  return phone;
}

// 验证邮箱
function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

// 验证手机号
function isValidPhone(phone) {
  const cleaned = phone.replace(/\D/g, '');
  // 中国手机号
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return true;
  }
  // 座机号码（7-12位）
  if (cleaned.length >= 7 && cleaned.length <= 12) {
    return true;
  }
  return false;
}

// 提取文本中的邮箱
function extractEmails(text) {
  const regex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.match(regex) || [];
}

// 提取文本中的电话
function extractPhones(text) {
  // 匹配各种格式的电话号码
  const patterns = [
    /1[3-9]\d{9}/g, // 手机号
    /\d{3,4}-\d{7,8}/g, // 带区号的座机
    /\d{7,8}/g, // 纯座机号
    /\+86\s*1[3-9]\d{9}/g, // 国际格式手机号
    /\(\d{3,4}\)\s*\d{7,8}/g // 括号格式区号
  ];

  const phones = new Set();
  patterns.forEach((pattern) => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach((phone) => phones.add(phone));
    }
  });

  return Array.from(phones);
}

// 智能识别查询类型
function detectQueryType(query) {
  query = query.trim();

  if (isValidEmail(query)) {
    return { type: 'email', value: query };
  }

  if (isValidPhone(query)) {
    return { type: 'phone', value: query };
  }

  // 检查是否像部门名
  if (query.includes('部') || query.includes('科') || query.includes('组')) {
    return { type: 'department', value: query };
  }

  // 默认当作姓名
  return { type: 'name', value: query };
}

// 获取元素的绝对位置
function getElementPosition(element) {
  const rect = element.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    bottom: rect.bottom + window.scrollY,
    right: rect.right + window.scrollX,
    width: rect.width,
    height: rect.height
  };
}

// 判断元素是否在视窗内
function isElementInViewport(element) {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <=
      (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

// 复制到剪贴板
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    // 降级方案
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-999999px';
    document.body.appendChild(textarea);
    textarea.select();

    try {
      document.execCommand('copy');
      document.body.removeChild(textarea);
      return true;
    } catch (err) {
      document.body.removeChild(textarea);
      return false;
    }
  }
}

// 格式化联系人信息
function formatContactInfo(contact) {
  const lines = [];

  if (contact.name) lines.push(`姓名: ${contact.name}`);
  if (contact.phone) lines.push(`电话: ${formatPhoneNumber(contact.phone)}`);
  if (contact.email) lines.push(`邮箱: ${contact.email}`);
  if (contact.department) lines.push(`部门: ${contact.department}`);
  if (contact.title) lines.push(`职位: ${contact.title}`);
  if (contact.company) lines.push(`公司: ${contact.company}`);

  return lines.join('\n');
}

// 智能提取表格数据
function extractTableData(table) {
  const headers = [];
  const rows = [];

  // 提取表头
  const headerRow =
    table.querySelector('thead tr') || table.querySelector('tr');
  if (headerRow) {
    headerRow.querySelectorAll('th, td').forEach((cell) => {
      headers.push(cell.textContent.trim());
    });
  }

  // 提取数据行
  const dataRows = table.querySelectorAll('tbody tr, tr:not(:first-child)');
  dataRows.forEach((row) => {
    const rowData = {};
    row.querySelectorAll('td').forEach((cell, index) => {
      if (headers[index]) {
        rowData[headers[index]] = cell.textContent.trim();
      }
    });
    if (Object.keys(rowData).length > 0) {
      rows.push(rowData);
    }
  });

  return { headers, rows };
}

// 导出工具函数
window.CRMUtils = {
  debounce,
  throttle,
  generateId,
  highlightText,
  formatPhoneNumber,
  isValidEmail,
  isValidPhone,
  extractEmails,
  extractPhones,
  detectQueryType,
  getElementPosition,
  isElementInViewport,
  copyToClipboard,
  formatContactInfo,
  extractTableData
};
