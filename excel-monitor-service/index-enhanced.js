const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const Redis = require('ioredis');
const chokidar = require('chokidar');

// Load environment variables
require('dotenv').config();

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    console.log(`Redis connection retry #${times}, delay: ${delay}ms`);
    return delay;
  },
  maxRetriesPerRequest: 3
});

// Monitor configurations
const MONITOR_CONFIGS = {
  contacts: {
    watchDir: process.env.EXCEL_WATCH_DIR || '/tmp/test-contacts',
    redisPrefix: 'excel',
    processor: 'default'
  },
  navigation: {
    watchDir: process.env.NAVIGATION_EXCEL_DIR || '/tmp/test-navigation',
    redisPrefix: 'navigation',
    processor: 'navigation'
  }
};

// Redis key patterns for navigation
const NAVIGATION_REDIS_KEYS = {
  DATA: 'navigation:data',
  USER_DATA: (userId) => `navigation:user:${userId}`,
  LAST_UPDATE: 'navigation:last_update',
  FILE_STATUS: 'navigation:file_status'
};

// Redis key patterns for contacts
const CONTACT_REDIS_KEYS = {
  FILES: 'excel:files',
  FILE_SHEETS: (fileName) => `excel:file:${fileName}:sheets`,
  SHEET_INFO: (fileName, sheetName) =>
    `excel:sheet:${fileName}:${sheetName}:info`,
  SHEET_DATA: (fileName, sheetName, page) =>
    `excel:sheet:${fileName}:${sheetName}:data:${page}`,
  SHEET_TOTAL: (fileName, sheetName) =>
    `excel:sheet:${fileName}:${sheetName}:total`,
  LAST_UPDATE: 'excel:last_update',
  CACHE_STATUS: 'excel:cache:status',
  FILE_STATUS: (fileName) => `excel:file:${fileName}:cache_status`
};

const CACHE_TTL = {
  DEFAULT: 3600,
  SHEET_DATA: 1800,
  NAVIGATION: 86400 // 24 hours for navigation data
};

// Configuration
const PAGE_SIZE = 100;
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb'];

// Processing queues per monitor type
const processingQueues = new Map();
const isProcessing = new Map();

// Service status
let serviceStatus = {
  status: 'idle',
  lastUpdate: null,
  monitors: {},
  errors: []
};

// Initialize service
async function initService() {
  console.log('Enhanced Excel Monitor Service starting...');
  console.log(
    `Redis host: ${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || '6379'}`
  );

  // Test Redis connection
  try {
    await redis.ping();
    console.log('Redis connection successful');
  } catch (error) {
    console.error('Failed to connect to Redis:', error.message);
    process.exit(1);
  }

  // Initialize monitors
  for (const [type, config] of Object.entries(MONITOR_CONFIGS)) {
    console.log(`Initializing ${type} monitor...`);
    console.log(`  Watch directory: ${config.watchDir}`);

    // Create directories if they don't exist
    if (!fs.existsSync(config.watchDir)) {
      fs.mkdirSync(config.watchDir, { recursive: true });
      console.log(`  Created directory: ${config.watchDir}`);
    }

    // Initialize processing queue
    processingQueues.set(type, new Map());
    isProcessing.set(type, false);

    // Initialize status
    serviceStatus.monitors[type] = {
      filesProcessed: 0,
      currentFile: null,
      watchDir: config.watchDir
    };

    // Initial scan
    await scanDirectory(type, config);

    // Setup file watcher
    setupWatcher(type, config);
  }

  // Setup periodic status update
  setInterval(updateServiceStatus, 5000);

  console.log('Enhanced Excel Monitor Service started successfully');
}

// Scan directory for Excel files
async function scanDirectory(type, config) {
  console.log(`[${type}] Scanning directory for Excel files...`);
  serviceStatus.monitors[type].status = 'scanning';

  try {
    const files = fs.readdirSync(config.watchDir);
    const excelFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    console.log(`[${type}] Found ${excelFiles.length} Excel files`);

    // Initialize FILES list for contacts
    if (config.processor === 'default') {
      await updateFilesList('reset', excelFiles);
    }

    // Process each file
    for (const file of excelFiles) {
      await addToQueue(type, file, config);
    }

    // Process queue
    await processQueue(type, config);
  } catch (error) {
    console.error(`[${type}] Error scanning directory:`, error);
    serviceStatus.errors.push({
      time: new Date(),
      type,
      error: error.message
    });
  }
}

// Setup file watcher
function setupWatcher(type, config) {
  const watcher = chokidar.watch(config.watchDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 100
    }
  });

  watcher
    .on('add', async (filePath) => {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        console.log(`[${type}] New file detected: ${fileName}`);
        await addToQueue(type, fileName, config);
        await processQueue(type, config);
      }
    })
    .on('change', async (filePath) => {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        console.log(`[${type}] File changed: ${fileName}`);
        await addToQueue(type, fileName, config);
        await processQueue(type, config);
      }
    })
    .on('unlink', async (filePath) => {
      const fileName = path.basename(filePath);
      console.log(`[${type}] File removed: ${fileName}`);

      if (config.processor === 'navigation') {
        // For navigation, we might want to keep the cache
        console.log(`[${type}] Navigation file removed, cache retained`);
      } else {
        await removeFileFromCache(type, fileName, config);
      }
    })
    .on('error', (error) => {
      console.error(`[${type}] Watcher error:`, error);
      serviceStatus.errors.push({
        time: new Date(),
        type,
        error: error.message
      });
    });

  console.log(`[${type}] File watcher initialized`);
}

// Add file to processing queue
async function addToQueue(type, fileName, config) {
  const filePath = path.join(config.watchDir, fileName);
  const queue = processingQueues.get(type);

  try {
    const stats = fs.statSync(filePath);
    queue.set(fileName, {
      fileName,
      filePath,
      modifiedTime: stats.mtime,
      size: stats.size
    });
    console.log(`[${type}] Added to queue: ${fileName}`);
  } catch (error) {
    console.error(
      `[${type}] Error adding ${fileName} to queue:`,
      error.message
    );
  }
}

// Process queue
async function processQueue(type, config) {
  const queue = processingQueues.get(type);

  if (isProcessing.get(type) || queue.size === 0) {
    return;
  }

  isProcessing.set(type, true);
  serviceStatus.monitors[type].status = 'processing';

  for (const [fileName, fileInfo] of queue) {
    try {
      console.log(`[${type}] Processing: ${fileName}`);
      serviceStatus.monitors[type].currentFile = fileName;

      if (config.processor === 'navigation') {
        await processNavigationFile(fileInfo, config);
      } else {
        await processContactFile(fileInfo, config);
      }

      serviceStatus.monitors[type].filesProcessed++;
      queue.delete(fileName);
    } catch (error) {
      console.error(`[${type}] Error processing ${fileName}:`, error.message);
      serviceStatus.errors.push({
        time: new Date(),
        type,
        file: fileName,
        error: error.message
      });
      queue.delete(fileName);
    }
  }

  serviceStatus.monitors[type].currentFile = null;
  serviceStatus.monitors[type].status = 'idle';
  serviceStatus.lastUpdate = new Date();
  isProcessing.set(type, false);
}

// Process navigation Excel file
async function processNavigationFile(fileInfo, config) {
  const { fileName, filePath, modifiedTime, size } = fileInfo;

  console.log(
    `[navigation] Reading file: ${fileName} (${(size / 1024).toFixed(2)} KB)`
  );

  // Read file
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellDates: true
  });

  const allNavigationData = [];

  // Process first sheet only for navigation
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];

  // Convert to JSON with headers
  const jsonData = XLSX.utils.sheet_to_json(worksheet);

  // Transform data for navigation
  const categoryMap = new Map();

  jsonData.forEach((row, index) => {
    const item = {
      id: `nav-${Date.now()}-${index}`,
      category: row['类别'] || row['Category'] || '未分类',
      name: row['名字'] || row['Name'] || '',
      url: row['链接'] || row['Link'] || row['URL'] || '',
      description: row['说明'] || row['Description'] || '',
      isExternal: (row['链接'] || row['Link'] || row['URL'] || '').startsWith(
        'http'
      )
    };

    if (!categoryMap.has(item.category)) {
      categoryMap.set(item.category, []);
    }
    categoryMap.get(item.category).push(item);
  });

  const categories = Array.from(categoryMap.entries()).map(([name, items]) => ({
    id: name.toLowerCase().replace(/\s+/g, '-'),
    name,
    items
  }));

  // Store in Redis
  await redis.set(
    NAVIGATION_REDIS_KEYS.DATA,
    JSON.stringify(categories)
    // 移除 TTL - 缓存永久有效，仅在文件更新时刷新
  );

  await redis.set(
    NAVIGATION_REDIS_KEYS.LAST_UPDATE,
    new Date().toISOString()
    // 移除 TTL
  );

  await redis.set(
    NAVIGATION_REDIS_KEYS.FILE_STATUS,
    JSON.stringify({
      fileName,
      lastModified: modifiedTime,
      size: size,
      itemCount: jsonData.length,
      categoryCount: categories.length,
      cached: true
    })
    // 移除 TTL
  );

  console.log(
    `[navigation] Completed processing: ${fileName} (${jsonData.length} items in ${categories.length} categories)`
  );
}

// Process contact Excel file (existing logic)
async function processContactFile(fileInfo, config) {
  const { fileName, filePath, modifiedTime, size } = fileInfo;

  console.log(
    `[contacts] Reading file: ${fileName} (${(size / 1024).toFixed(2)} KB)`
  );

  // Read file
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellStyles: true,
    cellNF: true,
    cellDates: true
  });

  const sheetNames = [];

  // Process each sheet (existing contact processing logic)
  for (const sheetName of workbook.SheetNames) {
    sheetNames.push(sheetName);
    const worksheet = workbook.Sheets[sheetName];

    // Get range and merges
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const merges = worksheet['!merges'] || [];

    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false
    });

    // Process merged cells
    const processedData = processMergedCells(jsonData, merges);

    // Store in pages (existing logic)
    const PAGE_SIZE = 100;
    const totalPages = Math.ceil(processedData.length / PAGE_SIZE);

    for (let page = 1; page <= totalPages; page++) {
      const startIdx = (page - 1) * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, processedData.length);
      const pageData = processedData.slice(startIdx, endIdx);

      await redis.set(
        CONTACT_REDIS_KEYS.SHEET_DATA(fileName, sheetName, page),
        JSON.stringify(pageData)
        // 移除 TTL - 缓存永久有效，仅在文件更新时刷新
      );
    }

    await redis.set(
      CONTACT_REDIS_KEYS.SHEET_TOTAL(fileName, sheetName),
      processedData.length
      // 移除 TTL
    );

    console.log(
      `[contacts]   - Processed sheet: ${sheetName} (${processedData.length} rows)`
    );
  }

  // Store file metadata
  await redis.set(
    CONTACT_REDIS_KEYS.FILE_SHEETS(fileName),
    JSON.stringify(sheetNames)
    // 移除 TTL - 缓存永久有效，仅在文件更新时刷新
  );

  await redis.set(
    CONTACT_REDIS_KEYS.FILE_STATUS(fileName),
    JSON.stringify({
      cached: true,
      lastModified: modifiedTime,
      size: size,
      sheets: sheetNames
    })
    // 移除 TTL
  );

  // 更新文件列表
  await updateFilesList('add', fileName);

  console.log(`[contacts] Completed processing: ${fileName}`);
}

// Process merged cells (for contacts)
function processMergedCells(data, merges) {
  const result = data.map((row) => [...row]);

  merges.forEach((merge) => {
    const startRow = merge.s.r;
    const endRow = merge.e.r;
    const startCol = merge.s.c;
    const endCol = merge.e.c;

    const value = result[startRow]?.[startCol];

    for (let r = startRow; r <= endRow && r < result.length; r++) {
      for (let c = startCol; c <= endCol && c < (result[r]?.length || 0); c++) {
        if (r === startRow && c === startCol) continue;
        if (result[r]) {
          result[r][c] = value;
        }
      }
    }
  });

  return result;
}

// Update files list in Redis
async function updateFilesList(action, fileName) {
  try {
    // Get current files list
    const filesJson = await redis.get(CONTACT_REDIS_KEYS.FILES);
    let files = filesJson ? JSON.parse(filesJson) : [];

    if (action === 'add') {
      // Add file if not exists
      if (!files.includes(fileName)) {
        files.push(fileName);
        console.log(`[contacts] Added ${fileName} to files list`);
      }
    } else if (action === 'remove') {
      // Remove file from list
      files = files.filter((f) => f !== fileName);
      console.log(`[contacts] Removed ${fileName} from files list`);
    } else if (action === 'reset') {
      // Reset with provided list (fileName is actually an array in this case)
      files = fileName;
      console.log(`[contacts] Reset files list with ${files.length} files`);
    }

    // Update Redis
    await redis.set(
      CONTACT_REDIS_KEYS.FILES,
      JSON.stringify(files)
      // 不设置 TTL，永久有效
    );
  } catch (error) {
    console.error('Error updating files list:', error.message);
  }
}

// Remove file from cache (for contacts)
async function removeFileFromCache(type, fileName, config) {
  if (config.processor === 'navigation') {
    // Navigation files are handled differently
    return;
  }

  try {
    // Get sheet names
    const sheetsJson = await redis.get(
      CONTACT_REDIS_KEYS.FILE_SHEETS(fileName)
    );
    if (sheetsJson) {
      const sheets = JSON.parse(sheetsJson);

      // Delete all sheet data
      for (const sheetName of sheets) {
        await redis.del(CONTACT_REDIS_KEYS.SHEET_INFO(fileName, sheetName));
        await redis.del(CONTACT_REDIS_KEYS.SHEET_TOTAL(fileName, sheetName));

        // Delete all pages
        const pattern = `excel:sheet:${fileName}:${sheetName}:data:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      // Delete file metadata
      await redis.del(CONTACT_REDIS_KEYS.FILE_SHEETS(fileName));
      await redis.del(CONTACT_REDIS_KEYS.FILE_STATUS(fileName));
    }

    // 更新文件列表
    await updateFilesList('remove', fileName);

    console.log(`[${type}] Removed from cache: ${fileName}`);
  } catch (error) {
    console.error(
      `[${type}] Error removing ${fileName} from cache:`,
      error.message
    );
  }
}

// Update service status in Redis
async function updateServiceStatus() {
  try {
    await redis.set(
      'monitor:service:status',
      JSON.stringify({
        ...serviceStatus,
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage(),
        timestamp: new Date().toISOString()
      }),
      'EX',
      60 // Short TTL for status
    );
  } catch (error) {
    console.error('Error updating service status:', error.message);
  }
}

// Graceful shutdown
async function shutdown() {
  console.log('Shutting down Enhanced Excel Monitor Service...');

  serviceStatus.status = 'shutting down';
  await updateServiceStatus();

  await redis.quit();

  console.log('Enhanced Excel Monitor Service stopped');
  process.exit(0);
}

// Handle signals
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  serviceStatus.errors.push({ time: new Date(), error: error.message });
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled rejection at:', promise, 'reason:', reason);
  serviceStatus.errors.push({ time: new Date(), error: String(reason) });
});

// Start service
initService().catch((error) => {
  console.error('Failed to start service:', error);
  process.exit(1);
});
