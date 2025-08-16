// 数据提取器
// 负责从页面元素中提取联系人相关数据

class DataExtractor {
  constructor() {
    this.extractedData = new Map();
  }

  // 从表格中提取数据
  extractFromTable(tableInfo) {
    const { element, keyColumns, dataRows } = tableInfo;
    const contacts = [];

    dataRows.forEach((row, rowIndex) => {
      const contact = {};
      let hasData = false;

      keyColumns.forEach((column) => {
        const cell = row.cells[column.index];
        if (cell && cell.text) {
          contact[column.type] = this.cleanData(cell.text, column.type);
          hasData = true;
        }
      });

      if (hasData) {
        contact.rowIndex = rowIndex;
        contact.element = row.element;
        contacts.push(contact);
      }
    });

    return contacts;
  }

  // 清理数据
  cleanData(text, type) {
    text = text.trim();

    switch (type) {
      case 'phone':
        return this.cleanPhoneNumber(text);
      case 'email':
        return this.cleanEmail(text);
      default:
        return text;
    }
  }

  // 清理电话号码
  cleanPhoneNumber(phone) {
    // 移除空格、横线等分隔符
    phone = phone.replace(/[\s\-\(\)]/g, '');

    // 移除国际区号
    if (phone.startsWith('+86')) {
      phone = phone.substring(3);
    } else if (phone.startsWith('86')) {
      phone = phone.substring(2);
    }

    return phone;
  }

  // 清理邮箱
  cleanEmail(email) {
    email = email.toLowerCase().trim();

    // 验证邮箱格式
    if (window.CRMUtils.isValidEmail(email)) {
      return email;
    }

    // 尝试提取邮箱
    const emails = window.CRMUtils.extractEmails(email);
    return emails.length > 0 ? emails[0] : email;
  }

  // 批量提取表格数据
  extractFromTables(tables) {
    const allContacts = [];

    tables.forEach((tableInfo) => {
      const contacts = this.extractFromTable(tableInfo);
      if (contacts.length > 0) {
        allContacts.push({
          tableId: tableInfo.id,
          element: tableInfo.element,
          contacts,
          keyColumns: tableInfo.keyColumns
        });
      }
    });

    return allContacts;
  }

  // 从文本中提取联系信息
  extractFromText(text) {
    const result = {
      original: text,
      phones: window.CRMUtils.extractPhones(text),
      emails: window.CRMUtils.extractEmails(text),
      queryType: window.CRMUtils.detectQueryType(text)
    };

    // 尝试识别姓名
    if (result.queryType.type === 'name') {
      result.name = result.queryType.value;
    }

    return result;
  }

  // 从选中的表格行提取数据
  extractFromSelectedRows(table, selectedRows) {
    const keyColumns =
      new window.CRMDetectors.TableDetector().identifyKeyColumns(table);
    const contacts = [];

    selectedRows.forEach((row) => {
      const cells = row.querySelectorAll('td');
      const contact = {};

      keyColumns.forEach((column) => {
        const cell = cells[column.index];
        if (cell) {
          contact[column.type] = this.cleanData(
            cell.textContent.trim(),
            column.type
          );
        }
      });

      if (Object.keys(contact).length > 0) {
        contacts.push(contact);
      }
    });

    return contacts;
  }

  // 智能合并重复数据
  mergeContacts(contacts) {
    const merged = new Map();

    contacts.forEach((contact) => {
      // 使用姓名或邮箱作为主键
      const key = contact.name || contact.email || contact.phone;

      if (key) {
        if (merged.has(key)) {
          // 合并数据
          const existing = merged.get(key);
          Object.keys(contact).forEach((field) => {
            if (!existing[field] && contact[field]) {
              existing[field] = contact[field];
            }
          });
        } else {
          merged.set(key, { ...contact });
        }
      }
    });

    return Array.from(merged.values());
  }

  // 生成查询批次
  generateQueries(contacts, batchSize = 10) {
    const batches = [];
    const queries = [];

    contacts.forEach((contact) => {
      // 优先使用姓名查询
      if (contact.name) {
        queries.push({
          id: `${contact.name}_name`,
          query: contact.name,
          type: 'name',
          original: contact
        });
      }
      // 其次使用邮箱
      else if (contact.email) {
        queries.push({
          id: `${contact.email}_email`,
          query: contact.email,
          type: 'email',
          original: contact
        });
      }
      // 最后使用电话
      else if (contact.phone) {
        queries.push({
          id: `${contact.phone}_phone`,
          query: contact.phone,
          type: 'phone',
          original: contact
        });
      }
    });

    // 分批
    for (let i = 0; i < queries.length; i += batchSize) {
      batches.push(queries.slice(i, i + batchSize));
    }

    return batches;
  }

  // 保存提取的数据
  saveExtractedData(key, data) {
    this.extractedData.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // 获取提取的数据
  getExtractedData(key) {
    return this.extractedData.get(key);
  }

  // 清理过期数据
  cleanupOldData(maxAge = 3600000) {
    // 1小时
    const now = Date.now();

    for (const [key, value] of this.extractedData.entries()) {
      if (now - value.timestamp > maxAge) {
        this.extractedData.delete(key);
      }
    }
  }
}

// 智能数据识别器
class SmartRecognizer {
  constructor() {
    this.patterns = {
      // 中国手机号
      cnMobile: /^1[3-9]\d{9}$/,
      // 座机号码
      cnLandline: /^0\d{2,3}-?\d{7,8}$/,
      // 邮箱
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      // 中文姓名（2-4个汉字）
      cnName: /^[\u4e00-\u9fa5]{2,4}$/,
      // 英文姓名
      enName: /^[A-Za-z]+ [A-Za-z]+$/,
      // 部门
      department: /部|科|处|室|中心|分?公司|集团/,
      // 职位
      title: /总|主任|经理|专员|工程师|助理|秘书|顾问/
    };
  }

  // 识别数据类型
  recognize(text) {
    text = text.trim();

    // 检查各种模式
    if (this.patterns.cnMobile.test(text.replace(/[\s-]/g, ''))) {
      return { type: 'phone', subtype: 'mobile', confidence: 0.95 };
    }

    if (this.patterns.cnLandline.test(text.replace(/\s/g, ''))) {
      return { type: 'phone', subtype: 'landline', confidence: 0.9 };
    }

    if (this.patterns.email.test(text)) {
      return { type: 'email', confidence: 0.95 };
    }

    if (this.patterns.cnName.test(text)) {
      return { type: 'name', subtype: 'chinese', confidence: 0.8 };
    }

    if (this.patterns.enName.test(text)) {
      return { type: 'name', subtype: 'english', confidence: 0.7 };
    }

    if (this.patterns.department.test(text)) {
      return { type: 'department', confidence: 0.6 };
    }

    if (this.patterns.title.test(text)) {
      return { type: 'title', confidence: 0.6 };
    }

    return { type: 'unknown', confidence: 0 };
  }

  // 批量识别
  recognizeBatch(texts) {
    return texts.map((text) => ({
      text,
      ...this.recognize(text)
    }));
  }

  // 从上下文推断类型
  inferFromContext(text, context) {
    const baseRecognition = this.recognize(text);

    // 如果周围有"姓名"、"联系人"等词
    if (context.match(/姓名|联系人|负责人|name|contact/i)) {
      if (baseRecognition.type === 'unknown' && text.length <= 10) {
        return { type: 'name', confidence: 0.7 };
      }
    }

    // 如果周围有"电话"、"手机"等词
    if (context.match(/电话|手机|座机|tel|phone|mobile/i)) {
      if (baseRecognition.type === 'unknown' && /\d{7,}/.test(text)) {
        return { type: 'phone', confidence: 0.6 };
      }
    }

    return baseRecognition;
  }
}

// 数据校验器
class DataValidator {
  // 验证联系人数据
  validateContact(contact) {
    const errors = [];
    const warnings = [];

    // 验证姓名
    if (contact.name) {
      if (contact.name.length < 2) {
        errors.push('姓名太短');
      }
      if (contact.name.length > 20) {
        warnings.push('姓名可能过长');
      }
    }

    // 验证电话
    if (contact.phone) {
      if (!window.CRMUtils.isValidPhone(contact.phone)) {
        errors.push('电话号码格式不正确');
      }
    }

    // 验证邮箱
    if (contact.email) {
      if (!window.CRMUtils.isValidEmail(contact.email)) {
        errors.push('邮箱格式不正确');
      }
    }

    // 至少需要一个联系方式
    if (!contact.phone && !contact.email) {
      warnings.push('缺少联系方式');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  // 批量验证
  validateBatch(contacts) {
    const results = {
      valid: [],
      invalid: [],
      warnings: []
    };

    contacts.forEach((contact) => {
      const validation = this.validateContact(contact);

      if (validation.isValid) {
        if (validation.warnings.length > 0) {
          results.warnings.push({ contact, warnings: validation.warnings });
        } else {
          results.valid.push(contact);
        }
      } else {
        results.invalid.push({ contact, errors: validation.errors });
      }
    });

    return results;
  }
}

// 导出提取器
window.CRMExtractors = {
  DataExtractor,
  SmartRecognizer,
  DataValidator
};
