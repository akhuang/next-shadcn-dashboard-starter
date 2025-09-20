'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Download,
  Users,
  Building2,
  Package,
  FileSpreadsheet,
  Folder,
  Search,
  X,
  Copy
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { MergeRange } from '@/types/excel';
import ExcelTable from './excel-table';
// import ContactSearchOverlay from './contact-search-overlay'; // 不再使用遮罩层
import ContactSearchResults from './contact-search-results';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

interface FileData {
  fileName: string;
  displayName: string;
  sheets: Array<{
    name: string;
    contacts: Contact[];
    columns: string[];
    mergeRanges?: MergeRange[];
    totalRows?: number;
  }>;
  icon: any;
  color: string;
  bgColor: string;
  totalContacts: number;
}

// 文件配置
const getFileConfig = (fileName: string) => {
  const name = (fileName || '').toLowerCase();
  if (name.includes('客户') || name.includes('customer'))
    return {
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      hoverColor: 'hover:bg-blue-100'
    };
  if (name.includes('供应商') || name.includes('supplier'))
    return {
      icon: Building2,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      hoverColor: 'hover:bg-green-100'
    };
  if (name.includes('员工') || name.includes('employee'))
    return {
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      hoverColor: 'hover:bg-purple-100'
    };
  if (name.includes('产品') || name.includes('product'))
    return {
      icon: Package,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      hoverColor: 'hover:bg-orange-100'
    };
  return {
    icon: FileSpreadsheet,
    color: 'text-gray-600',
    bgColor: 'bg-gray-50',
    hoverColor: 'hover:bg-gray-100'
  };
};

export default function ContactWorkspace() {
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  // 文件夹路径由后端监控服务的环境变量控制，不再需要前端设置
  // 实时指示不依赖 SSE，去除连接状态
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  // const [showSearchOverlay, setShowSearchOverlay] = useState(false); // 不再需要遮罩层

  // 新的状态：存储从API获取的文件信息
  const [apiFiles, setApiFiles] = useState<any[]>([]);
  const [sheetInfoMap, setSheetInfoMap] = useState<
    Record<string, Record<string, any>>
  >({});
  const [currentSheetContacts, setCurrentSheetContacts] = useState<Contact[]>(
    []
  );
  const [loadingSheet, setLoadingSheet] = useState(false);
  const [totalRows, setTotalRows] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 100;

  // 使用防抖处理搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 构建文件数据结构 - 使用新的API数据
  const fileDataList = useMemo(() => {
    return apiFiles.map((file) => {
      const safeFileName = file?.fileName || '';
      const config = getFileConfig(safeFileName);
      const sheets =
        file.sheets?.map((sheetName: string) => {
          const sheetInfo = sheetInfoMap[safeFileName]?.[sheetName];
          return {
            name: sheetName,
            contacts:
              selectedFile === safeFileName && selectedSheet === sheetName
                ? currentSheetContacts
                : [],
            columns: sheetInfo?.columns || [],
            mergeRanges: sheetInfo?.mergeRanges || [],
            title: sheetInfo?.title,
            totalRows: sheetInfo?.totalRows || 0
          };
        }) || [];

      return {
        fileName: safeFileName,
        displayName:
          file.displayName || safeFileName.replace(/\.(xlsx|xls|xlsm)$/i, ''),
        sheets,
        icon: config.icon,
        color: config.color,
        bgColor: config.bgColor,
        // 使用已加载的 sheetInfo 的 totalRows 汇总作为记录数展示
        totalContacts: sheets.reduce(
          (sum: number, sheet: { totalRows?: number }) =>
            sum + (sheet.totalRows || 0),
          0
        )
      } as FileData;
    });
  }, [
    apiFiles,
    sheetInfoMap,
    selectedFile,
    selectedSheet,
    currentSheetContacts
  ]);

  // 当前选中文件的数据
  const currentFileData = useMemo(() => {
    return fileDataList.find((f) => f.fileName === selectedFile);
  }, [fileDataList, selectedFile]);

  // 加载Sheet数据
  const loadSheetData = useCallback(
    async (fileName: string, sheetName: string, page: number = 1) => {
      if (!fileName || !sheetName) return;

      setLoadingSheet(true);
      try {
        const response = await fetch(
          `/api/excel/v3?action=getSheetData&fileName=${encodeURIComponent(fileName)}&sheetName=${encodeURIComponent(sheetName)}&page=${page}&pageSize=${pageSize}`,
          { cache: 'no-store' }
        );
        const result = await response.json();

        if (result.success) {
          setCurrentSheetContacts(result.data.data);
          setTotalRows(result.data.total);
        }
      } catch (error) {
        console.error('Failed to load sheet data:', error);
        setCurrentSheetContacts([]);
      } finally {
        setLoadingSheet(false);
      }
    },
    [pageSize]
  );

  // 全局搜索 - 使用异步搜索 API
  const [searchResults, setSearchResults] = useState<{
    total: Contact[];
    grouped: Array<{
      fileName: string;
      sheetName: string;
      contacts: Contact[];
    }>;
    hasMultipleSources: boolean;
  } | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);

  // 执行搜索
  const performSearch = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults(null);
      return;
    }

    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/excel/v3?action=search&query=${encodeURIComponent(trimmedQuery)}&page=1&pageSize=100`,
        { cache: 'no-store' }
      );
      const result = await response.json();

      if (result.success) {
        const results = result.data.data;

        // 按文件和Sheet分组
        const grouped = results.reduce((acc: any, contact: Contact) => {
          const key = `${contact.fileName}|||${contact.sheetName}`;
          if (!acc[key]) {
            acc[key] = {
              fileName: contact.fileName,
              sheetName: contact.sheetName,
              contacts: []
            };
          }
          acc[key].contacts.push(contact);
          return acc;
        }, {});

        setSearchResults({
          total: results,
          grouped: Object.values(grouped),
          hasMultipleSources: Object.keys(grouped).length > 1
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults(null);
    } finally {
      setSearchLoading(false);
    }
  }, []);

  // 防抖搜索
  useEffect(() => {
    performSearch(debouncedSearchQuery);
  }, [debouncedSearchQuery, performSearch]);

  // 显示的联系人数据：搜索时不改变表格内容，只显示当前Sheet
  const displayContacts = useMemo(() => {
    return currentSheetContacts;
  }, [currentSheetContacts]);

  // 只加载文件列表（不加载工作表信息）
  const loadFilesList = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/excel/v3?action=getFiles', {
        cache: 'no-store' // 禁用缓存，确保获取最新数据
      });
      const result = await response.json();

      if (result.success && result.data.files) {
        setApiFiles(result.data.files);
        // 服务器应该返回数据的最后更新时间
        if (result.data.lastUpdate) {
          const updateTime = new Date(result.data.lastUpdate);
          setLastSyncTime(updateTime);
        } else {
          // 如果服务器没有返回更新时间，说明API有问题
          console.error('API did not return lastUpdate timestamp');
          setLastSyncTime(null);
        }
      }
    } catch (error) {
      console.error('Failed to load files list:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 组件初始化：只加载文件列表
  useEffect(() => {
    loadFilesList();
  }, [loadFilesList]);

  // 定时更新同步时间显示
  useEffect(() => {
    if (!lastSyncTime) return;

    const timer = setInterval(() => {
      // 触发重新渲染以更新时间显示
      setLastSyncTime((prev) => (prev ? new Date(prev) : null));
    }, 60000); // 每分钟更新一次

    return () => clearInterval(timer);
  }, [lastSyncTime]);

  // 初始化选择
  useEffect(() => {
    if (fileDataList.length > 0 && !selectedFile) {
      const firstFile = fileDataList[0];
      setSelectedFile(firstFile.fileName);
      if (firstFile.sheets.length > 0) {
        setSelectedSheet(firstFile.sheets[0].name);
      }
    }
  }, [fileDataList, selectedFile]);

  // 监听 Command+K 打开搜索时，拦截并使用本地搜索
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // 阻止kbar打开，聚焦到本地搜索框
        const searchInput = document.querySelector(
          '#contact-search'
        ) as HTMLInputElement;
        if (searchInput) {
          searchInput.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // 加载指定工作表的信息（按需加载）
  const loadSheetInfo = useCallback(
    async (fileName: string, sheetName: string) => {
      // 检查是否已缓存
      if (sheetInfoMap[fileName]?.[sheetName]) {
        return sheetInfoMap[fileName][sheetName];
      }
      try {
        const response = await fetch(
          `/api/excel/v3?action=getSheetInfo&fileName=${encodeURIComponent(fileName)}&sheetName=${encodeURIComponent(sheetName)}`,
          { cache: 'no-store' }
        );
        const result = await response.json();

        if (result.success && result.data) {
          // 更新缓存
          setSheetInfoMap((prev) => ({
            ...prev,
            [fileName]: {
              ...prev[fileName],
              [sheetName]: result.data
            }
          }));
          return result.data;
        }
      } catch (error) {
        console.error(
          `Failed to load sheet info for ${fileName}:${sheetName}`,
          error
        );
      }
      return null;
    },
    [sheetInfoMap]
  );

  // 初始化时加载文件列表
  useEffect(() => {
    loadFilesList();
  }, []);

  const exportToCSV = () => {
    if (displayContacts.length === 0) return;

    // 获取所有可能的列
    const allColumns = new Set<string>();
    displayContacts.forEach((contact) => {
      Object.keys(contact.rowData).forEach((key) => allColumns.add(key));
    });
    const headers = Array.from(allColumns);

    const csvContent = [
      headers.join(','),
      ...displayContacts.map((contact) =>
        headers
          .map(
            (header) =>
              `"${(contact.rowData[header] || '').toString().replace(/"/g, '""')}"`
          )
          .join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    const fileName = searchQuery
      ? `search_results_${searchQuery}`
      : `contacts_${selectedSheet}`;
    link.download = `${fileName}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const selectFile = useCallback(
    (fileName: string) => {
      setSelectedFile(fileName);
      // 从apiFiles中获取sheets信息（不需要详细的工作表信息）
      const file = apiFiles.find((f) => f.fileName === fileName);
      if (file && file.sheets && file.sheets.length > 0) {
        setSelectedSheet(file.sheets[0]);
      }
    },
    [apiFiles]
  );

  // 统一的数据加载逻辑：只在文件/工作表变化时触发
  useEffect(() => {
    if (selectedFile && selectedSheet) {
      // 重置页码到第1页
      setCurrentPage(1);

      // 先加载工作表信息，再加载第1页数据
      const loadData = async () => {
        await loadSheetInfo(selectedFile, selectedSheet);
        await loadSheetData(selectedFile, selectedSheet, 1);
      };

      loadData();
    }
  }, [selectedFile, selectedSheet, loadSheetData, loadSheetInfo]);

  // 单独处理页码变化（当页码 > 1 时）
  useEffect(() => {
    if (selectedFile && selectedSheet && currentPage > 1) {
      loadSheetData(selectedFile, selectedSheet, currentPage);
    }
  }, [currentPage]);

  // 处理搜索结果选择 - 不再需要，因为使用直接展示模式
  // const handleSearchResultSelect = useCallback(
  //   (fileName: string, sheetName: string) => {
  //     setSelectedFile(fileName);
  //     setSelectedSheet(sheetName);
  //     setSearchQuery('');
  //     setShowSearchOverlay(false);
  //   },
  //   []
  // );

  return (
    <>
      {/* 搜索结果遮罩层 - 已改为直接显示模式 */}
      {/* <ContactSearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => {
          setShowSearchOverlay(false);
          setSearchQuery('');
        }}
        searchQuery={debouncedSearchQuery}
        searchResults={searchResults}
        onSelectResult={handleSearchResultSelect}
      /> */}

      <div className='bg-background flex h-full flex-col overflow-hidden'>
        {/* 顶部工具栏 */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
          <div className='flex h-14 items-center gap-4 px-4'>
            {/* 左侧状态（固定显示实时同步与“已经是最新数据”） */}
            <div className='flex items-center gap-3'>
              <Badge variant='default' className='text-xs'>
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
                  实时同步
                </div>
              </Badge>
              <Badge variant='secondary' className='text-xs'>
                已经是最新数据
              </Badge>
              {lastSyncTime && (
                <span className='text-muted-foreground text-xs'>
                  最新数据:{' '}
                  {lastSyncTime.toLocaleString('zh-CN', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  })}
                </span>
              )}
            </div>

            {/* 居中搜索框 */}
            <div className='flex flex-1 justify-center'>
              <div className='w-full max-w-md'>
                <div className='relative'>
                  <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
                  <Input
                    id='contact-search'
                    type='text'
                    placeholder='搜索联系人...'
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='h-9 w-full pr-9 pl-9'
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transform'
                    >
                      <X className='h-4 w-4' />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 右侧操作 */}
            <div className='flex items-center gap-1'>
              <Button
                variant='ghost'
                size='sm'
                onClick={exportToCSV}
                disabled={displayContacts.length === 0}
                className='cursor-pointer disabled:cursor-not-allowed'
              >
                <Download className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={loadFilesList}
                disabled={loading}
                className='cursor-pointer disabled:cursor-not-allowed'
                title='刷新文件列表'
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
            </div>
          </div>
        </div>

        {/* 根据是否有搜索来决定显示内容 */}
        {debouncedSearchQuery.trim() ? (
          // 搜索结果视图
          <div className='flex-1 overflow-auto p-4'>
            <ContactSearchResults
              searchQuery={debouncedSearchQuery}
              searchResults={searchResults}
              isSearching={
                searchLoading || searchQuery !== debouncedSearchQuery
              }
              onClose={() => setSearchQuery('')}
            />
          </div>
        ) : (
          // 原有的文件浏览视图
          <div className='flex min-h-0 flex-1 overflow-hidden'>
            {/* 左侧文件列表 */}
            <div className='bg-muted/20 flex w-60 flex-shrink-0 flex-col overflow-hidden border-r'>
              <div className='flex-shrink-0 border-b p-3'>
                <h2 className='text-muted-foreground text-sm font-medium'>
                  数据目录
                </h2>
              </div>
              <ScrollArea className='flex-1 overflow-y-auto'>
                <div className='space-y-1 p-2'>
                  {fileDataList.map((fileData) => {
                    const {
                      icon: FileIcon,
                      color,
                      bgColor,
                      hoverColor
                    } = getFileConfig(fileData.fileName);
                    const isSelected = selectedFile === fileData.fileName;

                    return (
                      <Button
                        key={fileData.fileName}
                        variant='ghost'
                        className={cn(
                          'h-auto w-full cursor-pointer justify-start p-2 font-normal transition-all [&>*]:min-w-0',
                          hoverColor,
                          isSelected && 'bg-accent shadow-sm'
                        )}
                        onClick={() => selectFile(fileData.fileName)}
                      >
                        <div
                          className={cn(
                            'mr-2 flex-shrink-0 rounded-md p-1.5',
                            bgColor
                          )}
                        >
                          <FileIcon className={cn('h-4 w-4', color)} />
                        </div>
                        <div className='w-0 min-w-0 flex-1 overflow-hidden text-left'>
                          <div
                            className='truncate text-sm font-medium'
                            title={fileData.displayName}
                          >
                            {fileData.displayName}
                          </div>
                          <div className='text-muted-foreground truncate text-xs'>
                            {fileData.sheets.length} 个分类
                            {fileData.totalContacts > 0 && (
                              <> · {fileData.totalContacts} 条记录</>
                            )}
                          </div>
                        </div>
                      </Button>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>

            {/* 右侧内容区 */}
            <div className='flex min-w-0 flex-1 flex-col overflow-hidden'>
              {/* Sheet Tab区域 */}
              {currentFileData && (
                <Tabs
                  value={selectedSheet}
                  onValueChange={setSelectedSheet}
                  className='flex min-w-0 flex-1 flex-col overflow-hidden'
                >
                  <div className='bg-background/50 flex items-center border-b'>
                    <div className='flex-1 overflow-x-auto'>
                      <TabsList className='h-auto justify-start rounded-none bg-transparent p-1'>
                        <div className='flex gap-1 p-2'>
                          {currentFileData.sheets.map((sheet) => (
                            <TabsTrigger
                              key={sheet.name}
                              value={sheet.name}
                              className='data-[state=active]:bg-background data-[state=active]:border-primary data-[state=active]:text-primary max-w-[200px] shrink-0 cursor-pointer border-b-2 border-transparent px-3 py-2 text-sm font-medium data-[state=active]:shadow-sm'
                            >
                              <span
                                className='block truncate'
                                title={sheet.name}
                              >
                                {sheet.name}
                              </span>
                              {sheet.totalRows !== undefined &&
                                sheet.totalRows > 0 && (
                                  <Badge
                                    variant='secondary'
                                    className='ml-1.5 min-w-[1.2rem] justify-center px-1 py-0 text-xs'
                                  >
                                    {sheet.totalRows}
                                  </Badge>
                                )}
                            </TabsTrigger>
                          ))}
                        </div>
                      </TabsList>
                    </div>
                    <div className='flex flex-shrink-0 items-center gap-1 px-2'>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={() => {
                          const currentSheet = currentFileData.sheets.find(
                            (s) => s.name === selectedSheet
                          );
                          if (!currentSheet || displayContacts.length === 0)
                            return;

                          try {
                            const headers = currentSheet.columns.join('\t');
                            const rows = displayContacts
                              .map((contact) =>
                                currentSheet.columns
                                  .map((col) => contact.rowData[col] || '')
                                  .join('\t')
                              )
                              .join('\n');

                            const textToCopy = headers + '\n' + rows;
                            navigator.clipboard.writeText(textToCopy);
                          } catch (error) {
                            console.error('复制失败:', error);
                          }
                        }}
                        title='复制数据'
                        disabled={displayContacts.length === 0}
                      >
                        <Copy className='h-4 w-4' />
                      </Button>
                      <Button
                        variant='ghost'
                        size='icon'
                        className='h-8 w-8'
                        onClick={exportToCSV}
                        title='导出 CSV'
                        disabled={displayContacts.length === 0}
                      >
                        <Download className='h-4 w-4' />
                      </Button>
                    </div>
                  </div>

                  {currentFileData.sheets.map((sheet) => (
                    <TabsContent
                      key={sheet.name}
                      value={sheet.name}
                      className='mt-0 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden data-[state=active]:flex'
                    >
                      {selectedSheet === sheet.name && (
                        <>
                          {/* 分页控件 */}
                          <div className='bg-muted/30 flex items-center justify-between border-b px-4 py-2'>
                            <div className='text-muted-foreground text-sm'>
                              共 {totalRows} 条数据，当前第 {currentPage}{' '}
                              页，每页 {pageSize} 条
                            </div>
                            <div className='flex items-center space-x-2'>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                  setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage <= 1 || loadingSheet}
                              >
                                上一页
                              </Button>
                              <span className='text-sm'>
                                {currentPage} /{' '}
                                {Math.ceil(totalRows / pageSize) || 1}
                              </span>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => setCurrentPage((p) => p + 1)}
                                disabled={
                                  currentPage >=
                                    Math.ceil(totalRows / pageSize) ||
                                  loadingSheet
                                }
                              >
                                下一页
                              </Button>
                            </div>
                          </div>

                          {/* 表格内容 */}
                          <div className='flex-1 overflow-hidden'>
                            {loadingSheet ? (
                              <div className='flex h-full items-center justify-center'>
                                <RefreshCw className='text-muted-foreground h-8 w-8 animate-spin' />
                                <span className='text-muted-foreground ml-2'>
                                  加载中...
                                </span>
                              </div>
                            ) : (
                              <ExcelTable
                                contacts={displayContacts}
                                columns={
                                  searchQuery
                                    ? Array.from(
                                        new Set(
                                          displayContacts.flatMap((c) =>
                                            Object.keys(c.rowData)
                                          )
                                        )
                                      )
                                    : sheet.columns
                                }
                                mergeRanges={sheet.mergeRanges || []}
                                enableAutoMerge={false}
                              />
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {/* 空状态 */}
              {!currentFileData && (
                <div className='flex flex-1 items-center justify-center'>
                  <div className='text-muted-foreground text-center'>
                    <Folder className='mx-auto mb-4 h-12 w-12 opacity-50' />
                    <p>选择一个数据目录开始查看</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
