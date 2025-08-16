'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
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
import { Search, FileSpreadsheet, RefreshCw, Folder } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';

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

export default function ContactTable() {
  const [data, setData] = useState<ExcelData>({
    contacts: [],
    lastUpdated: new Date(),
    files: []
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [folderPath, setFolderPath] = useState(
    '/Users/huangf/Documents/Contacts'
  );
  const [isConnected, setIsConnected] = useState(false);
  const [eventSource, setEventSource] = useState<EventSource | null>(null);

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
      // ignore initialize error
    } finally {
      setLoading(false);
    }
  };

  // 设置SSE连接
  useEffect(() => {
    if (!folderPath) return;

    // 初始化文件夹
    initializeFolder();

    // 建立SSE连接
    const es = new EventSource('/api/excel/stream');

    es.onopen = () => {
      setIsConnected(true);
      // SSE connected
    };

    es.onmessage = (event) => {
      try {
        const newData = JSON.parse(event.data);
        setData(newData);
      } catch (error) {
        // ignore bad event
      }
    };

    es.onerror = () => {
      setIsConnected(false);
    };

    setEventSource(es);

    return () => {
      es.close();
      setIsConnected(false);
    };
  }, [folderPath]);

  // 过滤联系人
  const filteredContacts = useMemo(() => {
    if (!searchQuery) return data.contacts;

    const query = searchQuery.toLowerCase();
    return data.contacts.filter((contact) =>
      contact.searchableText.includes(query)
    );
  }, [data.contacts, searchQuery]);

  // 获取所有列名
  const allColumns = useMemo(() => {
    const columnsSet = new Set<string>();
    data.contacts.forEach((contact) => {
      Object.keys(contact.rowData).forEach((key) => columnsSet.add(key));
    });
    return Array.from(columnsSet);
  }, [data.contacts]);

  const handleRefresh = () => {
    initializeFolder();
  };

  return (
    <div className='space-y-4'>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <div>
              <CardTitle>Excel联系人管理</CardTitle>
              <CardDescription>
                实时监控文件夹中的Excel文件，支持多Sheet和合并单元格
              </CardDescription>
            </div>
            <div className='flex items-center gap-2'>
              <Badge variant={isConnected ? 'default' : 'secondary'}>
                {isConnected ? '已连接' : '未连接'}
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
        <CardContent>
          <div className='space-y-4'>
            {/* 文件列表 */}
            {data.files.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {data.files.map((file, index) => (
                  <Badge key={index} variant='outline'>
                    <FileSpreadsheet className='mr-1 h-3 w-3' />
                    {file}
                  </Badge>
                ))}
              </div>
            )}

            {/* 搜索框 */}
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-2.5 left-2 h-4 w-4' />
              <Input
                placeholder='搜索联系人...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>

            {/* 统计信息 */}
            <div className='text-muted-foreground flex items-center justify-between text-sm'>
              <span>
                共 {data.contacts.length} 条记录， 显示{' '}
                {filteredContacts.length} 条
              </span>
              <span>
                最后更新: {new Date(data.lastUpdated).toLocaleString('zh-CN')}
              </span>
            </div>

            {/* 数据表格 */}
            <ScrollArea className='h-[600px] rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className='w-[150px]'>文件</TableHead>
                    <TableHead className='w-[100px]'>Sheet</TableHead>
                    {allColumns.map((column) => (
                      <TableHead key={column}>{column}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredContacts.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={allColumns.length + 2}
                        className='text-muted-foreground text-center'
                      >
                        {searchQuery ? '没有找到匹配的联系人' : '暂无数据'}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredContacts.map((contact) => (
                      <TableRow key={contact.id}>
                        <TableCell className='font-medium'>
                          <Badge variant='secondary'>{contact.fileName}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant='outline'>{contact.sheetName}</Badge>
                        </TableCell>
                        {allColumns.map((column) => (
                          <TableCell key={column}>
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
        </CardContent>
      </Card>
    </div>
  );
}
