const ExcelJS = require('exceljs');
const path = require('path');
const fs = require('fs');

async function createWideExcel() {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('宽表测试');

  // 创建30列数据
  const columns = [];
  for (let i = 1; i <= 30; i++) {
    columns.push({
      header: `列${i}_这是一个很长的列标题_测试溢出问题`,
      key: `col${i}`,
      width: 30
    });
  }

  worksheet.columns = columns;

  // 添加100行数据
  for (let i = 1; i <= 100; i++) {
    const rowData = {};
    for (let j = 1; j <= 30; j++) {
      rowData[`col${j}`] =
        `行${i}列${j}的测试数据内容，这是一段比较长的文本内容用于测试表格布局`;
    }
    worksheet.addRow(rowData);
  }

  // 保存文件
  const folderPath = '/tmp/test-contacts';
  if (!fs.existsSync(folderPath)) {
    fs.mkdirSync(folderPath, { recursive: true });
  }

  const filePath = path.join(folderPath, '宽表测试_30列数据.xlsx');
  await workbook.xlsx.writeFile(filePath);
  console.log(`文件已创建: ${filePath}`);
}

createWideExcel().catch(console.error);
