/**
 * 单元测试: 检查 Excel 同步和 Redis 缓存功能
 */

const redis = require('redis');
const fs = require('fs');
const path = require('path');

// Redis 客户端配置
const redisClient = redis.createClient({
  socket: {
    host: 'localhost',
    port: 6379
  }
});

// 测试用的 Excel 文件路径
const EXCEL_FOLDER = process.env.EXCEL_WATCH_DIR || '/tmp/test-contacts';

async function testRedisConnection() {
  console.log('\n=== 测试 1: Redis 连接 ===');
  try {
    await redisClient.connect();
    console.log('✅ Redis 连接成功');

    // 测试 ping
    const pong = await redisClient.ping();
    console.log(`✅ Redis PING 响应: ${pong}`);

    return true;
  } catch (error) {
    console.error('❌ Redis 连接失败:', error.message);
    return false;
  }
}

async function testExcelFolderAccess() {
  console.log('\n=== 测试 2: Excel 文件夹访问 ===');
  console.log(`📁 检查文件夹: ${EXCEL_FOLDER}`);

  try {
    if (!fs.existsSync(EXCEL_FOLDER)) {
      console.error(`❌ Excel 文件夹不存在: ${EXCEL_FOLDER}`);
      return false;
    }

    const files = fs.readdirSync(EXCEL_FOLDER);
    const excelFiles = files.filter(
      (f) => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.xlsm')
    );

    console.log(`✅ 找到 ${excelFiles.length} 个 Excel 文件:`);
    excelFiles.forEach((file) => console.log(`   - ${file}`));

    return excelFiles.length > 0;
  } catch (error) {
    console.error('❌ 文件夹访问失败:', error.message);
    return false;
  }
}

async function testMonitorServiceStatus() {
  console.log('\n=== 测试 3: Excel 监控服务状态 ===');

  // 监控服务没有HTTP接口，通过检查Redis中的数据来验证它是否工作
  try {
    // 检查Redis中是否有文件列表键
    const filesExist = await redisClient.exists('excel:files');

    if (filesExist) {
      console.log('✅ 监控服务已更新Redis缓存');
      const lastUpdate = await redisClient.get('excel:last_update');
      if (lastUpdate) {
        console.log(
          `   最后更新: ${new Date(parseInt(lastUpdate)).toLocaleString()}`
        );
      }
    } else {
      console.log('⚠️ Redis中没有文件缓存，监控服务可能未运行');
    }

    // 检查文件监控目录
    const testFiles = fs
      .readdirSync(EXCEL_FOLDER)
      .filter(
        (f) => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.xlsm')
      );
    console.log(`   监控目录有 ${testFiles.length} 个Excel文件`);

    return filesExist > 0;
  } catch (error) {
    console.error('❌ 监控服务检查失败:', error.message);
    return false;
  }
}

async function testRedisCache() {
  console.log('\n=== 测试 4: Redis 缓存数据 ===');

  try {
    // 检查 excel:files 键
    const filesKey = 'excel:files';
    const filesData = await redisClient.get(filesKey);

    if (!filesData) {
      console.warn('⚠️ Redis 中没有缓存的文件列表 (excel:files)');
      console.log('   尝试触发缓存...');

      // 触发缓存
      await fetch('http://localhost:3001/cache');

      // 等待缓存完成
      console.log('   等待 5 秒让缓存完成...');
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const retryData = await redisClient.get(filesKey);
      if (!retryData) {
        console.error('❌ 缓存后仍然没有数据');
        return false;
      }
    }

    const files = JSON.parse(filesData || '[]');
    console.log(`✅ Redis 缓存中有 ${files.length} 个文件`);

    // 检查每个文件的详细信息
    for (const file of files.slice(0, 3)) {
      // 只检查前3个
      const fileInfoKey = `excel:file:${file.fileName}:info`;
      const fileInfo = await redisClient.get(fileInfoKey);

      if (fileInfo) {
        const info = JSON.parse(fileInfo);
        console.log(
          `   ✅ ${file.fileName}: ${info.sheets?.length || 0} 个工作表`
        );
      } else {
        console.warn(`   ⚠️ ${file.fileName}: 没有缓存的文件信息`);
      }
    }

    return files.length > 0;
  } catch (error) {
    console.error('❌ Redis 缓存检查失败:', error.message);
    return false;
  }
}

async function testAPIEndpoint() {
  console.log('\n=== 测试 5: API 端点 ===');

  try {
    // 测试 getFiles API
    const response = await fetch(
      'http://localhost:3000/api/excel/v3?action=getFiles&dataSource=excel'
    );

    if (!response.ok) {
      console.error(
        `❌ API 返回错误: ${response.status} ${response.statusText}`
      );
      const text = await response.text();
      console.log('   响应内容:', text.substring(0, 200));
      return false;
    }

    const data = await response.json();

    if (!data.success) {
      console.error('❌ API 返回失败:', data.error);
      return false;
    }

    console.log('✅ API 响应成功');
    console.log(`   文件数: ${data.data?.files?.length || 0}`);
    console.log(`   最后更新: ${data.data?.lastUpdate || '无'}`);

    // 如果有文件，测试获取工作表数据
    if (data.data?.files?.length > 0) {
      const firstFile = data.data.files[0];
      console.log(`\n   测试获取第一个文件的工作表...`);
      console.log(`   文件: ${firstFile.fileName}`);

      if (firstFile.sheets?.length > 0) {
        const sheetResponse = await fetch(
          `http://localhost:3000/api/excel/v3?action=getSheetData&dataSource=excel&fileName=${encodeURIComponent(firstFile.fileName)}&sheetName=${encodeURIComponent(firstFile.sheets[0])}&page=1&pageSize=10`
        );

        if (sheetResponse.ok) {
          const sheetData = await sheetResponse.json();
          console.log(
            `   ✅ 工作表数据获取成功，记录数: ${sheetData.data?.data?.length || 0}`
          );
        } else {
          console.warn(`   ⚠️ 工作表数据获取失败: ${sheetResponse.status}`);
        }
      }
    }

    return true;
  } catch (error) {
    console.error('❌ API 测试失败:', error.message);
    return false;
  }
}

async function testDataFlow() {
  console.log('\n=== 测试 6: 完整数据流 ===');

  try {
    // 1. 检查文件夹 -> 监控服务 -> Redis
    console.log('1. 文件夹 -> 监控服务 -> Redis');

    const files = fs
      .readdirSync(EXCEL_FOLDER)
      .filter(
        (f) => f.endsWith('.xlsx') || f.endsWith('.xls') || f.endsWith('.xlsm')
      );

    if (files.length === 0) {
      console.warn('   ⚠️ 没有 Excel 文件可测试');
      return false;
    }

    const testFile = files[0];
    console.log(`   测试文件: ${testFile}`);

    // 2. Redis -> API
    console.log('\n2. Redis -> API');
    const redisKey = `excel:file:${testFile}:info`;
    const redisData = await redisClient.get(redisKey);

    if (!redisData) {
      console.warn(`   ⚠️ Redis 中没有此文件的缓存: ${testFile}`);
    } else {
      console.log(`   ✅ Redis 中找到文件信息`);
    }

    // 3. API -> 前端
    console.log('\n3. API -> 前端');
    const apiResponse = await fetch(
      'http://localhost:3000/api/excel/v3?action=getFiles&dataSource=excel'
    );
    const apiData = await apiResponse.json();

    const apiFile = apiData.data?.files?.find((f) => f.fileName === testFile);
    if (apiFile) {
      console.log(`   ✅ API 返回了文件: ${testFile}`);
      console.log(`      工作表数: ${apiFile.sheets?.length || 0}`);
    } else {
      console.warn(`   ⚠️ API 没有返回文件: ${testFile}`);
    }

    return true;
  } catch (error) {
    console.error('❌ 数据流测试失败:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('========================================');
  console.log('     Excel 同步和缓存系统测试');
  console.log('========================================');

  const results = [];

  // 运行所有测试
  results.push(['Redis 连接', await testRedisConnection()]);
  results.push(['Excel 文件夹', await testExcelFolderAccess()]);
  results.push(['监控服务', await testMonitorServiceStatus()]);
  results.push(['Redis 缓存', await testRedisCache()]);
  results.push(['API 端点', await testAPIEndpoint()]);
  results.push(['数据流', await testDataFlow()]);

  // 汇总结果
  console.log('\n========================================');
  console.log('              测试结果汇总');
  console.log('========================================');

  let passCount = 0;
  results.forEach(([name, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
    if (passed) passCount++;
  });

  console.log('\n----------------------------------------');
  console.log(`总计: ${passCount}/${results.length} 通过`);

  // 关闭 Redis 连接
  await redisClient.quit();

  // 返回退出码
  process.exit(passCount === results.length ? 0 : 1);
}

// 运行测试
runAllTests().catch((error) => {
  console.error('测试运行失败:', error);
  process.exit(1);
});
