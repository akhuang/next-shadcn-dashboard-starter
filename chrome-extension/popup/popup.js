// Popup 脚本

document.addEventListener('DOMContentLoaded', async () => {
  // 初始化
  await init();

  // 绑定事件
  bindEvents();

  // 加载数据
  await loadData();

  // 测试连接
  await testConnection();
});

// 初始化
async function init() {
  // 聚焦搜索框
  const searchInput = document.getElementById('searchInput');
  searchInput.focus();
}

// 绑定事件
function bindEvents() {
  // 搜索
  document.getElementById('searchBtn').addEventListener('click', performSearch);
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      performSearch();
    }
  });

  // 快捷操作
  document
    .getElementById('openSidebarBtn')
    .addEventListener('click', openSidebar);
  document
    .getElementById('detectTablesBtn')
    .addEventListener('click', detectTables);
  document
    .getElementById('batchSearchBtn')
    .addEventListener('click', batchSearch);

  // 历史记录
  document
    .getElementById('clearHistoryBtn')
    .addEventListener('click', clearHistory);

  // 收藏
  document
    .getElementById('viewAllFavoritesBtn')
    .addEventListener('click', viewAllFavorites);

  // 底部按钮
  document
    .getElementById('settingsBtn')
    .addEventListener('click', openSettings);
  document.getElementById('helpBtn').addEventListener('click', openHelp);
  document.getElementById('exportBtn').addEventListener('click', exportData);
}

// 加载数据
async function loadData() {
  // 加载搜索历史
  await loadSearchHistory();

  // 加载收藏
  await loadFavorites();

  // 加载统计
  await loadStats();
}

// 执行搜索
async function performSearch() {
  const searchInput = document.getElementById('searchInput');
  const query = searchInput.value.trim();

  if (!query) {
    return;
  }

  // 获取当前标签页
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  // 发送搜索消息到内容脚本
  chrome.tabs.sendMessage(tab.id, {
    type: 'POPUP_SEARCH',
    payload: { query }
  });

  // 关闭弹窗
  window.close();
}

// 打开侧边栏
async function openSidebar() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, {
    type: 'OPEN_SIDEBAR'
  });

  window.close();
}

// 检测表格
async function detectTables() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, {
    type: 'DETECT_TABLES'
  });

  window.close();
}

// 批量查询
async function batchSearch() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, {
    type: 'BATCH_SEARCH'
  });

  window.close();
}

// 加载搜索历史
async function loadSearchHistory() {
  chrome.storage.local.get('searchHistory', (result) => {
    const history = result.searchHistory || [];
    const historyList = document.getElementById('historyList');

    if (history.length === 0) {
      historyList.innerHTML = '<div class="empty-state">暂无搜索记录</div>';
      return;
    }

    const historyHTML = history
      .slice(0, 5)
      .map((item) => {
        const timeAgo = getTimeAgo(item.timestamp);
        return `
        <div class="history-item" data-query="${item.query}">
          <span class="history-text">${item.query}</span>
          <span class="history-time">${timeAgo}</span>
        </div>
      `;
      })
      .join('');

    historyList.innerHTML = historyHTML;

    // 绑定点击事件
    historyList.querySelectorAll('.history-item').forEach((item) => {
      item.addEventListener('click', () => {
        document.getElementById('searchInput').value = item.dataset.query;
        performSearch();
      });
    });
  });
}

// 加载收藏
async function loadFavorites() {
  chrome.storage.local.get('favorites', (result) => {
    const favorites = result.favorites || [];
    const favoritesList = document.getElementById('favoritesList');

    if (favorites.length === 0) {
      favoritesList.innerHTML = '<div class="empty-state">暂无收藏</div>';
      return;
    }

    const favoritesHTML = favorites
      .slice(0, 3)
      .map((contact) => {
        const name = contact['姓名'] || contact.name || '未知';
        const detail =
          contact['电话'] ||
          contact.phone ||
          contact['邮箱'] ||
          contact.email ||
          '';
        const avatar = name.charAt(0);

        return `
        <div class="favorite-item" data-contact='${JSON.stringify(contact)}'>
          <div class="favorite-avatar">${avatar}</div>
          <div class="favorite-info">
            <div class="favorite-name">${name}</div>
            <div class="favorite-detail">${detail}</div>
          </div>
          <button class="favorite-remove" data-contact='${JSON.stringify(contact)}'>×</button>
        </div>
      `;
      })
      .join('');

    favoritesList.innerHTML = favoritesHTML;

    // 绑定点击事件
    favoritesList.querySelectorAll('.favorite-item').forEach((item) => {
      item.addEventListener('click', (e) => {
        if (!e.target.classList.contains('favorite-remove')) {
          const contact = JSON.parse(item.dataset.contact);
          searchContact(contact);
        }
      });
    });

    // 绑定删除事件
    favoritesList.querySelectorAll('.favorite-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const contact = JSON.parse(btn.dataset.contact);
        removeFavorite(contact);
      });
    });
  });
}

// 加载统计
async function loadStats() {
  chrome.storage.local.get('stats', (result) => {
    const stats = result.stats || {
      totalSearches: 0,
      successfulSearches: 0,
      failedSearches: 0,
      lastSearchDate: null
    };

    // 更新总查询数
    document.getElementById('totalSearches').textContent = stats.totalSearches;

    // 计算成功率
    const successRate =
      stats.totalSearches > 0
        ? Math.round((stats.successfulSearches / stats.totalSearches) * 100)
        : 0;
    document.getElementById('successRate').textContent = `${successRate}%`;

    // 今日查询（简化：如果最后查询是今天，显示总数，否则显示0）
    const today = new Date().toDateString();
    const lastSearchDate = stats.lastSearchDate
      ? new Date(stats.lastSearchDate).toDateString()
      : '';
    const todaySearches = today === lastSearchDate ? stats.totalSearches : 0;
    document.getElementById('todaySearches').textContent = todaySearches;
  });
}

// 清除历史
async function clearHistory() {
  if (confirm('确定要清除所有搜索历史吗？')) {
    chrome.storage.local.set({ searchHistory: [] }, () => {
      loadSearchHistory();
    });
  }
}

// 查看全部收藏
function viewAllFavorites() {
  chrome.runtime.openOptionsPage();
}

// 搜索联系人
function searchContact(contact) {
  const query = contact['姓名'] || contact.name || '';
  document.getElementById('searchInput').value = query;
  performSearch();
}

// 移除收藏
async function removeFavorite(contact) {
  chrome.storage.local.get('favorites', (result) => {
    let favorites = result.favorites || [];

    favorites = favorites.filter(
      (fav) => JSON.stringify(fav) !== JSON.stringify(contact)
    );

    chrome.storage.local.set({ favorites }, () => {
      loadFavorites();
    });
  });
}

// 打开设置
function openSettings() {
  chrome.runtime.openOptionsPage();
}

// 打开帮助
function openHelp() {
  chrome.tabs.create({
    url: 'https://github.com/yourusername/contact-query-extension/wiki'
  });
}

// 导出数据
async function exportData() {
  chrome.runtime.sendMessage({ type: 'EXPORT_DATA' }, (response) => {
    if (response && response.success) {
      alert('数据已导出');
    }
  });
}

// 测试连接
async function testConnection() {
  const statusElement = document.getElementById('connectionStatus');
  const statusText = statusElement.querySelector('.status-text');

  statusText.textContent = '连接中...';
  statusElement.className = 'connection-status';

  chrome.runtime.sendMessage({ type: 'TEST_CONNECTION' }, (response) => {
    if (response && response.success) {
      statusText.textContent = '已连接';
      statusElement.className = 'connection-status connected';
    } else {
      statusText.textContent = '连接失败';
      statusElement.className = 'connection-status error';
    }
  });
}

// 获取时间差
function getTimeAgo(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;

  return new Date(timestamp).toLocaleDateString();
}
