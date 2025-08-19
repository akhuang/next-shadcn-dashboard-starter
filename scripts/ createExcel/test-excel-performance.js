#!/usr/bin/env node

const https = require('http');

// 测试配置
const API_BASE = 'http://localhost:3000/api/excel';
const FILE_NAME = '测试数据.xlsx';
const SHEET_NAME = 'Sheet1';

// 性能测试函数
async function measurePerformance(name, fn) {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    console.log(`✅ ${name}: ${duration}ms`);
    return { success: true, duration, result };
  } catch (error) {
    const duration = Date.now() - start;
    console.log(`❌ ${name}: Failed after ${duration}ms - ${error.message}`);
    return { success: false, duration, error };
  }
}

// HTTP 请求函数
function httpGet(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

async function testV1Performance() {
  console.log('\n📊 测试 V1 (原版本) 性能...\n');

  // 获取所有数据
  await measurePerformance('获取所有数据', async () => {
    const result = await httpGet(`${API_BASE}?action=getData`);
    return {
      totalContacts: result.data?.contacts?.length || 0,
      files: result.data?.files?.length || 0
    };
  });
}

async function testV2Performance() {
  console.log('\n📊 测试 V2 (Redis 优化版) 性能...\n');

  // 获取文件列表
  const filesResult = await measurePerformance('获取文件列表', async () => {
    return await httpGet(`${API_BASE}/v2?action=getFiles`);
  });

  if (filesResult.success && filesResult.result.data?.files?.length > 0) {
    const firstFile = filesResult.result.data.files[0];

    // 获取sheets
    const sheetsResult = await measurePerformance(
      '获取Sheets列表',
      async () => {
        return await httpGet(
          `${API_BASE}/v2?action=getSheets&fileName=${encodeURIComponent(firstFile.fileName)}`
        );
      }
    );

    if (sheetsResult.success && sheetsResult.result.data?.length > 0) {
      const firstSheet = sheetsResult.result.data[0];

      // 获取sheet信息
      await measurePerformance('获取Sheet信息', async () => {
        return await httpGet(
          `${API_BASE}/v2?action=getSheetInfo&fileName=${encodeURIComponent(firstFile.fileName)}&sheetName=${encodeURIComponent(firstSheet)}`
        );
      });

      // 获取第一页数据
      await measurePerformance('获取第一页数据(100条)', async () => {
        return await httpGet(
          `${API_BASE}/v2?action=getSheetData&fileName=${encodeURIComponent(firstFile.fileName)}&sheetName=${encodeURIComponent(firstSheet)}&page=1&pageSize=100`
        );
      });

      // 测试搜索
      await measurePerformance('搜索数据', async () => {
        return await httpGet(
          `${API_BASE}/v2?action=search&query=test&page=1&pageSize=50`
        );
      });
    }
  }
}

async function comparePerformance() {
  console.log('====================================');
  console.log('Excel 数据处理性能测试');
  console.log('====================================');

  // 测试 V1
  await testV1Performance();

  // 测试 V2
  await testV2Performance();

  console.log('\n====================================');
  console.log('测试完成！');
  console.log('====================================');
  console.log('\n性能提升说明：');
  console.log('1. V2 版本使用 Redis 缓存，首次加载更快');
  console.log('2. V2 支持分页加载，减少内存占用');
  console.log('3. V2 支持按需加载，只传输当前需要的数据');
}

// 运行测试
comparePerformance().catch(console.error);
