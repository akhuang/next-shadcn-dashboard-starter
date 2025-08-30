import { excelAsyncCacheService } from '@/lib/excel-async-cache-service';

export default async function TestExcelPage() {
  // 服务器端直接获取数据
  const files = await excelAsyncCacheService.getFiles();
  const lastUpdate = await excelAsyncCacheService.getLastUpdate();

  // 如果有文件，获取第一个文件的第一个工作表数据
  let sheetData = null;
  if (files.length > 0 && files[0].sheets && files[0].sheets.length > 0) {
    sheetData = await excelAsyncCacheService.getSheetData(
      files[0].fileName,
      files[0].sheets[0],
      1,
      10
    );
  }

  return (
    <div className='p-8'>
      <h1 className='mb-4 text-2xl font-bold'>Excel 数据测试</h1>

      <div className='mb-6'>
        <h2 className='mb-2 text-lg font-semibold'>最后更新时间</h2>
        <p>{lastUpdate ? lastUpdate.toLocaleString() : '无'}</p>
      </div>

      <div className='mb-6'>
        <h2 className='mb-2 text-lg font-semibold'>
          文件列表 ({files.length})
        </h2>
        {files.map((file, i) => (
          <div key={i} className='mb-2 rounded border p-3'>
            <p>
              <strong>文件名:</strong> {file.fileName || '未定义'}
            </p>
            <p>
              <strong>显示名:</strong> {file.displayName || '未定义'}
            </p>
            <p>
              <strong>工作表:</strong> {file.sheets?.join(', ') || '无'}
            </p>
            <p>
              <strong>大小:</strong> {file.size} bytes
            </p>
            <p>
              <strong>修改时间:</strong> {file.lastModified?.toString()}
            </p>
          </div>
        ))}
      </div>

      {sheetData && (
        <div className='mb-6'>
          <h2 className='mb-2 text-lg font-semibold'>
            第一个工作表数据 (前10条，共 {sheetData.total} 条)
          </h2>
          <div className='overflow-x-auto'>
            <pre className='rounded bg-gray-100 p-4 text-xs'>
              {JSON.stringify(sheetData.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
