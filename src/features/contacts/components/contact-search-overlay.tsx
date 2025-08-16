'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, FileSpreadsheet, ChevronRight, X } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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

interface ContactSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  searchQuery: string;
  searchResults: {
    total: Contact[];
    grouped: SearchGroup[];
    hasMultipleSources: boolean;
  } | null;
  onSelectResult: (fileName: string, sheetName: string) => void;
}

export default function ContactSearchOverlay({
  isOpen,
  onClose,
  searchQuery,
  searchResults,
  onSelectResult
}: ContactSearchOverlayProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);

  // 键盘导航
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        if (searchResults) {
          setSelectedIndex((prev) =>
            Math.min(prev + 1, searchResults.grouped.length - 1)
          );
        }
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (searchResults && searchResults.grouped[selectedIndex]) {
          const group = searchResults.grouped[selectedIndex];
          onSelectResult(group.fileName, group.sheetName);
          onClose();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, searchResults, selectedIndex, onSelectResult, onClose]);

  // 重置选中索引
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-start justify-center pt-[20vh]'>
      {/* 背景遮罩 */}
      <div
        className='bg-background/80 absolute inset-0 backdrop-blur-sm'
        onClick={onClose}
      />

      {/* 搜索面板 */}
      <div
        ref={overlayRef}
        className='bg-popover relative w-full max-w-2xl rounded-lg border shadow-2xl'
      >
        {/* 搜索头部 */}
        <div className='flex items-center gap-3 border-b p-4'>
          <Search className='text-muted-foreground h-5 w-5' />
          <div className='flex-1'>
            <div className='text-sm font-medium'>
              搜索: &quot;{searchQuery}&quot;
            </div>
            {searchResults && (
              <div className='text-muted-foreground mt-1 text-xs'>
                在 {searchResults.grouped.length} 个位置找到{' '}
                {searchResults.total.length} 条结果
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className='text-muted-foreground hover:text-foreground'
          >
            <X className='h-4 w-4' />
          </button>
        </div>

        {/* 搜索结果 */}
        <ScrollArea className='max-h-[400px]'>
          {searchResults && searchResults.grouped.length > 0 ? (
            <div className='p-2'>
              {searchResults.grouped.map((group, index) => {
                const isSelected = index === selectedIndex;
                // 显示前3条数据的预览
                const previewData = group.contacts.slice(0, 3);

                return (
                  <button
                    key={`${group.fileName}-${group.sheetName}`}
                    className={cn(
                      'mb-2 w-full rounded-md p-3 text-left transition-colors',
                      'hover:bg-accent',
                      isSelected && 'bg-accent'
                    )}
                    onClick={() => {
                      onSelectResult(group.fileName, group.sheetName);
                      onClose();
                    }}
                  >
                    <div className='flex items-start gap-3'>
                      <FileSpreadsheet className='text-muted-foreground mt-1 h-4 w-4 flex-shrink-0' />
                      <div className='min-w-0 flex-1'>
                        <div className='mb-1 flex items-center gap-2'>
                          <span className='truncate text-sm font-medium'>
                            {group.fileName.replace(/\.(xlsx|xls|xlsm)$/i, '')}
                          </span>
                          <ChevronRight className='text-muted-foreground h-3 w-3' />
                          <span className='text-muted-foreground truncate text-sm'>
                            {group.sheetName}
                          </span>
                          <Badge variant='secondary' className='text-xs'>
                            {group.contacts.length} 条
                          </Badge>
                        </div>

                        {/* 数据预览 */}
                        <div className='space-y-1'>
                          {previewData.map((contact, idx) => {
                            // 查找包含搜索词的字段
                            const matchedField = Object.entries(
                              contact.rowData
                            ).find(([_, value]) =>
                              value
                                ?.toString()
                                .toLowerCase()
                                .includes(searchQuery.toLowerCase())
                            );

                            if (matchedField) {
                              const [key, value] = matchedField;
                              return (
                                <div
                                  key={idx}
                                  className='text-muted-foreground text-xs'
                                >
                                  <span className='font-medium'>{key}:</span>{' '}
                                  <span className='text-foreground'>
                                    {highlightMatch(
                                      value?.toString() || '',
                                      searchQuery
                                    )}
                                  </span>
                                </div>
                              );
                            }
                            return null;
                          })}
                          {group.contacts.length > 3 && (
                            <div className='text-muted-foreground text-xs'>
                              ...还有 {group.contacts.length - 3} 条结果
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : searchResults && searchResults.grouped.length === 0 ? (
            <div className='text-muted-foreground p-8 text-center'>
              <Search className='mx-auto mb-4 h-12 w-12 opacity-50' />
              <p>没有找到匹配的结果</p>
            </div>
          ) : (
            <div className='text-muted-foreground p-8 text-center'>
              <div className='flex items-center justify-center space-x-2'>
                <div className='bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.3s]' />
                <div className='bg-primary h-2 w-2 animate-bounce rounded-full [animation-delay:-0.15s]' />
                <div className='bg-primary h-2 w-2 animate-bounce rounded-full' />
              </div>
              <p className='mt-4 text-sm'>搜索中...</p>
            </div>
          )}
        </ScrollArea>

        {/* 底部提示 */}
        {searchResults && searchResults.grouped.length > 0 && (
          <div className='text-muted-foreground flex items-center justify-between border-t p-3 text-xs'>
            <div className='flex items-center gap-4'>
              <span>↑↓ 导航</span>
              <span>Enter 选择</span>
              <span>Esc 关闭</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 高亮匹配的文本
function highlightMatch(text: string, query: string): React.ReactNode {
  if (!query) return text;

  const parts = text.split(new RegExp(`(${query})`, 'gi'));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className='bg-yellow-200 text-inherit dark:bg-yellow-900'
          >
            {part}
          </mark>
        ) : (
          part
        )
      )}
    </>
  );
}
