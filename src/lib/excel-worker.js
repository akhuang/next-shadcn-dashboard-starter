const { Worker, isMainThread, parentPort, workerData } = require('worker_threads');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const Redis = require('ioredis');

// Redis configuration
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3
});

const REDIS_KEYS = {
  FILES: 'excel:files',
  FILE_SHEETS: (fileName) => `excel:file:${fileName}:sheets`,
  SHEET_INFO: (fileName, sheetName) => `excel:sheet:${fileName}:${sheetName}:info`,
  SHEET_DATA: (fileName, sheetName, page) => `excel:sheet:${fileName}:${sheetName}:data:${page}`,
  SHEET_TOTAL: (fileName, sheetName) => `excel:sheet:${fileName}:${sheetName}:total`,
  LAST_UPDATE: 'excel:last_update'
};

const CACHE_TTL = {
  DEFAULT: 3600,
  SHEET_DATA: 1800
};

if (!isMainThread && parentPort && workerData) {
  processFiles(workerData)
    .then(() => {
      parentPort.postMessage({ type: 'complete' });
      process.exit(0);
    })
    .catch((error) => {
      parentPort.postMessage({ type: 'error', error: error.message });
      process.exit(1);
    });
}

async function processFiles({ taskId, folderPath, files }) {
  const pageSize = 100;
  let processed = 0;
  let latestModifiedTime = null;

  for (const fileName of files) {
    try {
      const filePath = path.join(folderPath, fileName);
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        continue;
      }

      // Get file stats to track modification time
      const stats = fs.statSync(filePath);
      if (!latestModifiedTime || stats.mtime > latestModifiedTime) {
        latestModifiedTime = stats.mtime;
      }

      parentPort.postMessage({
        type: 'progress',
        progress: processed,
        total: files.length,
        currentFile: fileName
      });

      // Parse Excel file
      await parseAndCacheExcelFile(filePath, fileName, pageSize);
      
      processed++;
    } catch (error) {
      console.error(`Error processing file ${fileName}:`, error);
      // Continue with next file
    }
  }

  // Update last update time with the latest file modification time
  if (latestModifiedTime) {
    await redis.set(REDIS_KEYS.LAST_UPDATE, latestModifiedTime.toISOString());
  } else {
    // If no files were processed, use current time
    await redis.set(REDIS_KEYS.LAST_UPDATE, new Date().toISOString());
  }
}

async function parseAndCacheExcelFile(filePath, fileName, pageSize) {
  const fileBuffer = fs.readFileSync(filePath);
  const workbook = XLSX.read(fileBuffer, {
    type: 'buffer',
    cellStyles: true,
    cellNF: true,
    cellDates: true
  });

  const sheetNames = [];

  for (const sheetName of workbook.SheetNames) {
    sheetNames.push(sheetName);
    const worksheet = workbook.Sheets[sheetName];
    
    // Get range and merges
    const range = XLSX.utils.decode_range(worksheet['!ref'] || 'A1');
    const merges = worksheet['!merges'] || [];
    
    // Detect title
    let sheetTitle;
    const firstRowMerges = merges.filter(
      (m) => m.s.r === 0 && m.e.r === 0 && m.e.c > m.s.c
    );
    if (firstRowMerges.length > 0) {
      const m = firstRowMerges[0];
      const v = (worksheet[XLSX.utils.encode_cell({ r: m.s.r, c: m.s.c })] || {}).v;
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
    const rawHeaders = (processedData[0] || []);
    const totalCols = Math.max(
      range.e.c - range.s.c + 1,
      processedData.reduce((m, r) => Math.max(m, r?.length || 0), 0)
    );
    const headerRowHasMerge = merges.some(
      (m) => m.s.r === 0 || m.e.r === 0
    );
    const colLetters = Array.from({ length: totalCols }, (_, i) =>
      XLSX.utils.encode_col(range.s.c + i)
    );
    const useLettersAsHeaders = headerRowHasMerge || rawHeaders.filter(
      (h) => String(h ?? '').trim() !== ''
    ).length <= 1;
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
      (processedData.length - dataStartIndex) / pageSize
    );

    for (let page = 1; page <= totalPages; page++) {
      const startIdx = dataStartIndex + (page - 1) * pageSize;
      const endIdx = Math.min(startIdx + pageSize, processedData.length);
      
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
  }

  // Store file sheets
  await redis.set(
    REDIS_KEYS.FILE_SHEETS(fileName),
    JSON.stringify(sheetNames),
    'EX',
    CACHE_TTL.DEFAULT
  );
}

function processMergedCells(data, merges) {
  const result = data.map((row) => [...row]);

  merges.forEach((merge) => {
    const startRow = merge.s.r;
    const endRow = merge.e.r;
    const startCol = merge.s.c;
    const endCol = merge.e.c;

    const value = result[startRow]?.[startCol];

    for (let r = startRow; r <= endRow && r < result.length; r++) {
      for (
        let c = startCol;
        c <= endCol && c < (result[r]?.length || 0);
        c++
      ) {
        if (r === startRow && c === startCol) continue;
        if (result[r]) {
          result[r][c] = value;
        }
      }
    }
  });

  return result;
}