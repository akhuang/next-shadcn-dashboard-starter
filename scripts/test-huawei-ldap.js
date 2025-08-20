#!/usr/bin/env node

/**
 * 测试华为域 LDAP 连接
 * 使用方法: node scripts/test-huawei-ldap.js
 */

const ldap = require('ldapjs');
require('dotenv').config({ path: '.env.huawei' });

const config = {
  url: process.env.LDAP_URL || 'ldap://dc.china.huawei.com:389',
  baseDN: process.env.LDAP_BASE_DN || 'DC=china,DC=huawei,DC=com',
  bindDN: process.env.LDAP_BIND_DN || '',
  bindPassword: process.env.LDAP_BIND_PASSWORD || ''
};

console.log('🔧 华为域 LDAP 测试工具');
console.log('========================\n');
console.log('配置信息:');
console.log(`  服务器: ${config.url}`);
console.log(`  Base DN: ${config.baseDN}`);
console.log(`  Bind DN: ${config.bindDN || '(用户自绑定模式)'}`);
console.log('');

// 测试函数
async function testConnection() {
  console.log('1️⃣  测试基本连接...');

  const client = ldap.createClient({
    url: config.url,
    connectTimeout: 5000
  });

  return new Promise((resolve) => {
    client.on('connect', () => {
      console.log('✅ 连接成功！');
      client.unbind();
      resolve(true);
    });

    client.on('error', (err) => {
      console.log(`❌ 连接失败: ${err.message}`);
      resolve(false);
    });

    // 触发连接
    client.bind('', '', (err) => {
      if (err && err.code !== 49) {
        // 49 是认证失败，但连接是成功的
        console.log(`❌ 连接失败: ${err.message}`);
        resolve(false);
      }
    });
  });
}

// 测试用户认证
async function testUserAuth(username, password) {
  console.log(`\n2️⃣  测试用户认证 (${username})...`);

  const client = ldap.createClient({
    url: config.url
  });

  return new Promise((resolve) => {
    // 尝试不同的绑定格式
    const bindFormats = [
      `${username}@${config.baseDN
        .split(',')
        .filter((p) => p.startsWith('DC='))
        .map((p) => p.split('=')[1])
        .join('.')}`,
      `CN=${username},${config.baseDN}`,
      username // 直接用户名
    ];

    let tryIndex = 0;

    function tryBind() {
      if (tryIndex >= bindFormats.length) {
        console.log('❌ 所有认证格式都失败');
        client.unbind();
        resolve(false);
        return;
      }

      const bindDN = bindFormats[tryIndex];
      console.log(`   尝试格式 ${tryIndex + 1}: ${bindDN}`);

      client.bind(bindDN, password, (err) => {
        if (err) {
          console.log(`   ❌ 失败: ${err.message}`);
          tryIndex++;
          tryBind();
        } else {
          console.log(`   ✅ 认证成功！使用格式: ${bindDN}`);

          // 搜索用户信息
          const searchOptions = {
            scope: 'sub',
            filter: `(|(sAMAccountName=${username})(uid=${username})(cn=${username}))`,
            attributes: ['cn', 'mail', 'displayName', 'department']
          };

          client.search(config.baseDN, searchOptions, (searchErr, res) => {
            if (searchErr) {
              console.log(`   ⚠️  搜索用户信息失败: ${searchErr.message}`);
            } else {
              res.on('searchEntry', (entry) => {
                console.log('   📋 用户信息:');
                entry.attributes.forEach((attr) => {
                  console.log(`      ${attr.type}: ${attr.values.join(', ')}`);
                });
              });
            }

            client.unbind();
            resolve(true);
          });
        }
      });
    }

    tryBind();
  });
}

// 交互式测试
async function interactiveTest() {
  const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const question = (prompt) =>
    new Promise((resolve) => readline.question(prompt, resolve));

  // 测试连接
  const connected = await testConnection();

  if (!connected) {
    console.log('\n⚠️  无法连接到 LDAP 服务器，请检查:');
    console.log('  1. 服务器地址是否正确');
    console.log('  2. 网络是否可达');
    console.log('  3. 防火墙是否允许访问');
    readline.close();
    return;
  }

  // 测试用户认证
  const testAuth = await question('\n是否测试用户认证? (y/n): ');

  if (testAuth.toLowerCase() === 'y') {
    const username = await question('请输入域用户名: ');
    const password = await question('请输入密码: ');

    await testUserAuth(username, password);
  }

  readline.close();
}

// 运行测试
console.log('开始测试...\n');
interactiveTest()
  .then(() => {
    console.log('\n测试完成！');
    process.exit(0);
  })
  .catch((err) => {
    console.error('测试出错:', err);
    process.exit(1);
  });
