'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  RefreshCw,
  Settings,
  Users,
  Building2,
  Package,
  FileSpreadsheet,
  Folder,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  AlertTriangle,
  Clock,
  Zap
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

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

interface CacheStatus {
  isUpdating: boolean;
  isInitialized: boolean;
  lastUpdate: Date | null;
  pendingTasks: number;
  activeTasks: number;
  completedTasks: number;
  failedTasks?: number;
}

interface TaskProgress {
  taskId: string;
  progress: number;
  total: number;
  currentFile: string | null;
}

// File configuration
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

export default function ContactWorkspaceV3() {
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState('/tmp/test-contacts');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Cache status
  const [cacheStatus, setCacheStatus] = useState<CacheStatus>({
    isUpdating: false,
    isInitialized: false,
    lastUpdate: null,
    pendingTasks: 0,
    activeTasks: 0,
    completedTasks: 0
  });
  const [taskProgress, setTaskProgress] = useState<TaskProgress | null>(null);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  
  // Sheet data
  const [sheetInfo, setSheetInfo] = useState<SheetInfo | null>(null);
  const [sheetData, setSheetData] = useState<Contact[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);
  const [totalRows, setTotalRows] = useState(0);
  const [dataLoading, setDataLoading] = useState(false);
  
  // Search data
  const [searchResults, setSearchResults] = useState<Contact[]>([]);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [searchLoading, setSearchLoading] = useState(false);
  
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  const totalPages = Math.ceil(totalRows / pageSize);
  const searchTotalPages = Math.ceil(searchTotal / 50);

  // Initialize folder with background processing
  const initializeFolder = async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `/api/excel/v3?action=setFolder&folderPath=${encodeURIComponent(folderPath)}`
      );
      const result = await response.json();
      if (result.success) {
        setCurrentTaskId(result.taskId);
        setSettingsOpen(false);
        // Load files immediately (even if cache is incomplete)
        await loadFiles();
      }
    } catch (error) {
      console.error('Failed to initialize folder:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFiles = async () => {
    try {
      const response = await fetch('/api/excel/v3?action=getFiles');
      const result = await response.json();
      if (result.success) {
        setFiles(result.data.files);
        setLastUpdate(result.data.lastUpdate ? new Date(result.data.lastUpdate) : null);
        
        if (result.data.files.length > 0 && !selectedFile) {
          const firstFile = result.data.files[0];
          setSelectedFile(firstFile.fileName);
          await loadSheets(firstFile.fileName);
        }
      }
    } catch (error) {
      console.error('Failed to load files:', error);
    }
  };

  const loadSheets = async (fileName: string) => {
    try {
      const response = await fetch(
        `/api/excel/v3?action=getSheets&fileName=${encodeURIComponent(fileName)}`
      );
      const result = await response.json();
      if (result.success && result.data.length > 0) {
        setSelectedSheet(result.data[0]);
      }
    } catch (error) {
      console.error('Failed to load sheets:', error);
    }
  };

  const loadSheetData = useCallback(async () => {
    if (!selectedFile || !selectedSheet) return;
    
    setDataLoading(true);
    try {
      const [infoResponse, dataResponse] = await Promise.all([
        fetch(`/api/excel/v3?action=getSheetInfo&fileName=${encodeURIComponent(selectedFile)}&sheetName=${encodeURIComponent(selectedSheet)}`),
        fetch(`/api/excel/v3?action=getSheetData&fileName=${encodeURIComponent(selectedFile)}&sheetName=${encodeURIComponent(selectedSheet)}&page=${currentPage}&pageSize=${pageSize}`)
      ]);
      
      const [infoResult, dataResult] = await Promise.all([
        infoResponse.json(),
        dataResponse.json()
      ]);
      
      if (infoResult.success) {
        setSheetInfo(infoResult.data);
        setTotalRows(infoResult.data?.totalRows || 0);
      }
      
      if (dataResult.success) {
        setSheetData(dataResult.data.data);
      }
    } catch (error) {
      console.error('Failed to load sheet data:', error);
    } finally {
      setDataLoading(false);
    }
  }, [selectedFile, selectedSheet, currentPage, pageSize]);

  const performSearch = useCallback(async () => {
    if (!debouncedSearchQuery.trim()) {
      setSearchResults([]);
      setSearchTotal(0);
      return;
    }
    
    setSearchLoading(true);
    try {
      const response = await fetch(
        `/api/excel/v3?action=search&query=${encodeURIComponent(debouncedSearchQuery)}&page=${searchPage}&pageSize=50`
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

  const handleFileChange = async (fileName: string) => {
    setSelectedFile(fileName);
    setCurrentPage(1);
    await loadSheets(fileName);
  };

  const handleSheetChange = (sheetName: string) => {
    setSelectedSheet(sheetName);
    setCurrentPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePageSizeChange = (newSize: string) => {
    setPageSize(parseInt(newSize));
    setCurrentPage(1);
  };

  // Initialize on mount
  useEffect(() => {
    initializeFolder();
  }, []);

  // SSE connection for real-time updates
  useEffect(() => {
    if (!folderPath) return;

    const es = new EventSource('/api/excel/v3/stream');

    es.onopen = () => setIsConnected(true);
    
    es.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case 'cache_status':
            setCacheStatus(data.data);
            if (data.data.lastUpdate) {
              setLastUpdate(new Date(data.data.lastUpdate));
            }
            break;
            
          case 'task_progress':
            setTaskProgress(data.data);
            break;
            
          case 'task_complete':
            setTaskProgress(null);
            loadFiles(); // Refresh files when task completes
            break;
            
          case 'task_error':
            setTaskProgress(null);
            console.error('Task error:', data.data.error);
            break;
            
          default:
            break;
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };
    
    es.onerror = () => setIsConnected(false);

    return () => es.close();
  }, [folderPath]);

  useEffect(() => {
    loadSheetData();
  }, [loadSheetData]);

  useEffect(() => {
    performSearch();
  }, [performSearch]);

  const fileConfigs = useMemo(() => {
    return files.map((file) => ({
      ...file,
      config: getFileConfig(file.fileName)
    }));
  }, [files]);

  const getCacheStatusIcon = () => {
    if (cacheStatus.isUpdating) {
      return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />;
    }
    if (!cacheStatus.isInitialized) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (cacheStatus.failedTasks && cacheStatus.failedTasks > 0) {
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    }
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const getCacheStatusText = () => {
    if (cacheStatus.isUpdating) {
      return '更新缓存中';
    }
    if (!cacheStatus.isInitialized) {
      return '初始化中';
    }
    if (cacheStatus.failedTasks && cacheStatus.failedTasks > 0) {
      return '部分失败';
    }
    return '缓存就绪';
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Left sidebar */}
      <div className="w-80 border-r bg-white">
        <div className="p-4">
          {/* Header */}
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

          {/* Cache Status Card */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2">
                {getCacheStatusIcon()}
                缓存状态
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>{getCacheStatusText()}</span>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {isConnected ? '已连接' : '未连接'}
                  </Badge>
                </div>
                
                {taskProgress && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{taskProgress.currentFile}</span>
                      <span>{taskProgress.progress}/{taskProgress.total}</span>
                    </div>
                    <Progress 
                      value={(taskProgress.progress / taskProgress.total) * 100} 
                      className="h-2"
                    />
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">{cacheStatus.activeTasks}</div>
                    <div className="text-gray-500">处理中</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">{cacheStatus.completedTasks}</div>
                    <div className="text-gray-500">已完成</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">{cacheStatus.pendingTasks}</div>
                    <div className="text-gray-500">队列中</div>
                  </div>
                </div>
                
                {lastUpdate && (
                  <div className="text-xs text-gray-500">
                    更新: {lastUpdate.toLocaleTimeString()}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* File List */}
          <ScrollArea className="h-[calc(100vh-400px)]">
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
                      {cacheStatus.isUpdating && (
                        <Zap className="h-4 w-4 text-blue-500" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Search bar */}
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
          
          {/* Search results */}
          {searchQuery && searchResults.length > 0 && (
            <div className="mt-4 rounded-lg border bg-white p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm text-gray-600">
                  找到 {searchTotal} 条结果
                  {searchLoading && <RefreshCw className="ml-2 inline h-3 w-3 animate-spin" />}
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

        {/* Sheet tabs and content */}
        {files.length > 0 && selectedFile && (
          <div className="flex-1 flex flex-col p-4">
            {(() => {
              const currentFile = files.find(f => f.fileName === selectedFile);
              if (!currentFile || currentFile.sheets.length === 0) {
                return (
                  <div className="flex h-full items-center justify-center text-gray-500">
                    {cacheStatus.isUpdating ? '正在加载数据...' : '暂无数据'}
                  </div>
                );
              }

              return (
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
                          {/* Pagination controls */}
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

                          {/* Table */}
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
                                {!cacheStatus.isInitialized ? '正在初始化缓存...' : '暂无数据'}
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </TabsContent>
                  ))}
                </Tabs>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}