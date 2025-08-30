// 测试 excel-async-cache-service 的 getFiles 方法

async function testCacheService() {
  console.log('=== 测试 Excel Cache Service ===\n');

  // 导入服务
  const { excelAsyncCacheService } = await import(
    '../src/lib/excel-async-cache-service.ts'
  );

  try {
    // 1. 测试 getFiles
    console.log('1. 测试 getFiles():');
    const files = await excelAsyncCacheService.getFiles();
    console.log('返回的文件数:', files.length);

    if (files.length > 0) {
      console.log('\n第一个文件对象:');
      console.log(JSON.stringify(files[0], null, 2));

      console.log('\n所有文件:');
      files.forEach((file, i) => {
        console.log(
          `${i + 1}. fileName: ${file.fileName}, sheets: ${file.sheets?.join(', ') || '无'}`
        );
      });
    }

    // 2. 测试 getLastUpdate
    console.log('\n2. 测试 getLastUpdate():');
    const lastUpdate = await excelAsyncCacheService.getLastUpdate();
    console.log('最后更新时间:', lastUpdate);

    // 3. 如果有文件，测试 getSheetData
    if (files.length > 0 && files[0].sheets && files[0].sheets.length > 0) {
      console.log('\n3. 测试 getSheetData():');
      const fileName = files[0].fileName;
      const sheetName = files[0].sheets[0];

      console.log(`获取数据: ${fileName} - ${sheetName}`);
      const sheetData = await excelAsyncCacheService.getSheetData(
        fileName,
        sheetName,
        1,
        10
      );

      console.log('返回的数据结构:');
      console.log('- data 长度:', sheetData.data.length);
      console.log('- total:', sheetData.total);
      console.log('- hasMore:', sheetData.hasMore);

      if (sheetData.data.length > 0) {
        console.log('\n第一条数据:');
        console.log(JSON.stringify(sheetData.data[0], null, 2));
      }
    }
  } catch (error) {
    console.error('测试失败:', error);
  }

  // 关闭连接
  process.exit(0);
}

testCacheService();
