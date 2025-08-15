'use client';

import { useState, useEffect, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  RefreshCw,
  Settings,
  ChevronDown,
  ChevronRight,
  Download,
  Filter,
  Users,
  Building2,
  Package,
  FileSpreadsheet,
  Folder,
  X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

interface ExcelData {
  contacts: Contact[];
  lastUpdated: Date;
  files: string[];
}

interface FileNode {
  fileName: string;
  displayName: string;
  sheets: Array<{
    name: string;
    contacts: Contact[];
    columns: string[];
  }>;
  icon: any;
  isExpanded: boolean;
  totalContacts: number;
}

// 根据文件名选择图标和颜色
const getFileConfig = (fileName: string) => {
  const name = fileName.toLowerCase();
  if (name.includes('客户') || name.includes('customer'))
    return { icon: Users, color: 'text-blue-500', bgColor: 'bg-blue-50' };
  if (name.includes('供应商') || name.includes('supplier'))
    return { icon: Building2, color: 'text-green-500', bgColor: 'bg-green-50' };
  if (name.includes('员工') || name.includes('employee'))
    return { icon: Users, color: 'text-purple-500', bgColor: 'bg-purple-50' };
  if (name.includes('产品') || name.includes('product'))
    return { icon: Package, color: 'text-orange-500', bgColor: 'bg-orange-50' };
  return {
    icon: FileSpreadsheet,
    color: 'text-gray-500',
    bgColor: 'bg-gray-50'
  };
};

export default function ContactExplorer() {
  const [data, setData] = useState<ExcelData>({
    contacts: [],
    lastUpdated: new Date(),
    files: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState('/tmp/test-contacts');
  const [isConnected, setIsConnected] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [fileNodes, setFileNodes] = useState<FileNode[]>([]);

  // 构建文件树结构
  const buildFileTree = useMemo(() => {
    const nodes: FileNode[] = [];
    const fileMap = new Map<string, Map<string, Contact[]>>();

    // 按文件和Sheet分组
    data.contacts.forEach((contact) => {
      if (!fileMap.has(contact.fileName)) {
        fileMap.set(contact.fileName, new Map());
      }
      const fileSheets = fileMap.get(contact.fileName)!;
      if (!fileSheets.has(contact.sheetName)) {
        fileSheets.set(contact.sheetName, []);
      }
      fileSheets.get(contact.sheetName)!.push(contact);
    });

    fileMap.forEach((sheets, fileName) => {
      const displayName = fileName.replace(/\.(xlsx|xls|xlsm)$/i, '');
      const config = getFileConfig(fileName);
      const totalContacts = Array.from(sheets.values()).reduce(
        (sum, contacts) => sum + contacts.length,
        0
      );

      const sheetArray = Array.from(sheets.entries()).map(
        ([sheetName, contacts]) => {
          const columns = new Set<string>();
          contacts.forEach((contact) => {
            Object.keys(contact.rowData).forEach((key) => columns.add(key));
          });

          return {
            name: sheetName,
            contacts,
            columns: Array.from(columns)
          };
        }
      );

      nodes.push({
        fileName,
        displayName,
        sheets: sheetArray,
        icon: config.icon,
        isExpanded: selectedFile === fileName,
        totalContacts
      });
    });

    return nodes;
  }, [data.contacts, selectedFile]);

  // 更新文件节点
  useEffect(() => {
    setFileNodes(buildFileTree);
  }, [buildFileTree]);

  // 初始选择第一个文件和Sheet
  useEffect(() => {
    if (fileNodes.length > 0 && !selectedFile) {
      const firstFile = fileNodes[0];
      setSelectedFile(firstFile.fileName);
      if (firstFile.sheets.length > 0) {
        setSelectedSheet(firstFile.sheets[0].name);
      }
    }
  }, [fileNodes, selectedFile]);

  // 全局搜索结果
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) {
      // 没有搜索时，显示当前选中Sheet的数据
      if (!selectedFile || !selectedSheet) return [];
      return data.contacts.filter(
        (c) => c.fileName === selectedFile && c.sheetName === selectedSheet
      );
    }

    // 全局搜索
    const query = searchQuery.toLowerCase();
    return data.contacts.filter((c) => c.searchableText.includes(query));
  }, [data.contacts, searchQuery, selectedFile, selectedSheet]);

  // 获取当前显示的列
  const displayColumns = useMemo(() => {
    const columnsSet = new Set<string>();
    searchResults.forEach((contact) => {
      Object.keys(contact.rowData).forEach((key) => columnsSet.add(key));
    });
    return Array.from(columnsSet);
  }, [searchResults]);

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
      console.error('Error initializing folder:', error);
    } finally {
      setLoading(false);
    }
  };

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd+K 或 Ctrl+K 聚焦搜索
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector(
          'input[placeholder*="搜索"]'
        ) as HTMLInputElement;
        searchInput?.focus();
      }

      // ESC 清除搜索
      if (e.key === 'Escape' && searchQuery) {
        clearSearch();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [searchQuery]);

  // SSE连接
  useEffect(() => {
    if (!folderPath) return;

    initializeFolder();

    const es = new EventSource('/api/excel/stream');

    es.onopen = () => {
      setIsConnected(true);
    };

    es.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(newData);
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [folderPath]);

  const toggleFileNode = (fileName: string) => {
    setFileNodes((prev) =>
      prev.map((node) =>
        node.fileName === fileName
          ? { ...node, isExpanded: !node.isExpanded }
          : { ...node, isExpanded: false }
      )
    );
  };

  const selectSheet = (fileName: string, sheetName: string) => {
    setSelectedFile(fileName);
    setSelectedSheet(sheetName);
    setSearchQuery(''); // 清除搜索，显示选中Sheet的内容
  };

  const exportToCSV = () => {
    if (searchResults.length === 0) return;

    const headers = displayColumns;
    const csvContent = [
      headers.join(','),
      ...searchResults.map((contact) =>
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
    link.download = `contacts_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <div className='bg-background flex h-full flex-col'>
      {/* 顶部工具栏 */}
      <div className='bg-background/95 supports-[backdrop-filter]:bg-background/60 border-b backdrop-blur'>
        <div className='flex h-14 items-center gap-4 px-4'>
          {/* 左侧状态 */}
          <div className='flex items-center gap-2'>
            <Badge
              variant={isConnected ? 'default' : 'secondary'}
              className='text-xs'
            >
              {isConnected ? (
                <div className='flex items-center gap-1'>
                  <div className='h-2 w-2 animate-pulse rounded-full bg-green-500' />
                  实时
                </div>
              ) : (
                '离线'
              )}
            </Badge>
          </div>

          {/* 中间搜索栏 */}
          <div className='mx-auto max-w-sm flex-1'>
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
              <Input
                placeholder='搜索所有联系人... (⌘K)'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='bg-muted/50 focus-visible:bg-background border-0 pr-10 pl-10'
              />
              {searchQuery && (
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={clearSearch}
                  className='absolute top-1/2 right-1 h-6 w-6 -translate-y-1/2 transform p-0'
                >
                  <X className='h-3 w-3' />
                </Button>
              )}
            </div>
          </div>

          {/* 右侧操作 */}
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              onClick={exportToCSV}
              disabled={searchResults.length === 0}
            >
              <Download className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='sm'
              onClick={initializeFolder}
              disabled={loading}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
              />
            </Button>
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='ghost' size='sm'>
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

      <div className='flex flex-1'>
        {/* 左侧文件树 */}
        <div className='bg-muted/30 w-64 border-r'>
          <div className='bg-background/50 border-b p-3'>
            <h2 className='text-muted-foreground text-sm font-medium'>
              数据源
            </h2>
          </div>
          <ScrollArea className='h-full'>
            <div className='p-2'>
              {fileNodes.map((node) => {
                const {
                  icon: FileIcon,
                  color,
                  bgColor
                } = getFileConfig(node.fileName);

                return (
                  <div key={node.fileName} className='mb-1'>
                    <Button
                      variant='ghost'
                      className={cn(
                        'h-8 w-full justify-start px-2 font-normal',
                        selectedFile === node.fileName &&
                          !searchQuery &&
                          'bg-accent'
                      )}
                      onClick={() => toggleFileNode(node.fileName)}
                    >
                      {node.isExpanded ? (
                        <ChevronDown className='mr-1 h-3 w-3' />
                      ) : (
                        <ChevronRight className='mr-1 h-3 w-3' />
                      )}
                      <div className={cn('mr-2 rounded p-1', bgColor)}>
                        <FileIcon className={cn('h-3 w-3', color)} />
                      </div>
                      <span className='flex-1 truncate text-left text-xs'>
                        {node.displayName}
                      </span>
                      <Badge
                        variant='outline'
                        className='ml-1 h-4 px-1 text-xs'
                      >
                        {node.totalContacts}
                      </Badge>
                    </Button>

                    {node.isExpanded && (
                      <div className='ml-6 space-y-0.5'>
                        {node.sheets.map((sheet) => (
                          <Button
                            key={sheet.name}
                            variant='ghost'
                            size='sm'
                            className={cn(
                              'h-6 w-full justify-start px-2 text-xs font-normal',
                              selectedFile === node.fileName &&
                                selectedSheet === sheet.name &&
                                !searchQuery &&
                                'bg-accent'
                            )}
                            onClick={() =>
                              selectSheet(node.fileName, sheet.name)
                            }
                          >
                            <div className='bg-muted-foreground/30 mr-2 h-2 w-2 rounded-full' />
                            <span className='flex-1 truncate text-left'>
                              {sheet.name}
                            </span>
                            <span className='text-muted-foreground text-xs'>
                              {sheet.contacts.length}
                            </span>
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* 右侧数据区 */}
        <div className='flex flex-1 flex-col'>
          {/* 数据区头部 */}
          <div className='bg-background/50 border-b px-4 py-2'>
            <div className='flex items-center justify-between'>
              <div className='text-muted-foreground flex items-center gap-2 text-sm'>
                {searchQuery ? (
                  <div className='flex items-center gap-2'>
                    <Search className='h-4 w-4' />
                    <span>
                      搜索 &quot;{searchQuery}&quot; 找到 {searchResults.length}{' '}
                      条结果
                    </span>
                  </div>
                ) : (
                  selectedFile &&
                  selectedSheet && (
                    <div className='flex items-center gap-1 text-xs'>
                      <span className='font-medium'>
                        {selectedFile.replace(/\.[^/.]+$/, '')}
                      </span>
                      <ChevronRight className='h-3 w-3' />
                      <span>{selectedSheet}</span>
                      <span className='text-muted-foreground ml-2'>
                        ({searchResults.length} 条记录)
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>

          {/* 数据表格 */}
          <div className='flex-1'>
            <ScrollArea className='h-full'>
              <Table>
                <TableHeader>
                  <TableRow className='border-b hover:bg-transparent'>
                    {searchQuery && (
                      <>
                        <TableHead className='w-24 text-xs font-medium'>
                          来源
                        </TableHead>
                        <TableHead className='w-20 text-xs font-medium'>
                          分类
                        </TableHead>
                      </>
                    )}
                    {displayColumns.map((column) => (
                      <TableHead key={column} className='text-xs font-medium'>
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {searchResults.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={displayColumns.length + (searchQuery ? 2 : 0)}
                        className='text-muted-foreground py-12 text-center'
                      >
                        {searchQuery ? (
                          <div className='flex flex-col items-center gap-2'>
                            <Search className='text-muted-foreground/50 h-8 w-8' />
                            <span>没有找到匹配的联系人</span>
                          </div>
                        ) : (
                          <div className='flex flex-col items-center gap-2'>
                            <Folder className='text-muted-foreground/50 h-8 w-8' />
                            <span>选择一个分类查看数据</span>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    searchResults.map((contact, index) => (
                      <TableRow
                        key={contact.id}
                        className={cn(
                          'hover:bg-muted/50 transition-colors',
                          index % 2 === 0 ? 'bg-muted/20' : 'bg-background'
                        )}
                      >
                        {searchQuery && (
                          <>
                            <TableCell className='font-mono text-xs'>
                              <Badge
                                variant='outline'
                                className='px-1 py-0 text-xs'
                              >
                                {contact.fileName.replace(/\.[^/.]+$/, '')}
                              </Badge>
                            </TableCell>
                            <TableCell className='text-muted-foreground text-xs'>
                              {contact.sheetName}
                            </TableCell>
                          </>
                        )}
                        {displayColumns.map((column) => (
                          <TableCell key={column} className='text-sm'>
                            {contact.rowData[column] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </div>
        </div>
      </div>
    </div>
  );
}
