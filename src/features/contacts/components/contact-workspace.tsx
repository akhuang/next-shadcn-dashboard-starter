'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  RefreshCw,
  Settings,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import { MergeRange, ExcelData } from '@/types/excel';
import ExcelTable from './excel-table';
import ContactSearchOverlay from './contact-search-overlay';

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
  }>;
  icon: any;
  color: string;
  bgColor: string;
  totalContacts: number;
}

// 文件配置
const getFileConfig = (fileName: string) => {
  const name = fileName.toLowerCase();
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
  const [data, setData] = useState<ExcelData>({
    contacts: [],
    lastUpdated: new Date(),
    files: []
  });
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState('/tmp/test-contacts');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);

  // 使用防抖处理搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 构建文件数据结构
  const fileDataList = useMemo(() => {
    const filesMap = new Map<string, FileData>();

    data.contacts.forEach((contact) => {
      if (!filesMap.has(contact.fileName)) {
        const config = getFileConfig(contact.fileName);
        filesMap.set(contact.fileName, {
          fileName: contact.fileName,
          displayName: contact.fileName.replace(/\.(xlsx|xls|xlsm)$/i, ''),
          sheets: [],
          icon: config.icon,
          color: config.color,
          bgColor: config.bgColor,
          totalContacts: 0
        });
      }

      const fileData = filesMap.get(contact.fileName)!;
      let sheet = fileData.sheets.find((s) => s.name === contact.sheetName);

      if (!sheet) {
        sheet = {
          name: contact.sheetName,
          contacts: [],
          columns: [],
          mergeRanges: []
        };
        fileData.sheets.push(sheet);
      }

      sheet.contacts.push(contact);
      fileData.totalContacts++;
    });

    // 计算每个Sheet的列和合并信息
    filesMap.forEach((fileData) => {
      fileData.sheets.forEach((sheet) => {
        const columnsSet = new Set<string>();
        sheet.contacts.forEach((contact) => {
          Object.keys(contact.rowData).forEach((key) => columnsSet.add(key));
        });
        sheet.columns = Array.from(columnsSet);

        // 从 sheetInfoMap 获取合并信息
        if (data.sheetInfoMap && data.sheetInfoMap[fileData.fileName]) {
          const sheetInfo = data.sheetInfoMap[fileData.fileName][sheet.name];
          if (sheetInfo && sheetInfo.mergeRanges) {
            sheet.mergeRanges = sheetInfo.mergeRanges;
          }
        }
      });
    });

    return Array.from(filesMap.values());
  }, [data.contacts, data.sheetInfoMap]);

  // 当前选中文件的数据
  const currentFileData = useMemo(() => {
    return fileDataList.find((f) => f.fileName === selectedFile);
  }, [fileDataList, selectedFile]);

  // 当前选中Sheet的所有数据
  const currentSheetContacts = useMemo(() => {
    if (currentFileData && selectedSheet) {
      const sheet = currentFileData.sheets.find(
        (s) => s.name === selectedSheet
      );
      return sheet ? sheet.contacts : [];
    }
    return [];
  }, [currentFileData, selectedSheet]);

  // 全局搜索 - 使用防抖后的查询搜索所有文件的所有数据
  const globalSearchResults = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return null;
    }

    const query = debouncedSearchQuery.toLowerCase();
    const results = data.contacts.filter((contact) => {
      // 搜索所有字段
      return Object.values(contact.rowData).some((value) =>
        value?.toString().toLowerCase().includes(query)
      );
    });

    // 按文件和Sheet分组
    const grouped = results.reduce(
      (acc, contact) => {
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
      },
      {} as Record<
        string,
        { fileName: string; sheetName: string; contacts: typeof results }
      >
    );

    return {
      total: results,
      grouped: Object.values(grouped),
      hasMultipleSources: Object.keys(grouped).length > 1
    };
  }, [data.contacts, debouncedSearchQuery]);

  // 显示的联系人数据：搜索时不改变表格内容，只显示当前Sheet
  const displayContacts = useMemo(() => {
    return currentSheetContacts;
  }, [currentSheetContacts]);

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

  const initializeFolder = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/excel?action=setFolder&folderPath=${encodeURIComponent(folderPath)}`
      );
      const result = await response.json();
      if (result.success) {
        setData(result.data);
      }
    } catch (error) {
      // ignore initialize error
    } finally {
      setLoading(false);
    }
  };

  // SSE连接
  useEffect(() => {
    if (!folderPath) return;

    initializeFolder();

    const es = new EventSource('/api/excel/stream');

    es.onopen = () => setIsConnected(true);
    es.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(newData);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    es.onerror = () => setIsConnected(false);

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [folderPath]);

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

  const selectFile = (fileName: string) => {
    setSelectedFile(fileName);
    const fileData = fileDataList.find((f) => f.fileName === fileName);
    if (fileData && fileData.sheets.length > 0) {
      setSelectedSheet(fileData.sheets[0].name);
    }
  };

  // 处理搜索结果选择
  const handleSearchResultSelect = useCallback(
    (fileName: string, sheetName: string) => {
      setSelectedFile(fileName);
      setSelectedSheet(sheetName);
      setSearchQuery('');
      setShowSearchOverlay(false);
    },
    []
  );

  // 监听搜索查询变化，自动打开/关闭遮罩层
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      setShowSearchOverlay(true);
    } else {
      setShowSearchOverlay(false);
    }
  }, [debouncedSearchQuery]);

  return (
    <>
      {/* 搜索结果遮罩层 */}
      <ContactSearchOverlay
        isOpen={showSearchOverlay}
        onClose={() => {
          setShowSearchOverlay(false);
          setSearchQuery('');
        }}
        searchQuery={debouncedSearchQuery}
        searchResults={globalSearchResults}
        onSelectResult={handleSearchResultSelect}
      />

      <div className='bg-background flex h-full flex-col overflow-hidden'>
        {/* 顶部工具栏 */}
        <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
          <div className='flex h-14 items-center gap-4 px-4'>
            {/* 左侧状态 */}
            <div className='flex items-center gap-3'>
              <Badge
                variant={isConnected ? 'default' : 'secondary'}
                className='text-xs'
              >
                {isConnected ? (
                  <div className='flex items-center gap-1'>
                    <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
                    实时同步
                  </div>
                ) : (
                  '离线'
                )}
              </Badge>
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
                onClick={initializeFolder}
                disabled={loading}
                className='cursor-pointer disabled:cursor-not-allowed'
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='ghost' size='sm' className='cursor-pointer'>
                    <Settings className='h-4 w-4' />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>设置监控文件夹</DialogTitle>
                  </DialogHeader>
                  <div className='space-y-4'>
                    <div>
                      <Label htmlFor='folderPath'>文件夹路径</Label>
                      <Input
                        id='folderPath'
                        value={folderPath}
                        onChange={(e) => setFolderPath(e.target.value)}
                        placeholder='/path/to/excel/folder'
                      />
                    </div>
                    <Button onClick={initializeFolder} className='w-full'>
                      确认设置
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        <div className='flex min-h-0 flex-1 overflow-hidden'>
          {/* 左侧文件列表 */}
          <div className='bg-muted/20 flex w-60 flex-shrink-0 flex-col overflow-hidden border-r'>
            <div className='flex-shrink-0 border-b p-3'>
              <h2 className='text-muted-foreground text-sm font-medium'>
                数据源
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
                          {fileData.sheets.length} 个分类 ·{' '}
                          {fileData.totalContacts} 条记录
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
                            <span className='block truncate' title={sheet.name}>
                              {sheet.name}
                            </span>
                            <Badge
                              variant='secondary'
                              className='ml-1.5 min-w-[1.2rem] justify-center px-1 py-0 text-xs'
                            >
                              {sheet.contacts.length}
                            </Badge>
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
                    className='mt-0 min-h-0 min-w-0 flex-1 overflow-hidden overflow-x-auto data-[state=active]:flex'
                  >
                    {selectedSheet === sheet.name && (
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
                        onExport={exportToCSV}
                        mergeRanges={sheet.mergeRanges || []}
                        enableAutoMerge={false}
                      />
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
                  <p>选择一个数据源开始查看</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
