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
  ChevronLeft,
  ChevronRight
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
import { MergeRange } from '@/types/excel';
import ExcelTable from './excel-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface FileInfo {
  fileName: string;
  displayName: string;
  sheets: string[];
  lastModified: Date;
  size: number;
}

interface SheetInfo {
  name: string;
  columns: string[];
  mergeRanges: MergeRange[];
  title?: string;
  totalRows: number;
}

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
  rowIndex: number;
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

export default function ContactWorkspaceV2() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState('/tmp/test-contacts');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Sheet 相关状态
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [sheetData, setSheetData] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalRows, setTotalRows] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  
  // 搜索相关状态
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  
  // 使用防抖处理搜索查询
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // 计算总页数
  const totalPages = Math.ceil(totalRows / pageSize);
  const searchTotalPages = Math.ceil(searchTotal / 50);

  // 初始化文件夹
  const initializeFolder = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/excel/v2?action=setFolder&folderPath=${encodeURIComponent(folderPath)}`
      );
      const result = await response.json();
      if (result.success) {
        setSettingsOpen(false);
        // 加载文件列表
        await loadFiles();
      }
    } catch (error) {
      console.error('Failed to initialize folder:', error);
    } finally {
      setLoading(false);
    }
  };

  // 加载文件列表
  const loadFiles = async () => {
    try {
      const response = await fetch('/api/excel/v2?action=getFiles');
      const result = await response.json();
      if (result.success) {
        setFiles(result.data.files);
        setLastUpdate(result.data.lastUpdate ? new Date(result.data.lastUpdate) : null);
        
        // 自动选择第一个文件
        if (result.data.files.length > 0 && !selectedFile) {
          const firstFile = result.data.files[0];
          setSelectedFile(firstFile.fileName);
          // 加载该文件的sheets
          await loadSheets(firstFile.fileName);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  // 加载文件的sheets
  const loadSheets = async (fileName: string) => {
    try {
      const response = await fetch(
        `/api/excel/v2?action=getSheets&fileName=${encodeURIComponent(fileName)}`
      );
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setSelectedSheet(result.data[0]);
      }
    } catch (error) {
      console.error('Failed to load sheets:', error);
    }
  };

  // 加载sheet数据
  const loadSheetData = useCallback(async () => {
    if (!selectedFile || !selectedSheet) return;
    
    setDataLoading(true);
    try {
      // 获取sheet信息
      const infoResponse = await fetch(
        `/api/excel/v2?action=getSheetInfo&fileName=${encodeURIComponent(
          selectedFile
        )}&sheetName=${encodeURIComponent(selectedSheet)}`
      );
      const infoResult = await infoResponse.json();
      if (infoResult.success) {
        setSheetInfo(infoResult.data);
        setTotalRows(infoResult.data.totalRows);
      }
      
      // 获取sheet数据
      const dataResponse = await fetch(
        `/api/excel/v2?action=getSheetData&fileName=${encodeURIComponent(
          selectedFile
        )}&sheetName=${encodeURIComponent(selectedSheet)}&page=${currentPage}&pageSize=${pageSize}`
      );
      const dataResult = await dataResponse.json();
      if (dataResult.success) {
        setSheetData(dataResult.data.data);
      }
    } catch (error) {
      console.error('Failed to load sheet data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [selectedFile, selectedSheet, currentPage, pageSize]);

  // 搜索功能
  const performSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/excel/v2?action=search&query=${encodeURIComponent(
          debouncedSearchQuery
        )}&page=${searchPage}&pageSize=50`
      );
      const result = await response.json();
      if (result.success) {
        setSearchResults(result.data.data);
        setSearchTotal(result.data.total);
      }
    } catch (error) {
      console.error('Failed to search:', error);
    } finally {
      setSearchLoading(false);
    }
  }, [debouncedSearchQuery, searchPage]);

  // 文件选择变化
  const handleFileChange = async (fileName: string) => {
    setSelectedFile(fileName);
    setCurrentPage(1);
    await loadSheets(fileName);
  };

  // Sheet选择变化
  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    setCurrentPage(1);
  };

  // 页码变化
  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // 每页显示数量变化
  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
  };

  // 初始化
  useEffect(() => {
    initializeFolder();
  }, []);

  // SSE连接
  useEffect(() => {
    if (!folderPath) return;

    const es = new EventSource('/api/excel/v2/stream');

    es.onopen = () => setIsConnected(true);
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'update') {
          setLastUpdate(new Date(data.lastUpdate));
          loadFiles();
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    es.onerror = () => setIsConnected(false);

    return () => es.close();
  }, [folderPath]);

  // 加载sheet数据
  useEffect(() => {
    loadSheetData();
  }, [loadSheetData]);

  // 执行搜索
  useEffect(() => {
    performSearch();
  }, [performSearch]);

  // 当前文件信息
  const currentFile = useMemo(() => {
    return files.find((f) => f.fileName === selectedFile);
  }, [files, selectedFile]);

  // 文件配置
  const fileConfigs = useMemo(() => {
    return files.map((file) => ({
      ...file,
      config: getFileConfig(file.fileName)
    }));
  }, [files]);

  return (
    <div className="flex h-screen bg-gray-50">
      {/* 左侧边栏 */}
      <div className="w-64 border-r bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Excel 文件</h2>
          <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <Settings className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>设置监控文件夹</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="folder-path">文件夹路径</Label>
                  <div className="mt-2 flex gap-2">
                    <Input
                      id="folder-path"
                      value={folderPath}
                      onChange={(e) => setFolderPath(e.target.value)}
                      placeholder="/path/to/excel/folder"
                    />
                    <Button onClick={initializeFolder} disabled={loading}>
                      {loading ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Folder className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* 连接状态 */}
        <div className="mb-4">
          <Badge variant={isConnected ? 'default' : 'secondary'}>
            {isConnected ? '实时监控中' : '未连接'}
          </Badge>
          {lastUpdate && (
            <p className="mt-1 text-xs text-gray-500">
              更新: {lastUpdate.toLocaleTimeString()}
            </p>
          )}
        </div>

        {/* 文件列表 */}
        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-2">
            {fileConfigs.map((file) => {
              const Icon = file.config.icon;
              return (
                <button
                  key={file.fileName}
                  onClick={() => handleFileChange(file.fileName)}
                  className={cn(
                    'w-full rounded-lg p-3 text-left transition-colors',
                    file.config.bgColor,
                    file.config.hoverColor,
                    selectedFile === file.fileName && 'ring-2 ring-blue-500'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn('h-5 w-5', file.config.color)} />
                    <div className="flex-1 overflow-hidden">
                      <p className="truncate font-medium">{file.displayName}</p>
                      <p className="text-xs text-gray-500">
                        {file.sheets.length} 个工作表
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col">
        {/* 顶部搜索栏 */}
        <div className="border-b bg-white p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              id="contact-search"
              type="text"
              placeholder="搜索所有数据..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
              </button>
            )}
          </div>
          
          {/* 搜索结果 */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-4 rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  找到 {searchTotal} 条结果
                </p>
                {searchTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchPage(searchPage - 1)}
                      disabled={searchPage === 1 || searchLoading}
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </Button>
                    <span className="text-sm">
                      {searchPage} / {searchTotalPages}
                    </span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSearchPage(searchPage + 1)}
                      disabled={searchPage === searchTotalPages || searchLoading}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              <ScrollArea className="h-48">
                {searchResults.map((result) => (
                  <div
                    key={result.id}
                    className="mb-2 rounded border p-2 text-sm"
                  >
                    <div className="mb-1 text-xs text-gray-500">
                      {result.fileName} / {result.sheetName}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {Object.entries(result.rowData).slice(0, 3).map(([key, value]) => (
                        <div key={key}>
                          <span className="text-xs text-gray-500">{key}:</span>{' '}
                          <span>{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          )}
        </div>

        {/* Sheet 标签页 */}
        {currentFile && currentFile.sheets.length > 0 && (
          <div className="flex-1 flex flex-col p-4">
            <Tabs
              value={selectedSheet}
              onValueChange={handleSheetChange}
              className="flex-1 flex flex-col"
            >
              <TabsList className="mb-4">
                {currentFile.sheets.map((sheet) => (
                  <TabsTrigger key={sheet} value={sheet}>
                    {sheet}
                  </TabsTrigger>
                ))}
              </TabsList>

              {currentFile.sheets.map((sheet) => (
                <TabsContent
                  key={sheet}
                  value={sheet}
                  className="flex-1 flex flex-col"
                >
                  {selectedSheet === sheet && (
                    <>
                      {/* 分页控制 */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <span className="text-sm text-gray-600">
                            共 {totalRows} 条数据
                          </span>
                          <Select value={pageSize.toString()} onValueChange={handlePageSizeChange}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="50">50 条/页</SelectItem>
                              <SelectItem value="100">100 条/页</SelectItem>
                              <SelectItem value="200">200 条/页</SelectItem>
                              <SelectItem value="500">500 条/页</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={currentPage === 1 || dataLoading}
                          >
                            <ChevronLeft className="h-4 w-4" />
                            上一页
                          </Button>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              value={currentPage}
                              onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
                              className="w-16 text-center"
                              min="1"
                              max={totalPages}
                            />
                            <span className="text-sm text-gray-600">
                              / {totalPages}
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={currentPage === totalPages || dataLoading}
                          >
                            下一页
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>

                      {/* 表格内容 */}
                      <div className="flex-1 overflow-auto rounded-lg border bg-white">
                        {dataLoading ? (
                          <div className="flex h-full items-center justify-center">
                            <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
                          </div>
                        ) : sheetInfo && sheetData.length > 0 ? (
                          <ExcelTable
                            data={sheetData}
                            columns={sheetInfo.columns}
                            mergeRanges={sheetInfo.mergeRanges}
                            title={sheetInfo.title}
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-500">
                            暂无数据
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}
      </div>
    </div>
  );
}