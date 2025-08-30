const redis = require('redis');
const { promisify } = require('util');

async function checkRedisData() {
  const client = redis.createClient({
    socket: { host: 'localhost', port: 6379 }
  });

  await client.connect();

  console.log('=== Redis 数据检查 ===\n');

  try {
    // 1. 检查文件列表
    const filesKey = 'excel:files';
    const filesData = await client.get(filesKey);

    if (filesData) {
      const files = JSON.parse(filesData);
      console.log(`✅ 找到 ${files.length} 个文件:`);
      files.forEach((f, i) => {
        console.log(`\n${i + 1}. ${f.fileName}`);
        console.log(`   工作表: ${f.sheets ? f.sheets.join(', ') : '未知'}`);

        // 检查每个文件的详细信息
        if (f.sheets && f.sheets.length > 0) {
          f.sheets.forEach(async (sheetName) => {
            const sheetKey = `excel:sheet:${f.fileName}:${sheetName}:data`;
            const sheetData = await client.get(sheetKey);
            if (sheetData) {
              const data = JSON.parse(sheetData);
              console.log(`   - ${sheetName}: ${data.length} 条记录`);
              if (data.length > 0) {
                console.log(`     示例数据:`, Object.keys(data[0]));
              }
            }
          });
        }
      });

      // 2. 检查第一个文件的第一个工作表数据
      if (files.length > 0 && files[0].sheets && files[0].sheets.length > 0) {
        const firstFile = files[0];
        const firstSheet = firstFile.sheets[0];
        const dataKey = `excel:sheet:${firstFile.fileName}:${firstSheet}:data`;

        console.log(
          `\n\n=== 详细检查: ${firstFile.fileName} - ${firstSheet} ===`
        );

        const sheetData = await client.get(dataKey);
        if (sheetData) {
          const data = JSON.parse(sheetData);
          console.log(`\n数据条数: ${data.length}`);

          if (data.length > 0) {
            console.log('\n前3条数据:');
            data.slice(0, 3).forEach((row, i) => {
              console.log(`\n记录 ${i + 1}:`);
              Object.entries(row).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
              });
            });

            // 检查数据格式
            console.log('\n数据格式检查:');
            console.log('- 第一条数据的键:', Object.keys(data[0]));
            console.log('- 数据类型:', typeof data[0]);
            console.log('- 是否有 id 字段:', 'id' in data[0]);
            console.log('- 是否有 rowData 字段:', 'rowData' in data[0]);

            // 如果有 rowData，检查其内容
            if (data[0].rowData) {
              console.log('- rowData 的键:', Object.keys(data[0].rowData));
            }
          }
        } else {
          console.log('❌ 没有找到工作表数据');
        }

        // 3. 检查工作表信息
        const infoKey = `excel:sheet:${firstFile.fileName}:${firstSheet}:info`;
        const sheetInfo = await client.get(infoKey);
        if (sheetInfo) {
          const info = JSON.parse(sheetInfo);
          console.log('\n工作表信息:');
          console.log('- 列:', info.columns ? info.columns.join(', ') : '无');
          console.log('- 总行数:', info.totalRows || 0);
          console.log(
            '- 合并区域:',
            info.mergeRanges ? `${info.mergeRanges.length} 个` : '无'
          );
        }
      }
    } else {
      console.log('❌ Redis 中没有文件列表');
    }

    // 4. 检查最后更新时间
    const lastUpdate = await client.get('excel:last_update');
    if (lastUpdate) {
      console.log(
        `\n最后更新时间: ${new Date(parseInt(lastUpdate)).toLocaleString()}`
      );
    }
  } catch (error) {
    console.error('错误:', error);
  } finally {
    await client.quit();
  }
}

checkRedisData();
