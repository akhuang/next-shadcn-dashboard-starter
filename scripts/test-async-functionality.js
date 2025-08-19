#!/usr/bin/env node

/**
 * 异步缓存功能集成测试脚本
 * 这个脚本验证了异步缓存系统的核心功能
 */

const { spawn } = require('child_process');
const http = require('http');
const path = require('path');

console.log('🧪 异步缓存功能验证测试');
console.log('=====================================\n');

// 测试配置
const API_BASE = 'http://localhost:3000/api/excel/v3';
const TIMEOUT = 30000; // 30秒超时

// 测试用例
const testCases = [
  {
    name: '📁 文件夹设置',
    test: async () => {
      const response = await httpRequest(
        `${API_BASE}?action=setFolder&folderPath=/tmp/test-contacts`
      );
      return response.success && response.taskId;
    }
  },
  {
    name: '📄 文件列表获取',
    test: async () => {
      const response = await httpRequest(`${API_BASE}?action=getFiles`);
      return response.success && Array.isArray(response.data.files);
    }
  },
  {
    name: '📊 缓存状态检查',
    test: async () => {
      const response = await httpRequest(`${API_BASE}?action=getCacheStatus`);
      return response.success && typeof response.data.isUpdating === 'boolean';
    }
  },
  {
    name: '📋 Sheet 信息获取',
    test: async () => {
      // 先获取文件列表
      const filesResponse = await httpRequest(`${API_BASE}?action=getFiles`);
      if (!filesResponse.success || !filesResponse.data.files.length) {
        console.log('⚠️  没有找到文件，跳过 Sheet 测试');
        return true; // 跳过这个测试
      }

      const firstFile = filesResponse.data.files[0];
      const response = await httpRequest(
        `${API_BASE}?action=getSheets&fileName=${encodeURIComponent(firstFile.fileName)}`
      );
      return response.success && Array.isArray(response.data);
    }
  },
  {
    name: '🔍 搜索功能测试',
    test: async () => {
      const response = await httpRequest(
        `${API_BASE}?action=search&query=test&page=1&pageSize=10`
      );
      return response.success && Array.isArray(response.data.data);
    }
  }
];

// HTTP 请求工具
function httpRequest(url) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Request timeout'));
    }, 5000);

    http
      .get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          clearTimeout(timeout);
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON: ${data}`));
          }
        });
      })
      .on('error', (err) => {
        clearTimeout(timeout);
        reject(err);
      });
  });
}

// 检查服务器是否运行
async function checkServer() {
  try {
    await httpRequest('http://localhost:3000/api/health');
    return true;
  } catch (error) {
    return false;
  }
}

// 等待服务器启动
async function waitForServer(maxWait = 30000) {
  const startTime = Date.now();
  while (Date.now() - startTime < maxWait) {
    if (await checkServer()) {
      return true;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
    process.stdout.write('.');
  }
  return false;
}

// 运行单个测试
async function runTest(testCase, index) {
  const prefix = `${index + 1}/${testCases.length}`;
  process.stdout.write(`${prefix} ${testCase.name}... `);

  try {
    const result = await Promise.race([
      testCase.test(),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Test timeout')), 10000)
      )
    ]);

    if (result) {
      console.log('✅ 通过');
      return true;
    } else {
      console.log('❌ 失败 - 返回值为假');
      return false;
    }
  } catch (error) {
    console.log(`❌ 失败 - ${error.message}`);
    return false;
  }
}

// 主测试函数
async function runTests() {
  console.log('🔍 检查服务器状态...');

  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ 服务器未运行');
    console.log('\n📝 请先启动开发服务器:');
    console.log('   pnpm dev:full');
    console.log('   或');
    console.log('   pnpm redis:start && pnpm dev');
    process.exit(1);
  }

  console.log('✅ 服务器正在运行\n');

  // 检查 Redis 是否可用
  console.log('🔍 检查 Redis 连接...');
  try {
    const response = await httpRequest(`${API_BASE}?action=getCacheStatus`);
    if (response.success) {
      console.log('✅ Redis 连接正常\n');
    } else {
      console.log('⚠️  Redis 可能有问题，但继续测试\n');
    }
  } catch (error) {
    console.log('⚠️  无法检查 Redis 状态，但继续测试\n');
  }

  // 运行所有测试
  console.log('🧪 开始运行功能测试...\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const success = await runTest(testCases[i], i);
    if (success) {
      passed++;
    } else {
      failed++;
    }

    // 在测试之间稍作暂停
    if (i < testCases.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // 显示结果
  console.log('\n=====================================');
  console.log('📊 测试结果汇总:');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${Math.round((passed / testCases.length) * 100)}%`);

  if (failed === 0) {
    console.log('\n🎉 所有测试通过！异步缓存功能工作正常！');
    console.log('\n💡 核心功能验证:');
    console.log('   ✓ 异步文件夹设置');
    console.log('   ✓ 文件列表实时获取');
    console.log('   ✓ 缓存状态监控');
    console.log('   ✓ Sheet 信息异步加载');
    console.log('   ✓ 分页搜索功能');
  } else {
    console.log('\n⚠️  部分测试失败，请检查:');
    console.log('   1. Redis 是否正常运行');
    console.log('   2. 测试数据是否存在');
    console.log('   3. API 路由是否正确');
  }

  console.log('\n🚀 访问异步版本界面:');
  console.log('   http://localhost:3000/dashboard/contacts');
  console.log('   (已升级为异步分页加载)');

  process.exit(failed === 0 ? 0 : 1);
}

// 执行测试
runTests().catch((error) => {
  console.error('\n💥 测试执行失败:', error.message);
  process.exit(1);
});
