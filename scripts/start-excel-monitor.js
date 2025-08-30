#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// 配置
const MONITOR_CONFIG = {
  script: 'excel-monitor-service/index-enhanced.js',
  env: {
    EXCEL_WATCH_DIR: '/tmp/test-contacts',
    NAVIGATION_EXCEL_DIR: '/tmp/test-navigation',
    REPORTS_BUSINESS1_DIR: '/tmp/reports-business1',
    REDIS_HOST: 'localhost',
    REDIS_PORT: '6379',
    REDIS_DB: '0',
    NODE_ENV: 'development'
  },
  logFile: '/tmp/excel-monitor.log'
};

// 创建监控目录
function createDirectories() {
  const dirs = [
    MONITOR_CONFIG.env.EXCEL_WATCH_DIR,
    MONITOR_CONFIG.env.NAVIGATION_EXCEL_DIR,
    MONITOR_CONFIG.env.REPORTS_BUSINESS1_DIR
  ];

  dirs.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    }
  });
}

// 检查脚本文件是否存在
function checkScriptExists() {
  const scriptPath = path.resolve(MONITOR_CONFIG.script);
  if (!fs.existsSync(scriptPath)) {
    console.error(`❌ Script not found: ${scriptPath}`);
    process.exit(1);
  }
  return scriptPath;
}

// 启动监控服务
function startMonitorService() {
  const scriptPath = checkScriptExists();

  console.log('🚀 Starting Excel Monitor Service...');
  console.log(`📁 Script: ${scriptPath}`);
  console.log(`📂 Directories:`);
  console.log(`   - Contacts: ${MONITOR_CONFIG.env.EXCEL_WATCH_DIR}`);
  console.log(`   - Navigation: ${MONITOR_CONFIG.env.NAVIGATION_EXCEL_DIR}`);
  console.log(`   - Reports: ${MONITOR_CONFIG.env.REPORTS_BUSINESS1_DIR}`);
  console.log(`📝 Log file: ${MONITOR_CONFIG.logFile}`);

  // 创建监控目录
  createDirectories();

  // 启动子进程
  const service = spawn('node', [scriptPath], {
    env: {
      ...process.env,
      ...MONITOR_CONFIG.env
    },
    stdio: ['ignore', 'pipe', 'pipe']
  });

  // 创建日志写入流
  const logStream = fs.createWriteStream(MONITOR_CONFIG.logFile, {
    flags: 'a'
  });

  // 记录启动时间
  const startTime = new Date().toISOString();
  logStream.write(`\n=== Excel Monitor Service Started at ${startTime} ===\n`);

  // 处理标准输出
  service.stdout.on('data', (data) => {
    const output = data.toString();
    process.stdout.write(output);
    logStream.write(`[STDOUT] ${output}`);
  });

  // 处理错误输出
  service.stderr.on('data', (data) => {
    const output = data.toString();
    process.stderr.write(output);
    logStream.write(`[STDERR] ${output}`);
  });

  // 处理进程退出
  service.on('close', (code) => {
    const endTime = new Date().toISOString();
    const message = `\n=== Excel Monitor Service Ended at ${endTime} with code ${code} ===\n`;
    console.log(message);
    logStream.write(message);
    logStream.end();

    if (code !== 0) {
      console.error(`❌ Service exited with error code: ${code}`);
      process.exit(code);
    }
  });

  // 处理进程错误
  service.on('error', (error) => {
    console.error(`❌ Failed to start service: ${error.message}`);
    logStream.write(`[ERROR] Failed to start: ${error.message}\n`);
    logStream.end();
    process.exit(1);
  });

  // 优雅关闭
  function gracefulShutdown(signal) {
    console.log(`\n📶 Received ${signal}, shutting down gracefully...`);
    logStream.write(`[INFO] Received ${signal}, shutting down...\n`);

    service.kill('SIGTERM');

    setTimeout(() => {
      console.log('🔨 Force killing service...');
      service.kill('SIGKILL');
    }, 5000);
  }

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

  console.log(`\n✅ Excel Monitor Service is running (PID: ${service.pid})`);
  console.log(`📋 Use Ctrl+C to stop the service`);
  console.log(`📝 Monitor logs: tail -f ${MONITOR_CONFIG.logFile}`);

  return service;
}

// 检查服务状态
function checkServiceStatus() {
  const Redis = require('ioredis');

  const redis = new Redis({
    host: MONITOR_CONFIG.env.REDIS_HOST,
    port: parseInt(MONITOR_CONFIG.env.REDIS_PORT),
    password: MONITOR_CONFIG.env.REDIS_PASSWORD,
    db: parseInt(MONITOR_CONFIG.env.REDIS_DB),
    retryStrategy: () => null,
    lazyConnect: true
  });

  redis
    .get('monitor:service:status')
    .then((status) => {
      if (status) {
        const serviceStatus = JSON.parse(status);
        console.log('\n📊 Service Status:');
        console.log(`   Status: ${serviceStatus.status}`);
        console.log(`   Uptime: ${Math.floor(serviceStatus.uptime)}s`);
        console.log(
          `   Memory: ${Math.round(serviceStatus.memoryUsage.heapUsed / 1024 / 1024)}MB`
        );

        if (serviceStatus.monitors) {
          Object.entries(serviceStatus.monitors).forEach(([type, monitor]) => {
            console.log(
              `   ${type}: ${monitor.filesProcessed} files processed`
            );
          });
        }

        if (serviceStatus.errors && serviceStatus.errors.length > 0) {
          console.log(`   ⚠️ Errors: ${serviceStatus.errors.length}`);
        }
      } else {
        console.log('⚠️  No service status found in Redis');
      }
      redis.disconnect();
    })
    .catch((error) => {
      console.log(`⚠️  Cannot connect to Redis: ${error.message}`);
      redis.disconnect();
    });
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  switch (command) {
    case 'status':
      checkServiceStatus();
      break;
    case 'logs':
      if (fs.existsSync(MONITOR_CONFIG.logFile)) {
        console.log(`📝 Log file: ${MONITOR_CONFIG.logFile}`);
        console.log('---');
        console.log(fs.readFileSync(MONITOR_CONFIG.logFile, 'utf8'));
      } else {
        console.log('📝 No log file found');
      }
      break;
    case 'clean-logs':
      if (fs.existsSync(MONITOR_CONFIG.logFile)) {
        fs.unlinkSync(MONITOR_CONFIG.logFile);
        console.log('🧹 Log file cleaned');
      } else {
        console.log('📝 No log file to clean');
      }
      break;
    default:
      startMonitorService();
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  main();
}

module.exports = { startMonitorService, checkServiceStatus };
