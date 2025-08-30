const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { execSync } = require('child_process');

// Redis client
const redis = new Redis({
  host: 'localhost',
  port: 6379
});

// Test directories
const TEST_DIRS = {
  contacts: '/tmp/test-contacts',
  navigation: '/tmp/test-navigation',
  reports: '/tmp/reports-business1'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Generate test Excel file
function generateTestExcel(filePath, type = 'contacts') {
  const wb = XLSX.utils.book_new();

  if (type === 'navigation') {
    const data = [
      ['类别', '名字', '链接', '说明'],
      ['开发工具', 'GitHub', 'https://github.com', '代码托管平台'],
      ['开发工具', 'VS Code', 'https://code.visualstudio.com', '代码编辑器'],
      ['文档', 'MDN', 'https://developer.mozilla.org', 'Web开发文档']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Navigation');
  } else {
    const data = [
      ['姓名', '部门', '职位', '邮箱', '电话'],
      ['张三', '技术部', '工程师', 'zhangsan@example.com', '13800138001'],
      ['李四', '产品部', '产品经理', 'lisi@example.com', '13800138002']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  }

  XLSX.writeFile(wb, filePath);
}

// Setup test directories
function setupTestDirs() {
  for (const [name, dir] of Object.entries(TEST_DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Clean existing files
    const files = fs.readdirSync(dir);
    for (const file of files) {
      if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
        fs.unlinkSync(path.join(dir, file));
      }
    }
  }
  log('✅ Test directories prepared', 'green');
}

// Quick functional test
async function quickTest() {
  try {
    log('\n=== EXCEL MONITOR SERVICE QUICK TEST ===\n', 'cyan');

    // 1. Setup
    setupTestDirs();

    // 2. Start service in background
    log('Starting monitor service...', 'blue');
    execSync('node index-enhanced.js > /tmp/monitor.log 2>&1 &', {
      cwd: __dirname,
      env: {
        ...process.env,
        EXCEL_WATCH_DIR: TEST_DIRS.contacts,
        NAVIGATION_EXCEL_DIR: TEST_DIRS.navigation,
        REPORTS_BUSINESS1_DIR: TEST_DIRS.reports
      }
    });

    // Wait for service to start
    await new Promise((resolve) => setTimeout(resolve, 3000));
    log('✅ Service started', 'green');

    // 3. Create test files
    log('\n📝 Creating test files...', 'blue');
    generateTestExcel(
      path.join(TEST_DIRS.contacts, 'contacts.xlsx'),
      'contacts'
    );
    generateTestExcel(
      path.join(TEST_DIRS.navigation, 'navigation.xlsx'),
      'navigation'
    );
    generateTestExcel(path.join(TEST_DIRS.reports, 'report.xlsx'), 'reports');

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // 4. Check Redis cache
    log('\n🔍 Checking cache...', 'blue');

    // Check contacts
    const contactFiles = await redis.get('excel:files');
    if (contactFiles) {
      const files = JSON.parse(contactFiles);
      log(`✅ Contacts: ${files.length} files cached`, 'green');

      // Check sheet data
      const sheetData = await redis.get(
        'excel:sheet:contacts.xlsx:Sheet1:data:1'
      );
      if (sheetData) {
        const data = JSON.parse(sheetData);
        log(`  - Sheet data: ${data.length} rows`, 'blue');
      }
    } else {
      log('❌ Contacts: No cache found', 'red');
    }

    // Check navigation
    const navData = await redis.get('navigation:data');
    if (navData) {
      const categories = JSON.parse(navData);
      log(`✅ Navigation: ${categories.length} categories cached`, 'green');

      // Check cache version
      const navStatus = await redis.get('navigation:file_status');
      if (navStatus) {
        const status = JSON.parse(navStatus);
        log(`  - Cache version: ${status.cacheVersion}`, 'blue');
      }
    } else {
      log('❌ Navigation: No cache found', 'red');
    }

    // Check reports
    const reportFiles = await redis.get('reports:business1:files');
    if (reportFiles) {
      const files = JSON.parse(reportFiles);
      log(`✅ Reports: ${files.length} files cached`, 'green');
    } else {
      log('❌ Reports: No cache found', 'red');
    }

    // 5. Test file update
    log('\n🔄 Testing file update...', 'blue');

    // Update navigation file
    const wb = XLSX.utils.book_new();
    const data = [
      ['类别', '名字', '链接', '说明'],
      ['更新测试', 'Test', 'https://test.com', '更新后的数据']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Navigation');
    XLSX.writeFile(wb, path.join(TEST_DIRS.navigation, 'navigation.xlsx'));

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Check if cache was updated
    const updatedNavData = await redis.get('navigation:data');
    if (updatedNavData) {
      const categories = JSON.parse(updatedNavData);
      const hasUpdate = categories.some((cat) => cat.name === '更新测试');
      if (hasUpdate) {
        log('✅ Cache updated successfully', 'green');
      } else {
        log('⚠️  Cache not fully updated', 'yellow');
      }
    }

    // 6. Test file deletion
    log('\n🗑️  Testing file deletion...', 'blue');
    fs.unlinkSync(path.join(TEST_DIRS.navigation, 'navigation.xlsx'));

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const invalidFlag = await redis.get('navigation:cache:invalid');
    if (invalidFlag === 'true') {
      log('✅ Cache marked as invalid after deletion', 'green');
    } else {
      log('⚠️  Cache not marked as invalid', 'yellow');
    }

    // 7. Check service status
    log('\n📊 Service status...', 'blue');
    const serviceStatus = await redis.get('monitor:service:status');
    if (serviceStatus) {
      const status = JSON.parse(serviceStatus);
      log(`✅ Service running: ${status.status}`, 'green');
      log(
        `  - Memory: ${Math.round(status.memoryUsage.heapUsed / 1024 / 1024)}MB`,
        'blue'
      );

      Object.entries(status.monitors).forEach(([type, monitor]) => {
        log(`  - ${type}: ${monitor.filesProcessed} files processed`, 'blue');
      });
    }

    log('\n✅ ALL TESTS COMPLETED SUCCESSFULLY!\n', 'green');
  } catch (error) {
    log(`\n❌ Test failed: ${error.message}`, 'red');
    console.error(error);
  } finally {
    // Cleanup
    execSync('pkill -f "node.*index-enhanced" 2>/dev/null || true');
    await redis.quit();
    process.exit(0);
  }
}

// Run test
quickTest();
