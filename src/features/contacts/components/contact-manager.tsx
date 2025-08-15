'use client';

import { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Search,
  RefreshCw,
  Folder,
  FileSpreadsheet,
  Users,
  Building2,
  Package,
  Filter,
  Download,
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
import { Separator } from '@/components/ui/separator';
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

interface FileStructure {
  fileName: string;
  displayName: string;
  sheets: string[];
  icon: any;
  count: number;
}

// 根据文件名选择合适的图标
const getFileIcon = (fileName: string) => {
  const name = fileName.toLowerCase();
  if (name.includes('客户') || name.includes('customer')) return Users;
  if (name.includes('供应商') || name.includes('supplier')) return Building2;
  if (name.includes('员工') || name.includes('employee')) return Users;
  if (name.includes('产品') || name.includes('product')) return Package;
  return FileSpreadsheet;
};

export default function ContactManager() {
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
  const [searchScope, setSearchScope] = useState<'current' | 'all'>('current');

  // 解析文件结构
  const fileStructure = useMemo(() => {
    const structure: FileStructure[] = [];
    const fileMap = new Map<string, Set<string>>();

    data.contacts.forEach((contact) => {
      if (!fileMap.has(contact.fileName)) {
        fileMap.set(contact.fileName, new Set());
      }
      fileMap.get(contact.fileName)?.add(contact.sheetName);
    });

    fileMap.forEach((sheets, fileName) => {
      const displayName = fileName.replace(/\.(xlsx|xls|xlsm)$/i, '');
      const contactCount = data.contacts.filter(
        (c) => c.fileName === fileName
      ).length;
      structure.push({
        fileName,
        displayName,
        sheets: Array.from(sheets),
        icon: getFileIcon(fileName),
        count: contactCount
      });
    });

    return structure;
  }, [data.contacts]);

  // 初始化时选择第一个文件和Sheet
  useEffect(() => {
    if (fileStructure.length > 0 && !selectedFile) {
      setSelectedFile(fileStructure[0].fileName);
      if (fileStructure[0].sheets.length > 0) {
        setSelectedSheet(fileStructure[0].sheets[0]);
      }
    }
  }, [fileStructure, selectedFile]);

  // 初始化文件夹路径
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

  // 设置SSE连接
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

  // 过滤联系人
  const filteredContacts = useMemo(() => {
    let contacts = data.contacts;

    // 根据搜索范围过滤
    if (searchScope === 'current' && selectedFile && selectedSheet) {
      contacts = contacts.filter(
        (c) => c.fileName === selectedFile && c.sheetName === selectedSheet
      );
    }

    // 应用搜索查询
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      contacts = contacts.filter((c) => c.searchableText.includes(query));
    }

    return contacts;
  }, [data.contacts, searchQuery, selectedFile, selectedSheet, searchScope]);

  // 获取当前选中Sheet的联系人
  const currentSheetContacts = useMemo(() => {
    if (!selectedFile || !selectedSheet) return [];
    return data.contacts.filter(
      (c) => c.fileName === selectedFile && c.sheetName === selectedSheet
    );
  }, [data.contacts, selectedFile, selectedSheet]);

  // 获取当前Sheet的列
  const currentColumns = useMemo(() => {
    const columnsSet = new Set<string>();
    const contacts =
      searchQuery && searchScope === 'all'
        ? filteredContacts
        : currentSheetContacts;
    contacts.forEach((contact) => {
      Object.keys(contact.rowData).forEach((key) => columnsSet.add(key));
    });
    return Array.from(columnsSet);
  }, [currentSheetContacts, filteredContacts, searchQuery, searchScope]);

  const handleRefresh = () => {
    initializeFolder();
  };

  // 导出当前数据为CSV
  const exportToCSV = () => {
    const contacts =
      searchQuery && searchScope === 'all'
        ? filteredContacts
        : currentSheetContacts;
    if (contacts.length === 0) return;

    const headers = currentColumns;
    const csvContent = [
      headers.join(','),
      ...contacts.map((contact) =>
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
    link.download = `${selectedFile.replace(/\.[^/.]+$/, '')}_${selectedSheet}_${new Date().toISOString()}.csv`;
    link.click();
  };

  return (
    <div className='flex h-full flex-col space-y-4'>
      {/* 顶部工具栏 */}
      <Card>
        <CardHeader className='pb-3'>
          <div className='flex items-center justify-between'>
            <div className='space-y-1'>
              <CardTitle>联系人管理系统</CardTitle>
              <CardDescription>监控文件夹：{folderPath}</CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? '实时同步' : '未连接'}
              </Badge>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant='outline' size='sm'>
                    <Folder className='mr-2 h-4 w-4' />
                    设置文件夹
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
              <Button
                variant='outline'
                size='sm'
                onClick={handleRefresh}
                disabled={loading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                />
                刷新
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 主内容区 */}
      <div className='flex flex-1 gap-4'>
        {/* 左侧导航 */}
        <Card className='flex w-64 flex-col'>
          <CardHeader className='pb-3'>
            <CardTitle className='text-sm font-medium'>数据分类</CardTitle>
          </CardHeader>
          <CardContent className='flex-1 p-0'>
            <ScrollArea className='h-full'>
              <div className='space-y-2 p-4 pt-0'>
                {fileStructure.map((file) => {
                  const FileIcon = file.icon;
                  const isSelected = selectedFile === file.fileName;

                  return (
                    <div key={file.fileName} className='space-y-1'>
                      <Button
                        variant={isSelected ? 'secondary' : 'ghost'}
                        className='w-full justify-start'
                        onClick={() => {
                          setSelectedFile(file.fileName);
                          if (file.sheets.length > 0) {
                            setSelectedSheet(file.sheets[0]);
                          }
                        }}
                      >
                        <FileIcon className='mr-2 h-4 w-4' />
                        <span className='flex-1 truncate text-left'>
                          {file.displayName}
                        </span>
                        <Badge variant='outline' className='ml-2'>
                          {file.count}
                        </Badge>
                      </Button>

                      {isSelected && file.sheets.length > 0 && (
                        <div className='ml-6 space-y-1'>
                          {file.sheets.map((sheet) => (
                            <Button
                              key={sheet}
                              variant={
                                selectedSheet === sheet ? 'secondary' : 'ghost'
                              }
                              size='sm'
                              className='w-full justify-start text-xs'
                              onClick={() => setSelectedSheet(sheet)}
                            >
                              <ChevronRight className='mr-1 h-3 w-3' />
                              {sheet}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 右侧数据区 */}
        <Card className='flex flex-1 flex-col'>
          <CardHeader>
            <div className='space-y-4'>
              {/* 面包屑 */}
              <div className='text-muted-foreground flex items-center text-sm'>
                {selectedFile && (
                  <>
                    <span>{selectedFile.replace(/\.[^/.]+$/, '')}</span>
                    {selectedSheet && (
                      <>
                        <ChevronRight className='mx-2 h-4 w-4' />
                        <span>{selectedSheet}</span>
                      </>
                    )}
                    <span className='ml-auto'>
                      共 {currentSheetContacts.length} 条记录
                    </span>
                  </>
                )}
              </div>

              {/* 搜索和筛选 */}
              <div className='flex gap-2'>
                <div className='relative flex-1'>
                  <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
                  <Input
                    placeholder={
                      searchScope === 'current'
                        ? '在当前分类中搜索...'
                        : '全局搜索...'
                    }
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className='pl-8'
                  />
                </div>
                <Select
                  value={searchScope}
                  onValueChange={(value: 'current' | 'all') =>
                    setSearchScope(value)
                  }
                >
                  <SelectTrigger className='w-32'>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='current'>当前分类</SelectItem>
                    <SelectItem value='all'>所有数据</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant='outline'
                  size='icon'
                  onClick={exportToCSV}
                  disabled={currentSheetContacts.length === 0}
                >
                  <Download className='h-4 w-4' />
                </Button>
              </div>

              {/* 搜索结果提示 */}
              {searchQuery && (
                <div className='text-muted-foreground text-sm'>
                  {searchScope === 'all' ? '全局' : '当前分类'}搜索 &quot;
                  {searchQuery}&quot; 找到 {filteredContacts.length} 条结果
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className='flex-1 p-0'>
            <ScrollArea className='h-full'>
              <Table>
                <TableHeader>
                  <TableRow>
                    {searchScope === 'all' && searchQuery && (
                      <>
                        <TableHead className='w-32'>来源</TableHead>
                        <TableHead className='w-24'>分类</TableHead>
                      </>
                    )}
                    {currentColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(searchQuery && searchScope === 'all'
                    ? filteredContacts
                    : searchQuery
                      ? currentSheetContacts.filter((c) =>
                          c.searchableText.includes(searchQuery.toLowerCase())
                        )
                      : currentSheetContacts
                  ).map((contact) => (
                    <TableRow key={contact.id}>
                      {searchScope === 'all' && searchQuery && (
                        <>
                          <TableCell className='font-medium'>
                            <Badge variant='outline' className='text-xs'>
                              {contact.fileName.replace(/\.[^/.]+$/, '')}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className='text-muted-foreground text-xs'>
                              {contact.sheetName}
                            </span>
                          </TableCell>
                        </>
                      )}
                      {currentColumns.map((column) => (
                        <TableCell key={column}>
                          {contact.rowData[column] || '-'}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {(searchQuery && searchScope === 'all'
                    ? filteredContacts
                    : searchQuery
                      ? currentSheetContacts.filter((c) =>
                          c.searchableText.includes(searchQuery.toLowerCase())
                        )
                      : currentSheetContacts
                  ).length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={
                          currentColumns.length +
                          (searchScope === 'all' && searchQuery ? 2 : 0)
                        }
                        className='text-muted-foreground py-8 text-center'
                      >
                        {searchQuery ? '没有找到匹配的数据' : '暂无数据'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
