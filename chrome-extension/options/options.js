// 设置页面脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化
  await init();

  // 绑定事件
  bindEvents();

  // 加载设置
  await loadSettings();
});

// 初始化
async function init() {
  // 设置默认标签
  showTab('general');
}

// 绑定事件
function bindEvents() {
  // 标签切换
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.addEventListener('click', () => {
      const tab = item.dataset.tab;
      showTab(tab);
    });
  });

  // 常规设置
  document
    .getElementById('autoDetect')
    .addEventListener('change', saveSettings);
  document
    .getElementById('highlightResults')
    .addEventListener('change', saveSettings);
  document
    .getElementById('cacheEnabled')
    .addEventListener('change', saveSettings);
  document.getElementById('cacheTTL').addEventListener('change', saveSettings);

  // API 配置
  document.getElementById('apiUrl').addEventListener('change', saveSettings);
  document
    .getElementById('testConnection')
    .addEventListener('click', testConnection);

  // 显示设置
  document
    .getElementById('displayMode')
    .addEventListener('change', saveSettings);
  document
    .getElementById('resultLimit')
    .addEventListener('change', saveSettings);
  document.getElementById('theme').addEventListener('change', saveSettings);

  // 规则管理
  document.getElementById('addRule').addEventListener('click', addRule);

  // 收藏管理
  document
    .getElementById('favoritesSearch')
    .addEventListener('input', searchFavorites);
  document
    .getElementById('exportFavorites')
    .addEventListener('click', exportFavorites);

  // 数据管理
  document
    .getElementById('clearHistory')
    .addEventListener('click', clearHistory);
  document.getElementById('clearCache').addEventListener('click', clearCache);
  document.getElementById('exportAll').addEventListener('click', exportAllData);
  document.getElementById('importData').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });
  document.getElementById('importFile').addEventListener('change', importData);
  document.getElementById('resetAll').addEventListener('click', resetAll);
}

// 显示标签
function showTab(tabName) {
  // 更新导航
  document.querySelectorAll('.nav-item').forEach((item) => {
    if (item.dataset.tab === tabName) {
      item.classList.add('active');
    } else {
      item.classList.remove('active');
    }
  });

  // 更新内容
  document.querySelectorAll('.tab-content').forEach((content) => {
    if (content.id === tabName) {
      content.classList.add('active');
    } else {
      content.classList.remove('active');
    }
  });

  // 加载标签特定数据
  loadTabData(tabName);
}

// 加载标签数据
async function loadTabData(tabName) {
  switch (tabName) {
    case 'rules':
      await loadRules();
      break;
    case 'favorites':
      await loadFavorites();
      break;
    case 'data':
      await loadDataStats();
      break;
  }
}

// 加载设置
async function loadSettings() {
  chrome.storage.sync.get(null, (settings) => {
    // 常规设置
    document.getElementById('autoDetect').checked =
      settings.autoDetect !== false;
    document.getElementById('highlightResults').checked =
      settings.highlightResults !== false;
    document.getElementById('cacheEnabled').checked =
      settings.cacheEnabled !== false;
    document.getElementById('cacheTTL').value = settings.cacheTTL || '300000';

    // API 配置
    document.getElementById('apiUrl').value =
      settings.apiUrl || 'http://localhost:3000';

    // 显示设置
    document.getElementById('displayMode').value =
      settings.displayMode || 'sidebar';
    document.getElementById('resultLimit').value = settings.resultLimit || '10';
    document.getElementById('theme').value = settings.theme || 'light';
  });
}

// 保存设置
function saveSettings() {
  const settings = {
    // 常规设置
    autoDetect: document.getElementById('autoDetect').checked,
    highlightResults: document.getElementById('highlightResults').checked,
    cacheEnabled: document.getElementById('cacheEnabled').checked,
    cacheTTL: parseInt(document.getElementById('cacheTTL').value),

    // API 配置
    apiUrl: document.getElementById('apiUrl').value,

    // 显示设置
    displayMode: document.getElementById('displayMode').value,
    resultLimit: parseInt(document.getElementById('resultLimit').value),
    theme: document.getElementById('theme').value
  };

  chrome.storage.sync.set(settings, () => {
    showToast('设置已保存', 'success');
  });
}

// 测试连接
async function testConnection() {
  const resultDiv = document.getElementById('connectionResult');
  resultDiv.className = 'test-result';
  resultDiv.textContent = '测试中...';
  resultDiv.style.display = 'block';

  chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (response) => {
    if (response && response.success) {
      resultDiv.className = 'test-result success';
      resultDiv.textContent = '✅ 连接成功';
    } else {
      resultDiv.className = 'test-result error';
      resultDiv.textContent = `❌ 连接失败: ${response ? response.error : '未知错误'}`;
    }
  });
}

// 加载规则
async function loadRules() {
  chrome.storage.local.get('customRules', (result) => {
    const rules = result.customRules || [];
    const rulesList = document.getElementById('rulesList');

    if (rules.length === 0) {
      rulesList.innerHTML = '<div class="empty-state">暂无自定义规则</div>';
      return;
    }

    const rulesHTML = rules
      .map(
        (rule) => `
      <div class="rule-item">
        <div class="rule-info">
          <div class="rule-name">${rule.name}</div>
          <div class="rule-pattern">${rule.pattern}</div>
        </div>
        <div class="rule-actions">
          <button class="rule-btn" onclick="editRule('${rule.id}')">编辑</button>
          <button class="rule-btn" onclick="deleteRule('${rule.id}')">删除</button>
        </div>
      </div>
    `
      )
      .join('');

    rulesList.innerHTML = rulesHTML;
  });
}

// 添加规则
function addRule() {
  const name = prompt('规则名称:');
  if (!name) return;

  const pattern = prompt('匹配模式 (URL 或域名):');
  if (!pattern) return;

  chrome.storage.local.get('customRules', (result) => {
    const rules = result.customRules || [];
    rules.push({
      id: Date.now().toString(),
      name,
      pattern,
      createdAt: Date.now()
    });

    chrome.storage.local.set({ customRules: rules }, () => {
      loadRules();
      showToast('规则已添加', 'success');
    });
  });
}

// 删除规则
window.deleteRule = function (id) {
  if (!confirm('确定要删除这个规则吗？')) return;

  chrome.storage.local.get('customRules', (result) => {
    let rules = result.customRules || [];
    rules = rules.filter((rule) => rule.id !== id);

    chrome.storage.local.set({ customRules: rules }, () => {
      loadRules();
      showToast('规则已删除', 'success');
    });
  });
};

// 加载收藏
async function loadFavorites() {
  chrome.storage.local.get('favorites', (result) => {
    const favorites = result.favorites || [];
    displayFavorites(favorites);
  });
}

// 显示收藏
function displayFavorites(favorites) {
  const favoritesList = document.getElementById('favoritesList');

  if (favorites.length === 0) {
    favoritesList.innerHTML = '<div class="empty-state">暂无收藏的联系人</div>';
    return;
  }

  const favoritesHTML = favorites
    .map((contact) => {
      const name = contact['姓名'] || contact.name || '未知';
      const phone = contact['电话'] || contact.phone || '';
      const email = contact['邮箱'] || contact.email || '';
      const dept = contact['部门'] || contact.department || '';

      return `
      <div class="favorite-card">
        <div class="favorite-name">${name}</div>
        ${dept ? `<div class="favorite-dept">${dept}</div>` : ''}
        ${phone ? `<div class="favorite-phone">📱 ${phone}</div>` : ''}
        ${email ? `<div class="favorite-email">📧 ${email}</div>` : ''}
      </div>
    `;
    })
    .join('');

  favoritesList.innerHTML = favoritesHTML;
}

// 搜索收藏
function searchFavorites() {
  const query = document.getElementById('favoritesSearch').value.toLowerCase();

  chrome.storage.local.get('favorites', (result) => {
    const favorites = result.favorites || [];

    const filtered = favorites.filter((contact) => {
      const searchText = JSON.stringify(contact).toLowerCase();
      return searchText.includes(query);
    });

    displayFavorites(filtered);
  });
}

// 导出收藏
function exportFavorites() {
  chrome.storage.local.get('favorites', (result) => {
    const favorites = result.favorites || [];

    const dataStr = JSON.stringify(favorites, null, 2);
    const dataUri =
      'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

    const link = document.createElement('a');
    link.href = dataUri;
    link.download = `favorites_${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    showToast('收藏已导出', 'success');
  });
}

// 加载数据统计
async function loadDataStats() {
  chrome.storage.local.get(['searchHistory', 'stats'], (result) => {
    // 历史记录数量
    const history = result.searchHistory || [];
    document.getElementById('historyCount').textContent = history.length;

    // 缓存大小（估算）
    chrome.storage.local.getBytesInUse(null, (bytes) => {
      const kb = (bytes / 1024).toFixed(2);
      document.getElementById('cacheSize').textContent = `${kb} KB`;
    });
  });
}

// 清除历史
function clearHistory() {
  if (!confirm('确定要清除所有搜索历史吗？')) return;

  chrome.storage.local.set({ searchHistory: [] }, () => {
    loadDataStats();
    showToast('历史已清除', 'success');
  });
}

// 清除缓存
function clearCache() {
  if (!confirm('确定要清除所有缓存吗？')) return;

  chrome.runtime.sendMessage({ type: 'CLEAR_CACHE' }, () => {
    loadDataStats();
    showToast('缓存已清除', 'success');
  });
}

// 导出所有数据
async function exportAllData() {
  const syncData = await new Promise((resolve) => {
    chrome.storage.sync.get(null, resolve);
  });

  const localData = await new Promise((resolve) => {
    chrome.storage.local.get(null, resolve);
  });

  const exportData = {
    sync: syncData,
    local: localData,
    exportedAt: new Date().toISOString(),
    version: '1.0.0'
  };

  const dataStr = JSON.stringify(exportData, null, 2);
  const dataUri =
    'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);

  const link = document.createElement('a');
  link.href = dataUri;
  link.download = `contact_query_backup_${new Date().toISOString().split('T')[0]}.json`;
  link.click();

  showToast('数据已导出', 'success');
}

// 导入数据
function importData(event) {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);

      if (data.sync) {
        chrome.storage.sync.set(data.sync);
      }

      if (data.local) {
        chrome.storage.local.set(data.local);
      }

      showToast('数据导入成功', 'success');

      // 重新加载设置
      loadSettings();
      loadTabData('data');
    } catch (error) {
      showToast('导入失败：文件格式错误', 'error');
    }
  };

  reader.readAsText(file);
}

// 重置所有
function resetAll() {
  if (!confirm('确定要重置所有设置吗？此操作不可恢复！')) return;
  if (!confirm('再次确认：这将清除所有数据并恢复默认设置')) return;

  // 清除所有存储
  chrome.storage.sync.clear();
  chrome.storage.local.clear();

  // 设置默认值
  chrome.storage.sync.set(
    {
      apiUrl: 'http://localhost:3000',
      displayMode: 'sidebar',
      autoDetect: true,
      highlightResults: true,
      cacheEnabled: true,
      cacheTTL: 300000,
      resultLimit: 10,
      theme: 'light'
    },
    () => {
      showToast('已恢复默认设置', 'success');
      loadSettings();
      loadTabData('data');
    }
  );
}

// 显示提示
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;

  setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}
