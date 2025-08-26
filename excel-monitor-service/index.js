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

// Redis key patterns
const REDIS_KEYS = {
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
  SHEET_DATA: 1800
};

// Configuration
const WATCH_DIR = process.env.EXCEL_WATCH_DIR || '/tmp/test-contacts';
const PAGE_SIZE = 100;
const SUPPORTED_EXTENSIONS = ['.xlsx', '.xls', '.xlsm', '.xlsb'];

// Processing queue
const processingQueue = new Map();
let isProcessing = false;

// Service status
let serviceStatus = {
  status: 'idle',
  lastUpdate: null,
  filesProcessed: 0,
  currentFile: null,
  errors: []
};

// Initialize service
async function initService() {
  console.log('Excel Monitor Service starting...');
  console.log(`Watch directory: ${WATCH_DIR}`);
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

  // Create watch directory if it doesn't exist
  if (!fs.existsSync(WATCH_DIR)) {
    fs.mkdirSync(WATCH_DIR, { recursive: true });
    console.log(`Created watch directory: ${WATCH_DIR}`);
  }

  // Initial scan
  await scanDirectory();

  // Setup file watcher
  setupWatcher();

  // Setup periodic status update
  setInterval(updateServiceStatus, 5000);

  console.log('Excel Monitor Service started successfully');
}

// Scan directory for Excel files
async function scanDirectory() {
  console.log('Scanning directory for Excel files...');
  serviceStatus.status = 'scanning';

  try {
    const files = fs.readdirSync(WATCH_DIR);
    const excelFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    console.log(`Found ${excelFiles.length} Excel files`);

    // Store file list in Redis
    await redis.set(
      REDIS_KEYS.FILES,
      JSON.stringify(excelFiles),
      'EX',
      CACHE_TTL.DEFAULT
    );

    // Process each file
    for (const file of excelFiles) {
      await addToQueue(file);
    }

    // Process queue
    await processQueue();
  } catch (error) {
    console.error('Error scanning directory:', error);
    serviceStatus.errors.push({ time: new Date(), error: error.message });
  }
}

// Setup file watcher
function setupWatcher() {
  const watcher = chokidar.watch(WATCH_DIR, {
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
        console.log(`New file detected: ${fileName}`);
        await addToQueue(fileName);
        await processQueue();
      }
    })
    .on('change', async (filePath) => {
      const fileName = path.basename(filePath);
      const ext = path.extname(fileName).toLowerCase();

      if (SUPPORTED_EXTENSIONS.includes(ext)) {
        console.log(`File changed: ${fileName}`);
        await addToQueue(fileName);
        await processQueue();
      }
    })
    .on('unlink', async (filePath) => {
      const fileName = path.basename(filePath);
      console.log(`File removed: ${fileName}`);
      await removeFileFromCache(fileName);
    })
    .on('error', (error) => {
      console.error('Watcher error:', error);
      serviceStatus.errors.push({ time: new Date(), error: error.message });
    });

  console.log('File watcher initialized');
}

// Add file to processing queue
async function addToQueue(fileName) {
  const filePath = path.join(WATCH_DIR, fileName);

  try {
    const stats = fs.statSync(filePath);
    processingQueue.set(fileName, {
      fileName,
      filePath,
      modifiedTime: stats.mtime,
      size: stats.size
    });
    console.log(`Added to queue: ${fileName}`);
  } catch (error) {
    console.error(`Error adding ${fileName} to queue:`, error.message);
  }
}

// Process queue
async function processQueue() {
  if (isProcessing || processingQueue.size === 0) {
    return;
  }

  isProcessing = true;
  serviceStatus.status = 'processing';

  for (const [fileName, fileInfo] of processingQueue) {
    try {
      console.log(`Processing: ${fileName}`);
      serviceStatus.currentFile = fileName;

      await processExcelFile(fileInfo);

      serviceStatus.filesProcessed++;
      processingQueue.delete(fileName);
    } catch (error) {
      console.error(`Error processing ${fileName}:`, error.message);
      serviceStatus.errors.push({
        time: new Date(),
        file: fileName,
        error: error.message
      });
      processingQueue.delete(fileName);
    }
  }

  serviceStatus.currentFile = null;
  serviceStatus.status = 'idle';
  serviceStatus.lastUpdate = new Date();
  isProcessing = false;

  // Update file list in Redis
  await updateFilesList();

  // Update last update time
  await redis.set(REDIS_KEYS.LAST_UPDATE, new Date().toISOString());
}

// Process individual Excel file
async function processExcelFile(fileInfo) {
  const { fileName, filePath, modifiedTime, size } = fileInfo;

  console.log(`Reading file: ${fileName} (${(size / 1024).toFixed(2)} KB)`);

  // Read file
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellStyles: true,
    cellNF: true,
    cellDates: true
  });

  const sheetNames = [];

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    sheetNames.push(sheetName);
    const worksheet = workbook.Sheets[sheetName];

    // Get range and merges
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const merges = worksheet['!merges'] || [];

    // Detect title from merged cells
    let sheetTitle;
    const firstRowMerges = merges.filter(
      (m) => m.s.r === 0 && m.e.r === 0 && m.e.c > m.s.c
    );
    if (firstRowMerges.length > 0) {
      const m = firstRowMerges[0];
      const v = (
        worksheet[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })] || {}
      ).v;
      if (v && String(v).trim() !== '') {
        sheetTitle = String(v);
      }
    }

    // Convert merge ranges
    const mergeRanges = merges.map((merge) => ({
      startRow: merge.s.r,
      endRow: merge.e.r,
      startCol: merge.s.c,
      endCol: merge.e.c
    }));

    // Convert worksheet to JSON
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: '',
      blankrows: true,
      raw: false
    });

    // Process merged cells
    const processedData = processMergedCells(jsonData, merges);

    // Handle headers
    const rawHeaders = processedData[0] || [];
    const totalCols = Math.max(
      range.e.c - range.s.c + 1,
      processedData.reduce((m, r) => Math.max(m, r?.length || 0), 0)
    );
    const headerRowHasMerge = merges.some((m) => m.s.r === 0 || m.e.r === 0);
    const colLetters = Array.from({ length: totalCols }, (_, i) =>
      XLSX.utils.encode_col(range.s.c + i)
    );
    const useLettersAsHeaders =
      headerRowHasMerge ||
      rawHeaders.filter((h) => String(h ?? '').trim() !== '').length <= 1;
    const headers = useLettersAsHeaders
      ? colLetters
      : rawHeaders.map((h, i) =>
          String(h ?? '').trim() !== '' ? String(h) : colLetters[i]
        );

    // Store sheet info
    const sheetInfo = {
      name: sheetName,
      columns: headers,
      mergeRanges,
      title: sheetTitle,
      totalRows: processedData.length - (useLettersAsHeaders ? 0 : 1)
    };

    await redis.set(
      REDIS_KEYS.SHEET_INFO(fileName, sheetName),
      JSON.stringify(sheetInfo),
      'EX',
      CACHE_TTL.DEFAULT
    );

    // Paginate and store data
    const dataStartIndex = useLettersAsHeaders ? 0 : 1;
    const totalPages = Math.ceil(
      (processedData.length - dataStartIndex) / PAGE_SIZE
    );

    for (let page = 1; page <= totalPages; page++) {
      const startIdx = dataStartIndex + (page - 1) * PAGE_SIZE;
      const endIdx = Math.min(startIdx + PAGE_SIZE, processedData.length);

      const pageData = [];
      for (let i = startIdx; i < endIdx; i++) {
        const row = processedData[i] || [];
        const rowData = {};
        headers.forEach((header, index) => {
          rowData[String(header)] = row[index] || '';
        });

        const searchableText = Object.values(rowData)
          .map((v) => String(v || ''))
          .join(' ')
          .toLowerCase();

        pageData.push({
          id: `${fileName}-${sheetName}-${i}`,
          fileName,
          sheetName,
          rowData,
          searchableText,
          rowIndex: i - dataStartIndex
        });
      }

      // Store page data
      await redis.set(
        REDIS_KEYS.SHEET_DATA(fileName, sheetName, page),
        JSON.stringify(pageData),
        'EX',
        CACHE_TTL.SHEET_DATA
      );
    }

    // Store total rows
    await redis.set(
      REDIS_KEYS.SHEET_TOTAL(fileName, sheetName),
      processedData.length - dataStartIndex,
      'EX',
      CACHE_TTL.DEFAULT
    );

    console.log(
      `  - Processed sheet: ${sheetName} (${processedData.length - dataStartIndex} rows)`
    );
  }

  // Store file sheets
  await redis.set(
    REDIS_KEYS.FILE_SHEETS(fileName),
    JSON.stringify(sheetNames),
    'EX',
    CACHE_TTL.DEFAULT
  );

  // Store file status
  await redis.set(
    REDIS_KEYS.FILE_STATUS(fileName),
    JSON.stringify({
      cached: true,
      lastModified: modifiedTime,
      size: size,
      sheets: sheetNames
    }),
    'EX',
    CACHE_TTL.DEFAULT
  );

  console.log(`Completed processing: ${fileName}`);
}

// Process merged cells
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
async function updateFilesList() {
  try {
    const files = fs.readdirSync(WATCH_DIR);
    const excelFiles = files.filter((file) => {
      const ext = path.extname(file).toLowerCase();
      return SUPPORTED_EXTENSIONS.includes(ext);
    });

    console.log(`Updating file list: ${excelFiles.length} files found`);

    // Store updated file list in Redis
    await redis.set(
      REDIS_KEYS.FILES,
      JSON.stringify(excelFiles),
      'EX',
      CACHE_TTL.DEFAULT
    );

    return excelFiles;
  } catch (error) {
    console.error('Error updating files list:', error);
    return [];
  }
}

// Remove file from cache
async function removeFileFromCache(fileName) {
  try {
    // Get sheet names
    const sheetsJson = await redis.get(REDIS_KEYS.FILE_SHEETS(fileName));
    if (sheetsJson) {
      const sheets = JSON.parse(sheetsJson);

      // Delete all sheet data
      for (const sheetName of sheets) {
        // Delete sheet info
        await redis.del(REDIS_KEYS.SHEET_INFO(fileName, sheetName));
        await redis.del(REDIS_KEYS.SHEET_TOTAL(fileName, sheetName));

        // Delete all pages (scan for keys)
        const pattern = `excel:sheet:${fileName}:${sheetName}:data:*`;
        const keys = await redis.keys(pattern);
        if (keys.length > 0) {
          await redis.del(...keys);
        }
      }

      // Delete file metadata
      await redis.del(REDIS_KEYS.FILE_SHEETS(fileName));
      await redis.del(REDIS_KEYS.FILE_STATUS(fileName));
    }

    // Update file list
    await updateFilesList();

    console.log(`Removed from cache: ${fileName}`);
  } catch (error) {
    console.error(`Error removing ${fileName} from cache:`, error.message);
  }
}

// Update service status in Redis
async function updateServiceStatus() {
  try {
    await redis.set(
      REDIS_KEYS.CACHE_STATUS,
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
  console.log('Shutting down Excel Monitor Service...');

  // Clear status
  serviceStatus.status = 'shutting down';
  await updateServiceStatus();

  // Close Redis connection
  await redis.quit();

  console.log('Excel Monitor Service stopped');
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
