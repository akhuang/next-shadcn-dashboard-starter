'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  Search,
  FileSpreadsheet,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
// import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

interface SearchGroup {
  fileName: string;
  sheetName: string;
  contacts: Contact[];
}

interface ContactSearchResultsProps {
  searchQuery: string;
  searchResults: {
    total: Contact[];
    grouped: SearchGroup[];
    hasMultipleSources: boolean;
  } | null;
  isSearching?: boolean;
  onClose?: () => void;
}

// 高亮匹配的文本
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query || !text) return text;

  try {
    // 转义特殊字符以安全使用在正则表达式中
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));

    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark
              key={i}
              className='rounded bg-yellow-200 px-0.5 text-inherit dark:bg-yellow-900/50'
            >
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  } catch {
    return text;
  }
}

export default function ContactSearchResults({
  searchQuery,
  searchResults,
  isSearching = false,
  onClose
}: ContactSearchResultsProps) {
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [copiedItems, setCopiedItems] = useState<Set<string>>(new Set());

  // 默认展开所有组
  useEffect(() => {
    if (searchResults?.grouped) {
      const allGroups = new Set(
        searchResults.grouped.map((g) => `${g.fileName}-${g.sheetName}`)
      );
      setExpandedGroups(allGroups);
    }
  }, [searchResults]);

  const toggleGroup = useCallback((groupId: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) {
        next.delete(groupId);
      } else {
        next.add(groupId);
      }
      return next;
    });
  }, []);

  const copyToClipboard = useCallback(async (data: any, itemId: string) => {
    try {
      let textToCopy = '';

      if (typeof data === 'object') {
        // 格式化对象数据为易读的文本
        textToCopy = Object.entries(data)
          .filter(([, value]) => value != null && value !== '')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');
      } else {
        textToCopy = String(data);
      }

      await navigator.clipboard.writeText(textToCopy);

      // 显示复制成功状态
      setCopiedItems((prev) => new Set(prev).add(itemId));
      toast.success('已复制到剪贴板');

      // 2秒后移除复制成功状态
      setTimeout(() => {
        setCopiedItems((prev) => {
          const next = new Set(prev);
          next.delete(itemId);
          return next;
        });
      }, 2000);
    } catch (error) {
      toast.error('复制失败');
    }
  }, []);

  const copyAllResults = useCallback(async () => {
    if (!searchResults) return;

    try {
      const allData = searchResults.grouped
        .map((group) => {
          const header = `===== ${group.fileName} - ${group.sheetName} =====\n`;
          const contacts = group.contacts
            .map((contact, idx) => {
              const data = Object.entries(contact.rowData)
                .filter(([, value]) => value != null && value !== '')
                .map(([key, value]) => `  ${key}: ${value}`)
                .join('\n');
              return `[${idx + 1}]\n${data}`;
            })
            .join('\n\n');
          return header + contacts;
        })
        .join('\n\n');

      await navigator.clipboard.writeText(allData);
      toast.success(`已复制全部 ${searchResults.total.length} 条结果`);
    } catch (error) {
      toast.error('复制失败');
    }
  }, [searchResults]);

  if (isSearching) {
    return (
      <div className='bg-card rounded-lg border p-8'>
        <div className='text-muted-foreground text-center'>
          <div className='flex items-center justify-center space-x-2'>
            <div className='bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
            <div className='bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
            <div className='bg-primary h-2 w-2 animate-bounce rounded-full' />
          </div>
          <p className='mt-4 text-sm'>搜索中...</p>
        </div>
      </div>
    );
  }

  if (!searchResults) {
    return null;
  }

  if (searchResults.grouped.length === 0) {
    return (
      <div className='bg-card rounded-lg border p-8'>
        <div className='text-muted-foreground text-center'>
          <Search className='mx-auto mb-4 h-12 w-12 opacity-50' />
          <p className='text-lg font-medium'>没有找到匹配的结果</p>
          <p className='mt-2 text-sm'>试试其他关键词</p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* 搜索结果统计 */}
      <div className='bg-card rounded-lg border p-4'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3'>
            <Search className='text-muted-foreground h-5 w-5' />
            <div>
              <span className='font-medium'>搜索结果：</span>
              <span className='text-muted-foreground ml-1'>
                &quot;{searchQuery}&quot;
              </span>
            </div>
            <Badge variant='secondary'>
              {searchResults.total.length} 条结果
            </Badge>
            <Badge variant='outline'>{searchResults.grouped.length} 个表</Badge>
          </div>

          <div className='flex items-center gap-2'>
            <Button
              size='sm'
              variant='outline'
              onClick={copyAllResults}
              className='gap-2'
            >
              <Copy className='h-3 w-3' />
              复制全部
            </Button>
            {onClose && (
              <Button
                size='sm'
                variant='ghost'
                onClick={onClose}
                className='h-8 w-8 p-0'
              >
                <X className='h-4 w-4' />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 分组显示搜索结果 */}
      <div className='space-y-4'>
        {searchResults.grouped.map((group) => {
          const groupId = `${group.fileName}-${group.sheetName}`;
          const isExpanded = expandedGroups.has(groupId);

          return (
            <div key={groupId} className='bg-card rounded-lg border'>
              {/* 组标题 */}
              <button
                onClick={() => toggleGroup(groupId)}
                className='hover:bg-accent/50 flex w-full items-center justify-between p-4 transition-colors'
              >
                <div className='flex items-center gap-3'>
                  {isExpanded ? (
                    <ChevronDown className='h-4 w-4' />
                  ) : (
                    <ChevronRight className='h-4 w-4' />
                  )}
                  <FileSpreadsheet className='text-muted-foreground h-4 w-4' />
                  <span className='font-medium'>
                    {group.fileName.replace(/\.(xlsx|xls|xlsm)$/i, '')}
                  </span>
                  <span className='text-muted-foreground'>
                    / {group.sheetName}
                  </span>
                  <Badge>{group.contacts.length} 条</Badge>
                </div>

                <Button
                  size='sm'
                  variant='ghost'
                  onClick={(e) => {
                    e.stopPropagation();
                    const groupData = group.contacts.map((c) => c.rowData);
                    copyToClipboard(groupData, groupId);
                  }}
                  className='gap-2'
                >
                  {copiedItems.has(groupId) ? (
                    <Check className='h-3 w-3 text-green-600' />
                  ) : (
                    <Copy className='h-3 w-3' />
                  )}
                  复制本表
                </Button>
              </button>

              {/* 组内容 - 表格形式展示 */}
              {isExpanded && (
                <div className='border-t'>
                  <ScrollArea className='max-h-[400px]'>
                    <div className='p-4'>
                      {/* 简单表格展示 */}
                      <div className='overflow-x-auto'>
                        <table className='w-full text-sm'>
                          <thead>
                            <tr className='border-b'>
                              <th className='text-muted-foreground p-2 text-left font-medium'>
                                #
                              </th>
                              {/* 动态生成表头 */}
                              {Object.keys(
                                group.contacts[0]?.rowData || {}
                              ).map((key) => (
                                <th
                                  key={key}
                                  className='text-muted-foreground p-2 text-left font-medium'
                                >
                                  {key}
                                </th>
                              ))}
                              <th className='text-muted-foreground p-2 text-center font-medium'>
                                操作
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.contacts.slice(0, 5).map((contact, idx) => {
                              const rowId = `${groupId}-${idx}`;
                              return (
                                <tr
                                  key={rowId}
                                  className='hover:bg-accent/50 border-b transition-colors'
                                >
                                  <td className='text-muted-foreground p-2'>
                                    {idx + 1}
                                  </td>
                                  {Object.entries(contact.rowData).map(
                                    ([key, value]) => (
                                      <td key={key} className='p-2'>
                                        <div className='max-w-[200px] truncate'>
                                          {highlightMatch(
                                            String(value || ''),
                                            searchQuery
                                          )}
                                        </div>
                                      </td>
                                    )
                                  )}
                                  <td className='p-2 text-center'>
                                    <Button
                                      size='sm'
                                      variant='ghost'
                                      onClick={() =>
                                        copyToClipboard(contact.rowData, rowId)
                                      }
                                      className='h-7 w-7 p-0'
                                    >
                                      {copiedItems.has(rowId) ? (
                                        <Check className='h-3 w-3 text-green-600' />
                                      ) : (
                                        <Copy className='h-3 w-3' />
                                      )}
                                    </Button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>

                      {/* 如果结果太多，显示提示 */}
                      {group.contacts.length > 5 && (
                        <div className='text-muted-foreground mt-4 text-center text-sm'>
                          仅显示前 5 条，共 {group.contacts.length} 条结果
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
