const redis = require('redis');

async function checkRaw() {
  const client = redis.createClient({
    socket: { host: 'localhost', port: 6379 }
  });

  await client.connect();

  try {
    // 直接获取原始数据
    const filesData = await client.get('excel:files');
    console.log('=== excel:files 原始数据 ===');
    console.log(filesData);

    if (filesData) {
      const files = JSON.parse(filesData);
      console.log('\n=== 解析后的结构 ===');
      console.log('数组长度:', files.length);
      console.log('第一个元素:', JSON.stringify(files[0], null, 2));
    }

    // 获取所有 excel: 开头的键
    console.log('\n=== 所有 excel: 开头的键 ===');
    const keys = await client.keys('excel:*');
    console.log('找到的键:', keys.slice(0, 10));
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await client.quit();
  }
}

checkRaw();
