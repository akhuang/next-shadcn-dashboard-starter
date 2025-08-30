const Redis = require('ioredis');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const { spawn } = require('child_process');

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
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  log(`\n🧪 Testing: ${name}`, 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Generate test Excel file
function generateTestExcel(filePath, type = 'contacts') {
  const wb = XLSX.utils.book_new();

  if (type === 'navigation') {
    const data = [
      ['类别', '名字', '链接', '说明'],
      ['开发工具', 'GitHub', 'https://github.com', '代码托管平台'],
      ['开发工具', 'VS Code', 'https://code.visualstudio.com', '代码编辑器'],
      ['文档', 'MDN', 'https://developer.mozilla.org', 'Web开发文档'],
      ['文档', 'React Docs', 'https://react.dev', 'React官方文档'],
      ['AI工具', 'ChatGPT', 'https://chat.openai.com', 'AI聊天助手'],
      ['AI工具', 'Claude', 'https://claude.ai', 'Anthropic AI助手']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Navigation');
  } else {
    // Contacts or reports data
    const data = [
      ['姓名', '部门', '职位', '邮箱', '电话'],
      ['张三', '技术部', '工程师', 'zhangsan@example.com', '13800138001'],
      ['李四', '产品部', '产品经理', 'lisi@example.com', '13800138002'],
      ['王五', '市场部', '市场专员', 'wangwu@example.com', '13800138003'],
      ['赵六', '技术部', '架构师', 'zhaoliu@example.com', '13800138004'],
      ['陈七', '运营部', '运营总监', 'chenqi@example.com', '13800138005']
    ];

    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

    // Add second sheet for multi-sheet testing
    const data2 = [
      ['产品名', '分类', '价格', '库存'],
      ['产品A', '电子产品', '999', '100'],
      ['产品B', '家居用品', '199', '200'],
      ['产品C', '办公用品', '59', '500']
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(data2);
    XLSX.utils.book_append_sheet(wb, ws2, 'Products');
  }

  XLSX.writeFile(wb, filePath);
  return filePath;
}

// Update Excel file with new data
function updateTestExcel(filePath, type = 'contacts') {
  const wb = XLSX.utils.book_new();

  if (type === 'navigation') {
    const data = [
      ['类别', '名字', '链接', '说明'],
      ['开发工具', 'GitHub', 'https://github.com', '代码托管平台 - 更新'],
      ['开发工具', 'GitLab', 'https://gitlab.com', '新增的代码托管平台'],
      ['测试工具', 'Jest', 'https://jestjs.io', '测试框架'],
      ['测试工具', 'Cypress', 'https://cypress.io', 'E2E测试工具']
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Navigation');
  } else {
    const data = [
      ['姓名', '部门', '职位', '邮箱', '电话', '更新时间'],
      [
        '张三',
        '技术部',
        '高级工程师',
        'zhangsan@example.com',
        '13800138001',
        new Date().toISOString()
      ],
      [
        '新员工',
        '技术部',
        '前端工程师',
        'new@example.com',
        '13800138999',
        new Date().toISOString()
      ]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'UpdatedSheet');
  }

  XLSX.writeFile(wb, filePath);
  return filePath;
}

// Setup test directories
async function setupTestDirs() {
  for (const [name, dir] of Object.entries(TEST_DIRS)) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      log(`Created test directory: ${dir}`, 'blue');
    } else {
      // Clean existing files
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.xlsx') || file.endsWith('.xls')) {
          fs.unlinkSync(path.join(dir, file));
        }
      }
      log(`Cleaned test directory: ${dir}`, 'blue');
    }
  }
}

// Start the monitor service
function startMonitorService() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Starting Excel Monitor Service...', 'bright');

    const service = spawn('node', ['index-enhanced.js'], {
      cwd: __dirname,
      env: {
        ...process.env,
        EXCEL_WATCH_DIR: TEST_DIRS.contacts,
        NAVIGATION_EXCEL_DIR: TEST_DIRS.navigation,
        REPORTS_BUSINESS1_DIR: TEST_DIRS.reports
      }
    });

    service.stdout.on('data', (data) => {
      console.log(`[SERVICE] ${data.toString().trim()}`);
    });

    service.stderr.on('data', (data) => {
      console.error(`[SERVICE ERROR] ${data.toString().trim()}`);
    });

    service.on('error', reject);

    // Wait for service to initialize
    setTimeout(() => resolve(service), 3000);
  });
}

// Wait for cache to be updated
async function waitForCache(timeout = 5000) {
  return new Promise((resolve) => setTimeout(resolve, timeout));
}

// Test 1: Initial file processing
async function testInitialProcessing() {
  logTest('Initial File Processing');

  // Create test files
  const contactFile = generateTestExcel(
    path.join(TEST_DIRS.contacts, 'contacts.xlsx'),
    'contacts'
  );
  const navFile = generateTestExcel(
    path.join(TEST_DIRS.navigation, 'navigation.xlsx'),
    'navigation'
  );
  const reportFile = generateTestExcel(
    path.join(TEST_DIRS.reports, 'report.xlsx'),
    'reports'
  );

  log('Created test files', 'blue');

  // Wait for processing
  await waitForCache();

  // Check Redis for cached data
  const contactFiles = await redis.get('excel:files');
  const navData = await redis.get('navigation:data');
  const reportFiles = await redis.get('reports:business1:files');

  if (contactFiles) {
    const files = JSON.parse(contactFiles);
    logSuccess(`Contacts: Found ${files.length} files in cache`);
  } else {
    logError('Contacts: No files found in cache');
  }

  if (navData) {
    const categories = JSON.parse(navData);
    logSuccess(`Navigation: Found ${categories.length} categories in cache`);
  } else {
    logError('Navigation: No data found in cache');
  }

  if (reportFiles) {
    const files = JSON.parse(reportFiles);
    logSuccess(`Reports: Found ${files.length} files in cache`);
  } else {
    logError('Reports: No files found in cache');
  }
}

// Test 2: File update detection
async function testFileUpdate() {
  logTest('File Update Detection');

  // Get initial cache versions
  const initialContactStatus = await redis.get(
    'excel:file:contacts.xlsx:cache_status'
  );
  const initialNavStatus = await redis.get('navigation:file_status');

  const initialContactVersion = initialContactStatus
    ? JSON.parse(initialContactStatus).cacheVersion
    : null;
  const initialNavVersion = initialNavStatus
    ? JSON.parse(initialNavStatus).cacheVersion
    : null;

  log('Initial versions captured', 'blue');

  // Update files
  updateTestExcel(path.join(TEST_DIRS.contacts, 'contacts.xlsx'), 'contacts');
  updateTestExcel(
    path.join(TEST_DIRS.navigation, 'navigation.xlsx'),
    'navigation'
  );

  log('Files updated', 'blue');

  // Wait for processing
  await waitForCache();

  // Check if cache was updated
  const updatedContactStatus = await redis.get(
    'excel:file:contacts.xlsx:cache_status'
  );
  const updatedNavStatus = await redis.get('navigation:file_status');

  const updatedContactVersion = updatedContactStatus
    ? JSON.parse(updatedContactStatus).cacheVersion
    : null;
  const updatedNavVersion = updatedNavStatus
    ? JSON.parse(updatedNavStatus).cacheVersion
    : null;

  if (
    updatedContactVersion &&
    updatedContactVersion !== initialContactVersion
  ) {
    logSuccess(
      `Contacts: Cache version updated (${initialContactVersion} → ${updatedContactVersion})`
    );
  } else {
    logError('Contacts: Cache version not updated');
  }

  if (updatedNavVersion && updatedNavVersion !== initialNavVersion) {
    logSuccess(
      `Navigation: Cache version updated (${initialNavVersion} → ${updatedNavVersion})`
    );
  } else {
    logError('Navigation: Cache version not updated');
  }
}

// Test 3: File addition
async function testFileAddition() {
  logTest('New File Addition');

  // Add new files
  const newContact = generateTestExcel(
    path.join(TEST_DIRS.contacts, 'new_contacts.xlsx'),
    'contacts'
  );
  const newReport = generateTestExcel(
    path.join(TEST_DIRS.reports, 'new_report.xlsx'),
    'reports'
  );

  log('Added new files', 'blue');

  // Wait for processing
  await waitForCache();

  // Check if new files are in cache
  const contactFiles = await redis.get('excel:files');
  const reportFiles = await redis.get('reports:business1:files');

  if (contactFiles) {
    const files = JSON.parse(contactFiles);
    if (files.includes('new_contacts.xlsx')) {
      logSuccess('Contacts: New file detected and cached');
    } else {
      logError('Contacts: New file not found in cache');
    }
  }

  if (reportFiles) {
    const files = JSON.parse(reportFiles);
    if (files.includes('new_report.xlsx')) {
      logSuccess('Reports: New file detected and cached');
    } else {
      logError('Reports: New file not found in cache');
    }
  }
}

// Test 4: File deletion
async function testFileDeletion() {
  logTest('File Deletion');

  // Delete files
  const contactToDelete = path.join(TEST_DIRS.contacts, 'new_contacts.xlsx');
  const navToDelete = path.join(TEST_DIRS.navigation, 'navigation.xlsx');

  if (fs.existsSync(contactToDelete)) {
    fs.unlinkSync(contactToDelete);
    log('Deleted contacts file', 'blue');
  }

  if (fs.existsSync(navToDelete)) {
    fs.unlinkSync(navToDelete);
    log('Deleted navigation file', 'blue');
  }

  // Wait for processing
  await waitForCache();

  // Check cache consistency
  const contactFiles = await redis.get('excel:files');
  const navInvalid = await redis.get('navigation:cache:invalid');

  if (contactFiles) {
    const files = JSON.parse(contactFiles);
    if (!files.includes('new_contacts.xlsx')) {
      logSuccess('Contacts: Deleted file removed from cache');
    } else {
      logError('Contacts: Deleted file still in cache');
    }
  }

  if (navInvalid === 'true') {
    logSuccess('Navigation: Cache marked as invalid after deletion');
  } else {
    logWarning('Navigation: Cache not marked as invalid');
  }
}

// Test 5: Multi-sheet support
async function testMultiSheetSupport() {
  logTest('Multi-Sheet Support');

  const contactFile = 'contacts.xlsx';
  const sheets = await redis.get(`excel:file:${contactFile}:sheets`);

  if (sheets) {
    const sheetList = JSON.parse(sheets);
    if (sheetList.length > 1) {
      logSuccess(`Found ${sheetList.length} sheets: ${sheetList.join(', ')}`);

      // Check data for each sheet
      for (const sheet of sheetList) {
        const data = await redis.get(
          `excel:sheet:${contactFile}:${sheet}:data:1`
        );
        if (data) {
          const rows = JSON.parse(data);
          logSuccess(`  Sheet '${sheet}': ${rows.length} rows cached`);
        }
      }
    } else {
      logWarning('Only one sheet found');
    }
  } else {
    logError('No sheet information found');
  }
}

// Test 6: Service status monitoring
async function testServiceStatus() {
  logTest('Service Status Monitoring');

  const status = await redis.get('monitor:service:status');

  if (status) {
    const serviceStatus = JSON.parse(status);
    logSuccess(`Service status: ${serviceStatus.status}`);
    log(`  Uptime: ${Math.floor(serviceStatus.uptime)}s`, 'blue');
    log(
      `  Memory: ${Math.round(serviceStatus.memoryUsage.heapUsed / 1024 / 1024)}MB`,
      'blue'
    );

    // Check monitors
    for (const [type, monitor] of Object.entries(serviceStatus.monitors)) {
      log(`  ${type}: ${monitor.filesProcessed} files processed`, 'blue');
    }

    if (serviceStatus.errors && serviceStatus.errors.length > 0) {
      logWarning(`  Errors: ${serviceStatus.errors.length}`);
    }
  } else {
    logError('No service status found');
  }
}

// Test 7: Concurrent processing
async function testConcurrentProcessing() {
  logTest('Concurrent Multi-Source Processing');

  // Create multiple files simultaneously
  const files = [
    generateTestExcel(path.join(TEST_DIRS.contacts, 'batch1.xlsx'), 'contacts'),
    generateTestExcel(path.join(TEST_DIRS.contacts, 'batch2.xlsx'), 'contacts'),
    generateTestExcel(
      path.join(TEST_DIRS.navigation, 'nav_new.xlsx'),
      'navigation'
    ),
    generateTestExcel(
      path.join(TEST_DIRS.reports, 'report_batch.xlsx'),
      'reports'
    )
  ];

  log(`Created ${files.length} files simultaneously`, 'blue');

  // Wait for processing
  await waitForCache(8000);

  // Check if all files were processed
  const contactFiles = await redis.get('excel:files');
  const reportFiles = await redis.get('reports:business1:files');
  const navData = await redis.get('navigation:data');

  let successCount = 0;

  if (contactFiles) {
    const files = JSON.parse(contactFiles);
    if (files.includes('batch1.xlsx') && files.includes('batch2.xlsx')) {
      logSuccess('Contacts: Both batch files processed');
      successCount += 2;
    }
  }

  if (reportFiles) {
    const files = JSON.parse(reportFiles);
    if (files.includes('report_batch.xlsx')) {
      logSuccess('Reports: Batch file processed');
      successCount += 1;
    }
  }

  if (navData) {
    logSuccess('Navigation: Data processed');
    successCount += 1;
  }

  log(
    `Processed ${successCount}/4 files concurrently`,
    successCount === 4 ? 'green' : 'yellow'
  );
}

// Main test runner
async function runTests() {
  let service;

  try {
    // Setup
    await setupTestDirs();
    service = await startMonitorService();

    log('\n' + '='.repeat(60), 'bright');
    log('STARTING EXCEL MONITOR SERVICE TESTS', 'bright');
    log('='.repeat(60), 'bright');

    // Run tests
    await testInitialProcessing();
    await testFileUpdate();
    await testFileAddition();
    await testFileDeletion();
    await testMultiSheetSupport();
    await testServiceStatus();
    await testConcurrentProcessing();

    // Summary
    log('\n' + '='.repeat(60), 'bright');
    log('TEST SUITE COMPLETED', 'bright');
    log('='.repeat(60), 'bright');
  } catch (error) {
    logError(`Test failed: ${error.message}`);
    console.error(error);
  } finally {
    // Cleanup
    if (service) {
      log('\n🛑 Stopping monitor service...', 'yellow');
      service.kill('SIGTERM');
    }

    // Close Redis connection
    await redis.quit();

    setTimeout(() => process.exit(0), 2000);
  }
}

// Run tests
runTests();
