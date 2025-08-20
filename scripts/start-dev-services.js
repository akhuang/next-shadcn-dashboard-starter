#!/usr/bin/env node

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const execAsync = promisify(exec);

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  const timestamp = new Date().toLocaleTimeString();
  console.log(`${colors[color]}[${timestamp}] ${message}${colors.reset}`);
}

function logSection(title) {
  console.log(
    `\n${colors.bright}${colors.cyan}${'='.repeat(50)}${colors.reset}`
  );
  console.log(`${colors.bright}${colors.cyan}  ${title}${colors.reset}`);
  console.log(
    `${colors.bright}${colors.cyan}${'='.repeat(50)}${colors.reset}\n`
  );
}

// 检查 Docker 是否安装
async function checkDocker() {
  try {
    await execAsync('docker --version');
    return true;
  } catch {
    return false;
  }
}

// 检查容器是否运行
async function isContainerRunning(containerName) {
  try {
    const { stdout } = await execAsync(
      `docker ps --filter name=${containerName} --format "{{.Names}}"`
    );
    return stdout.trim().split('\n').includes(containerName);
  } catch {
    return false;
  }
}

// 检查端口是否占用（跨平台）
async function isPortInUse(port) {
  try {
    // 使用 lsof 检查端口（macOS/Linux）
    await execAsync(`lsof -i:${port}`);
    return true;
  } catch {
    try {
      // 使用 netstat 作为备选（Windows/Linux）
      const { stdout } = await execAsync(
        `netstat -an | grep -E "[:.]${port}.*LISTEN"`
      );
      return stdout.length > 0;
    } catch {
      // 如果都失败，假设端口未占用
      return false;
    }
  }
}

// 停止并删除容器
async function removeContainer(containerName) {
  try {
    await execAsync(`docker stop ${containerName} 2>/dev/null`);
    await execAsync(`docker rm ${containerName} 2>/dev/null`);
  } catch {
    // 容器可能不存在，忽略错误
  }
}

// 等待函数
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// 启动长时间运行的进程
function startProcess(name, command, cwd = process.cwd(), color = 'green') {
  const [cmd, ...args] = command.split(' ');
  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });

  child.stdout?.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line) => line.trim());
    lines.forEach((line) => {
      console.log(`${colors[color]}[${name}]${colors.reset} ${line}`);
    });
  });

  child.stderr?.on('data', (data) => {
    const lines = data
      .toString()
      .split('\n')
      .filter((line) => line.trim());
    lines.forEach((line) => {
      // 过滤掉一些常见的非错误信息
      if (
        !line.includes('Debugger listening') &&
        !line.includes('For help, see:') &&
        !line.includes('ExperimentalWarning')
      ) {
        console.log(`${colors.red}[${name}]${colors.reset} ${line}`);
      }
    });
  });

  child.on('error', (err) => {
    log(`${name} error: ${err.message}`, 'red');
  });

  return child;
}

// 主函数
async function main() {
  logSection('🚀 Starting Development Environment');

  const processes = [];
  const containerNames = {
    redis: 'dev-redis',
    postgres: 'dev-postgres'
  };

  try {
    // 0. 检查 Docker
    log('Checking Docker...', 'yellow');
    const dockerInstalled = await checkDocker();
    if (!dockerInstalled) {
      log('❌ Docker is not installed!', 'red');
      log(
        'Please install Docker from: https://www.docker.com/get-started',
        'cyan'
      );
      process.exit(1);
    }
    log('✓ Docker is installed', 'green');

    // 1. 处理 Redis
    log('Checking Redis...', 'yellow');
    const redisPortInUse = await isPortInUse(6379);
    const redisContainerRunning = await isContainerRunning(
      containerNames.redis
    );

    if (redisPortInUse) {
      if (redisContainerRunning) {
        log('✓ Redis container is already running', 'green');
      } else {
        log('✓ Redis is already running on port 6379 (non-Docker)', 'green');
      }
    } else {
      // 端口未占用，尝试启动容器
      log('Starting Redis container...', 'yellow');

      // 先清理可能存在的旧容器
      await removeContainer(containerNames.redis);

      // 启动新的 Redis 容器
      const redisCmd = `docker run -d --name ${containerNames.redis} -p 6379:6379 redis:7-alpine`;
      log('Running: ' + redisCmd, 'cyan');

      try {
        await execAsync(redisCmd);
        log('✓ Redis container started', 'green');
        await wait(2000);
      } catch (error) {
        log('Failed to start Redis container', 'red');
        log(error.message, 'red');
        log('Please ensure Redis is available on port 6379', 'yellow');
      }
    }

    // 2. 处理 PostgreSQL
    log('Checking PostgreSQL...', 'yellow');
    const pgPortInUse = await isPortInUse(5432);
    const pgContainerRunning = await isContainerRunning(
      containerNames.postgres
    );

    if (pgPortInUse) {
      if (pgContainerRunning) {
        log('✓ PostgreSQL container is already running', 'green');
      } else {
        log(
          '✓ PostgreSQL is already running on port 5432 (non-Docker)',
          'green'
        );
      }

      // 检查数据库是否存在
      try {
        await execAsync(
          `PGPASSWORD=postgres psql -h localhost -U postgres -d navigation_db -c "SELECT 1" 2>/dev/null`
        );
        log('✓ Database navigation_db exists', 'green');
      } catch {
        log('Creating database navigation_db...', 'yellow');
        try {
          await execAsync(
            `PGPASSWORD=postgres psql -h localhost -U postgres -c "CREATE DATABASE navigation_db" 2>/dev/null`
          );
          log('✓ Database navigation_db created', 'green');
        } catch (e) {
          log(
            'Note: Could not create database, it may already exist',
            'yellow'
          );
        }
      }
    } else {
      // 端口未占用，尝试启动容器
      log('Starting PostgreSQL container...', 'yellow');

      // 先清理可能存在的旧容器
      await removeContainer(containerNames.postgres);

      // 启动新的 PostgreSQL 容器
      const pgCmd =
        `docker run -d --name ${containerNames.postgres} ` +
        `-p 5432:5432 ` +
        `-e POSTGRES_PASSWORD=postgres ` +
        `-e POSTGRES_USER=postgres ` +
        `-e POSTGRES_DB=navigation_db ` +
        `postgres:16-alpine`;

      log('Running: ' + pgCmd, 'cyan');

      try {
        await execAsync(pgCmd);
        log('✓ PostgreSQL container started', 'green');
        log('  Database: navigation_db', 'cyan');
        log('  User: postgres', 'cyan');
        log('  Password: postgres', 'cyan');
        await wait(5000); // PostgreSQL 需要更多时间初始化
      } catch (error) {
        log('Failed to start PostgreSQL container', 'red');
        log(error.message, 'red');
        log('Please ensure PostgreSQL is available on port 5432', 'yellow');
      }
    }

    // 3. 创建测试目录
    log('Setting up test directories...', 'yellow');
    const dirs = ['/tmp/test-contacts', '/tmp/test-navigation'];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        log(`✓ Created ${dir}`, 'green');
      } else {
        log(`✓ Directory exists: ${dir}`, 'green');
      }
    }

    // 4. 创建测试数据（如果脚本存在）
    const navFile = '/tmp/test-navigation/navigation.xlsx';
    const createNavScript = path.join(
      process.cwd(),
      'scripts/create-navigation-excel.js'
    );
    if (!fs.existsSync(navFile) && fs.existsSync(createNavScript)) {
      log('Creating navigation test data...', 'yellow');
      try {
        await execAsync('node scripts/create-navigation-excel.js');
        log('✓ Navigation test data created', 'green');
      } catch (e) {
        log('Note: Could not create navigation test data', 'yellow');
      }
    } else if (fs.existsSync(navFile)) {
      log('✓ Navigation test data already exists', 'green');
    }

    // 5. 初始化 Prisma
    log('Checking Prisma setup...', 'yellow');

    // 总是生成 Prisma Client
    log('Generating Prisma Client...', 'yellow');
    try {
      await execAsync('pnpm prisma generate');
      log('✓ Prisma Client generated', 'green');
    } catch (e) {
      log('Warning: Could not generate Prisma Client', 'yellow');
    }

    // 推送数据库架构
    log('Pushing database schema...', 'yellow');
    try {
      await execAsync('pnpm prisma db push');
      log('✓ Database schema pushed', 'green');
    } catch (e) {
      log('Warning: Could not push database schema', 'yellow');
      log('Make sure your database is accessible', 'yellow');
    }

    // 检查是否有 seed 文件并运行
    if (fs.existsSync('prisma/seed.ts')) {
      log('Seeding database...', 'yellow');
      try {
        await execAsync('pnpm prisma db seed');
        log('✓ Database seeded', 'green');
      } catch (e) {
        log('Note: Database seeding skipped (may already be seeded)', 'yellow');
      }
    }

    await wait(1000);

    logSection('Starting Application Services');

    // 6. 启动 Excel Monitor Service（如果存在）
    const monitorPath = path.join(process.cwd(), 'excel-monitor-service');
    if (fs.existsSync(monitorPath)) {
      log('Starting Excel Monitor Service...', 'cyan');

      // 检查依赖是否安装
      if (!fs.existsSync(path.join(monitorPath, 'node_modules'))) {
        log('Installing Excel Monitor dependencies...', 'yellow');
        await execAsync('npm install', { cwd: monitorPath });
        log('✓ Dependencies installed', 'green');
      }

      processes.push(
        startProcess('Monitor', 'npm run dev', monitorPath, 'yellow')
      );
      await wait(2000);
    }

    // 7. 启动 Next.js
    log('Starting Next.js development server...', 'cyan');
    processes.push(
      startProcess('Next.js', 'next dev --turbopack', process.cwd(), 'blue')
    );

    await wait(5000);

    logSection('✅ Development Environment Ready!');

    console.log(`
  ${colors.cyan}Services Status:${colors.reset}
    ${colors.green}•${colors.reset} Redis:       localhost:6379 ${redisContainerRunning ? '(Docker)' : redisPortInUse ? '(Local)' : ''}
    ${colors.green}•${colors.reset} PostgreSQL:  localhost:5432 ${pgContainerRunning ? '(Docker)' : pgPortInUse ? '(Local)' : ''}
    ${colors.green}•${colors.reset} Database:    navigation_db

  ${colors.cyan}Application Services:${colors.reset}
    ${colors.green}•${colors.reset} Monitor:     Excel file monitoring service
    ${colors.green}•${colors.reset} Next.js:     http://localhost:3000

  ${colors.cyan}Available pages:${colors.reset}
    ${colors.green}→${colors.reset} Dashboard:   http://localhost:3000/dashboard
    ${colors.green}→${colors.reset} Navigation:  http://localhost:3000/dashboard/navigation
    ${colors.green}→${colors.reset} Contacts:    http://localhost:3000/dashboard/contacts

  ${colors.cyan}Database Access:${colors.reset}
    ${colors.green}→${colors.reset} Connection:  postgresql://postgres:postgres@localhost:5432/navigation_db
    ${colors.green}→${colors.reset} Prisma Studio: pnpm db:studio

  ${colors.cyan}Docker Management:${colors.reset}
    ${colors.green}→${colors.reset} View containers: docker ps
    ${colors.green}→${colors.reset} Stop Redis:      docker stop ${containerNames.redis}
    ${colors.green}→${colors.reset} Stop PostgreSQL: docker stop ${containerNames.postgres}

  ${colors.yellow}Press Ctrl+C to stop all services${colors.reset}
    `);
  } catch (error) {
    log(`Error: ${error.message}`, 'red');
    process.exit(1);
  }

  // 处理退出信号
  const cleanup = async () => {
    log('\n\nShutting down application services...', 'yellow');

    // 停止 Node.js 进程
    processes.forEach((p) => {
      try {
        p.kill('SIGTERM');
      } catch (e) {
        // 忽略错误
      }
    });

    log('Application services stopped.', 'green');
    log('Note: Docker containers are still running. To stop them:', 'cyan');
    log(
      `  docker stop ${containerNames.redis} ${containerNames.postgres}`,
      'yellow'
    );

    // 给进程一些时间来清理
    setTimeout(() => {
      process.exit(0);
    }, 1000);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

// 运行
main().catch((err) => {
  log(`Fatal error: ${err.message}`, 'red');
  process.exit(1);
});
