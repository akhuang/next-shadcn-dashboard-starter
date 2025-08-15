const XLSX = require('xlsx');

// 生成包含异常数据的测试文件
function generateAbnormalTestData() {
  console.log('🔥 开始生成包含异常数据的测试文件...');

  // 1. 创建异常数据测试文件
  const wb1 = XLSX.utils.book_new();

  // Sheet 1: 接近31字符限制的工作表名称
  const longSheetName1 = '异常数据测试Sheet包含特殊字符!@#';

  const abnormalHeaders = [
    '正常列',
    '',
    null,
    undefined,
    '列名包含\n换行',
    '列名包含\t制表符',
    '😀表情符号',
    '中文列名很长很长很长很长很长',
    'Column With Spaces',
    '列!@#$%^&*()',
    '列<>?:"{}|',
    '  前后有空格  ',
    '123纯数字',
    '重复列名',
    '重复列名',
    '列16',
    '列17',
    '列18',
    '列19',
    '列20',
    '列21',
    '列22',
    '列23',
    '列24',
    '列25'
  ];

  const abnormalData = [abnormalHeaders];

  // 生成包含各种异常值的数据
  for (let i = 1; i <= 300; i++) {
    const row = [];

    // 第1列：正常数据
    row.push(`正常数据${i}`);

    // 第2列：空字符串
    row.push('');

    // 第3列：null值
    row.push(null);

    // 第4列：undefined
    row.push(undefined);

    // 第5列：包含换行符
    row.push(`第${i}行\n换行测试\n多行文本`);

    // 第6列：包含制表符
    row.push(`制表符\t测试\t数据${i}`);

    // 第7列：表情符号
    row.push(`🚀 数据 💡 测试 ✨ ${i}`);

    // 第8列：超长中文文本
    row.push(
      `这是一段非常非常长的中文文本用于测试系统对于超长文本的处理能力，包含各种标点符号！@#￥%……&*（）——+【】；'："，。、？《》${i}`
    );

    // 第9列：包含空格
    row.push(`  Value ${i}  With  Multiple   Spaces  `);

    // 第10列：特殊字符
    row.push(`!@#$%^&*()_+-=[]{}|;':",./<>?${i}`);

    // 第11列：HTML标签
    row.push(`<b>Bold${i}</b><script>alert('test')</script>`);

    // 第12列：前后空格
    row.push(`   数据${i}   `);

    // 第13列：纯数字字符串
    row.push(`${1000000000 + i}`);

    // 第14-15列：重复值
    row.push(`重复值${i % 10}`);
    row.push(`重复值${i % 10}`);

    // 第16列：超大数字
    row.push(999999999999999 + i);

    // 第17列：小数
    row.push(3.141592653589793 * i);

    // 第18列：科学计数法
    row.push(`${i}E+10`);

    // 第19列：百分比
    row.push(`${((i / 300) * 100).toFixed(2)}%`);

    // 第20列：货币符号
    row.push(`¥${i * 100}.00`);

    // 第21列：日期格式
    row.push(
      `2024-${String((i % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
    );

    // 第22列：布尔值
    row.push(i % 2 === 0);

    // 第23列：JSON字符串
    row.push(JSON.stringify({ id: i, name: `Item${i}`, value: i * 10 }));

    // 第24列：URL
    row.push(`https://example.com/page${i}?param=value&test=${i}`);

    // 第25列：随机空值
    row.push(i % 5 === 0 ? null : `数据${i}`);

    abnormalData.push(row);
  }

  const ws1 = XLSX.utils.aoa_to_sheet(abnormalData);
  XLSX.utils.book_append_sheet(wb1, ws1, longSheetName1);

  // Sheet 2: 另一个接近限制的名称
  const longSheetName2 = '稀疏数据测试Sheet_2024年01月';

  const sparseData = [];
  // 创建稀疏数据（很多空单元格）
  for (let i = 0; i < 150; i++) {
    const row = [];
    for (let j = 0; j < 30; j++) {
      // 随机留空
      if (Math.random() > 0.3) {
        row.push(null);
      } else {
        row.push(`数据${i}-${j}`);
      }
    }
    sparseData.push(row);
  }

  const ws2 = XLSX.utils.aoa_to_sheet(sparseData);
  XLSX.utils.book_append_sheet(wb1, ws2, longSheetName2);

  // Sheet 3: 英文接近限制的名称
  const longSheetName3 = 'Test_Sheet_With_Long_Name_2024';

  // 创建包含合并单元格的数据
  const mergedData = [];
  for (let i = 0; i < 100; i++) {
    const row = [];
    for (let j = 0; j < 20; j++) {
      row.push(`Cell${i}-${j}`);
    }
    mergedData.push(row);
  }

  const ws3 = XLSX.utils.aoa_to_sheet(mergedData);
  XLSX.utils.book_append_sheet(wb1, ws3, longSheetName3);

  XLSX.writeFile(wb1, '/tmp/test-contacts/异常数据测试文件.xlsx');

  // 2. 创建超大数据量文件
  const wb2 = XLSX.utils.book_new();

  // 生成500行数据
  const largeHeaders = [];
  for (let i = 1; i <= 35; i++) {
    largeHeaders.push(`列${i}`);
  }

  const largeData = [largeHeaders];

  for (let i = 1; i <= 500; i++) {
    const row = [];
    for (let j = 1; j <= 35; j++) {
      // 生成不同类型的数据
      switch (j % 5) {
        case 0:
          row.push(`文本${i}-${j}`);
          break;
        case 1:
          row.push(i * j);
          break;
        case 2:
          row.push(`${((i * j) / 100).toFixed(2)}%`);
          break;
        case 3:
          row.push(
            `2024-${String((j % 12) + 1).padStart(2, '0')}-${String((i % 28) + 1).padStart(2, '0')}`
          );
          break;
        case 4:
          row.push(Math.random() > 0.5 ? `数据${i}` : null);
          break;
      }
    }
    largeData.push(row);
  }

  const ws4 = XLSX.utils.aoa_to_sheet(largeData);
  XLSX.utils.book_append_sheet(wb2, ws4, '大数据量500行x35列');

  // 添加另一个Sheet
  const mediumData = [];
  for (let i = 0; i < 200; i++) {
    const row = [];
    for (let j = 0; j < 25; j++) {
      if (i === 0) {
        row.push(`表头${j + 1}`);
      } else {
        row.push(Math.random() > 0.2 ? `数据${i}-${j}` : '');
      }
    }
    mediumData.push(row);
  }

  const ws5 = XLSX.utils.aoa_to_sheet(mediumData);
  XLSX.utils.book_append_sheet(wb2, ws5, '中等数据200行x25列');

  XLSX.writeFile(wb2, '/tmp/test-contacts/性能测试大数据文件.xlsx');

  // 3. 创建包含各种编码和语言的文件
  const wb3 = XLSX.utils.book_new();

  const multiLangHeaders = [
    'English',
    '中文',
    '日本語',
    '한국어',
    'العربية',
    'עברית',
    'Русский',
    'Español',
    'Français',
    'Deutsch',
    'Italiano',
    '🌍多语言🌎',
    'Tiếng Việt',
    'ไทย',
    'हिन्दी'
  ];

  const multiLangData = [multiLangHeaders];

  const sampleTexts = {
    english: ['Hello', 'World', 'Test', 'Data', 'Sample'],
    chinese: ['你好', '世界', '测试', '数据', '示例'],
    japanese: ['こんにちは', '世界', 'テスト', 'データ', 'サンプル'],
    korean: ['안녕하세요', '세계', '테스트', '데이터', '샘플'],
    arabic: ['مرحبا', 'عالم', 'اختبار', 'بيانات', 'عينة'],
    hebrew: ['שלום', 'עולם', 'בדיקה', 'נתונים', 'דוגמה'],
    russian: ['Привет', 'Мир', 'Тест', 'Данные', 'Образец'],
    spanish: ['Hola', 'Mundo', 'Prueba', 'Datos', 'Muestra'],
    french: ['Bonjour', 'Monde', 'Test', 'Données', 'Échantillon'],
    german: ['Hallo', 'Welt', 'Test', 'Daten', 'Beispiel'],
    italian: ['Ciao', 'Mondo', 'Test', 'Dati', 'Campione'],
    emoji: ['😀', '🚀', '💡', '✨', '🎉'],
    vietnamese: ['Xin chào', 'Thế giới', 'Kiểm tra', 'Dữ liệu', 'Mẫu'],
    thai: ['สวัสดี', 'โลก', 'ทดสอบ', 'ข้อมูล', 'ตัวอย่าง'],
    hindi: ['नमस्ते', 'दुनिया', 'परीक्षण', 'डेटा', 'नमूना']
  };

  for (let i = 1; i <= 100; i++) {
    const row = [];
    Object.values(sampleTexts).forEach((texts) => {
      row.push(texts[i % texts.length] + i);
    });
    multiLangData.push(row);
  }

  const ws6 = XLSX.utils.aoa_to_sheet(multiLangData);
  XLSX.utils.book_append_sheet(wb3, ws6, '多语言测试数据');

  // 添加一个包含特殊格式的Sheet
  const specialFormatData = [
    [
      '电话号码',
      'Email',
      'IP地址',
      '邮编',
      '身份证号',
      'URL',
      '颜色代码',
      'Unix时间戳'
    ]
  ];

  for (let i = 1; i <= 80; i++) {
    specialFormatData.push([
      `+86 ${138 + (i % 10)}${String(Math.floor(Math.random() * 10000000)).padStart(7, '0')}`,
      `user${i}@example${i % 5}.com`,
      `192.168.${i % 256}.${(i * 2) % 256}`,
      `${100000 + i}`,
      `${110000 + i}19900101${String(i).padStart(4, '0')}`,
      `https://www.example${i}.com/path/to/page?id=${i}`,
      `#${Math.floor(Math.random() * 16777215)
        .toString(16)
        .padStart(6, '0')}`,
      `${1704067200 + i * 86400}`
    ]);
  }

  const ws7 = XLSX.utils.aoa_to_sheet(specialFormatData);
  XLSX.utils.book_append_sheet(wb3, ws7, '特殊格式数据');

  XLSX.writeFile(wb3, '/tmp/test-contacts/多语言和特殊格式.xlsx');

  console.log('✅ 异常数据测试文件生成完成！');
  console.log('📊 文件统计:');
  console.log('   📁 异常数据测试文件.xlsx:');
  console.log(
    '     - 超长Sheet名称1: 25列 x 300行（包含null、undefined、特殊字符等）'
  );
  console.log('     - 超长Sheet名称2: 30列 x 150行（稀疏数据）');
  console.log('     - 超长Sheet名称3: 20列 x 100行');
  console.log('   📁 性能测试大数据文件.xlsx:');
  console.log('     - 超大数据量: 35列 x 500行');
  console.log('     - 中等数据量: 25列 x 200行');
  console.log('   📁 多语言和特殊格式.xlsx:');
  console.log('     - 多语言测试: 15列 x 100行');
  console.log('     - 特殊格式: 8列 x 80行');
  console.log('');
  console.log('🎯 测试场景:');
  console.log('   ✓ 超长Sheet名称处理');
  console.log('   ✓ null/undefined/空值处理');
  console.log('   ✓ 特殊字符和表情符号');
  console.log('   ✓ 超长文本换行显示');
  console.log('   ✓ 大数据量性能测试（500行）');
  console.log('   ✓ 多语言字符集支持');
  console.log('   ✓ 稀疏数据处理');
}

generateAbnormalTestData();
