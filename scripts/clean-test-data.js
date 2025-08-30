#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// 测试数据目录
const TEST_DIRS = [
  '/tmp/test-contacts',
  '/tmp/test-navigation',
  '/tmp/reports-business1',
  './scripts/docker/excel-data'
];

// 清理单个目录
function cleanDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);
  let cleanedCount = 0;

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && (file.endsWith('.xlsx') || file.endsWith('.xls'))) {
      try {
        fs.unlinkSync(filePath);
        cleanedCount++;
        console.log(`   ✅ Deleted: ${file}`);
      } catch (error) {
        console.log(`   ❌ Failed to delete: ${file} - ${error.message}`);
      }
    }
  });

  if (cleanedCount === 0) {
    console.log(`   📂 No Excel files found in ${dirPath}`);
  } else {
    console.log(`   🧹 Cleaned ${cleanedCount} Excel files from ${dirPath}`);
  }
}

// 清理Redis缓存
async function cleanRedisCache() {
  const Redis = require('ioredis');

  try {
    const redis = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: () => null // 不重试，快速失败
    });

    console.log('\n🗄️  Cleaning Redis cache...');

    // 删除所有Excel相关的键
    const patterns = ['excel:*', 'navigation:*', 'reports:*', 'monitor:*'];

    let totalDeleted = 0;

    for (const pattern of patterns) {
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log(`   ✅ Deleted ${keys.length} keys matching: ${pattern}`);
        totalDeleted += keys.length;
      }
    }

    await redis.quit();

    if (totalDeleted > 0) {
      console.log(`   🧹 Total Redis keys cleaned: ${totalDeleted}`);
    } else {
      console.log(`   📂 No Redis cache found to clean`);
    }
  } catch (error) {
    console.log(`   ⚠️  Redis cleanup failed: ${error.message}`);
    console.log(`   💡 This is normal if Redis is not running`);
  }
}

// 主函数
async function main() {
  console.log('🧹 Starting Test Data Cleanup...\n');

  try {
    // 清理测试数据目录
    console.log('📁 Cleaning test directories...');
    TEST_DIRS.forEach((dir) => {
      console.log(`\n📂 Cleaning: ${dir}`);
      cleanDirectory(dir);
    });

    // 清理Redis缓存
    await cleanRedisCache();

    console.log('\n✅ Test data cleanup completed!');
    console.log(
      '\n💡 Tip: Run "node scripts/generate-all-test-data.js" to regenerate test data'
    );
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
    process.exit(1);
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { cleanDirectory, cleanRedisCache };
