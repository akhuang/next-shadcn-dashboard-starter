'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  ExternalLink,
  Star,
  Clock,
  Grid,
  List,
  Trash2,
  Search,
  FileSpreadsheet
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect, useTransition } from 'react';
import { cn } from '@/lib/utils';
import type {
  NavigationItem,
  NavigationCategory,
  UserNavigationData
} from '@/types/navigation';
import {
  getNavigationData,
  getUserNavigationData,
  addRecentVisit,
  toggleFavorite as toggleFavoriteAction,
  clearRecentVisits as clearRecentVisitsAction,
  getNavigationStatus
} from '../actions/navigation-actions';

export default function NavigationExcelPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationData, setNavigationData] = useState<NavigationCategory[]>(
    []
  );
  const [userData, setUserData] = useState<UserNavigationData | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isPending, startTransition] = useTransition();

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [navData, userDataResult, status] = await Promise.all([
      getNavigationData(),
      getUserNavigationData(),
      getNavigationStatus()
    ]);
    setNavigationData(navData);
    setUserData(userDataResult);
    setLastUpdate(status.lastUpdate);
  };

  const handleLinkClick = async (item: NavigationItem) => {
    startTransition(async () => {
      const result = await addRecentVisit(item.id);
      if (result) {
        setUserData(result);
      }
    });
  };

  const handleToggleFavorite = async (itemId: string) => {
    startTransition(async () => {
      const result = await toggleFavoriteAction(itemId);
      if (result) {
        setUserData(result);
      }
    });
  };

  const handleClearRecentVisits = async () => {
    startTransition(async () => {
      const result = await clearRecentVisitsAction();
      if (result) {
        setUserData(result);
      }
    });
  };

  // Get all items flat list
  const allItems = useMemo(() => {
    const items: NavigationItem[] = [];
    navigationData.forEach((category) => {
      items.push(...category.items);
    });
    return items;
  }, [navigationData]);

  // Get recent visits items
  const recentItems = useMemo(() => {
    if (!userData) return [];
    return userData.recentVisits
      .map((visit) => allItems.find((item) => item.id === visit.itemId))
      .filter(Boolean) as NavigationItem[];
  }, [userData, allItems]);

  // Get favorite items
  const favoriteItems = useMemo(() => {
    if (!userData) return [];
    return userData.favorites
      .map((id) => allItems.find((item) => item.id === id))
      .filter(Boolean) as NavigationItem[];
  }, [userData, allItems]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return navigationData;
    const query = searchQuery.toLowerCase();
    return navigationData
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query) ||
            item.category.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.items.length > 0);
  }, [navigationData, searchQuery]);

  const isFavorite = (itemId: string) => {
    return userData?.favorites.includes(itemId) || false;
  };

  const LinkCard = ({
    item,
    viewMode
  }: {
    item: NavigationItem;
    viewMode: 'grid' | 'list';
  }) => {
    const isFav = isFavorite(item.id);

    return (
      <div className='group relative'>
        <Link
          href={item.url}
          target={item.isExternal ? '_blank' : '_self'}
          rel={item.isExternal ? 'noopener noreferrer' : undefined}
          onClick={() => handleLinkClick(item)}
        >
          <div className='bg-card text-card-foreground hover:shadow-primary/10 group-hover:border-primary/20 relative h-full cursor-pointer rounded-lg border shadow-sm transition-all duration-200 hover:scale-[1.02] hover:shadow-lg'>
            <div
              className={cn(
                'p-2',
                viewMode === 'list'
                  ? 'flex items-center gap-2'
                  : 'flex flex-col'
              )}
            >
              <div className='flex items-center gap-2'>
                <div className='bg-primary/10 rounded-md p-1'>
                  <FileSpreadsheet className='text-primary h-3 w-3' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='flex items-center gap-1 truncate text-xs font-medium'>
                    <span className='truncate'>{item.name}</span>
                    {item.isExternal && (
                      <ExternalLink className='text-muted-foreground h-2 w-2 flex-shrink-0' />
                    )}
                  </h3>
                  {viewMode === 'grid' && (
                    <p className='text-muted-foreground mt-0.5 line-clamp-1 text-[10px] leading-tight'>
                      {item.description}
                    </p>
                  )}
                  {viewMode === 'list' && (
                    <p className='text-muted-foreground truncate text-[10px]'>
                      {item.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className='from-primary/5 pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-r to-transparent opacity-0 transition-opacity group-hover:opacity-100' />
          </div>
        </Link>
        <Button
          size='sm'
          variant='ghost'
          className={cn(
            'absolute top-1 right-1 h-5 w-5 p-0 opacity-0 transition-opacity group-hover:opacity-100',
            isFav && 'opacity-100'
          )}
          onClick={(e) => {
            e.preventDefault();
            handleToggleFavorite(item.id);
          }}
          disabled={isPending}
        >
          <Star
            className={cn(
              'h-2.5 w-2.5',
              isFav && 'fill-yellow-500 text-yellow-500'
            )}
          />
        </Button>
      </div>
    );
  };

  return (
    <div className='flex flex-1 flex-col'>
      <main className='flex-1 overflow-auto p-4 md:p-6 lg:p-8'>
        <div className='mx-auto max-w-7xl space-y-6'>
          {/* 页面标题 */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>内部导航</h1>
              <p className='text-muted-foreground mt-2 flex items-center gap-2'>
                <FileSpreadsheet className='h-4 w-4' />从 Excel
                文件动态加载的导航系统
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {lastUpdate && (
                <div className='text-muted-foreground text-sm'>
                  最后更新: {new Date(lastUpdate).toLocaleString('zh-CN')}
                </div>
              )}
              <div className='relative'>
                <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
                <Input
                  type='search'
                  placeholder='搜索系统...'
                  className='w-[200px] pl-9 md:w-[300px]'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('grid')}
              >
                <Grid className='h-4 w-4' />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size='sm'
                onClick={() => setViewMode('list')}
              >
                <List className='h-4 w-4' />
              </Button>
            </div>
          </div>

          {/* 最近访问 */}
          {!searchQuery && (
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-blue-500' />
                  <h2 className='text-lg font-semibold'>最近访问</h2>
                </div>
                {recentItems.length > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={handleClearRecentVisits}
                    className='flex items-center gap-1'
                    disabled={isPending}
                  >
                    <Trash2 className='h-3 w-3' />
                    清空
                  </Button>
                )}
              </div>
              {recentItems.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-2',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                      : 'grid-cols-1'
                  )}
                >
                  {recentItems.map((item) => (
                    <LinkCard key={item.id} item={item} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className='text-muted-foreground flex h-16 items-center justify-center rounded-lg border border-dashed'>
                  <p className='text-sm'>
                    暂无最近访问记录，点击下方系统链接开始使用
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 我的收藏 */}
          {!searchQuery && (
            <div>
              <div className='mb-4 flex items-center gap-2'>
                <Star className='h-5 w-5 fill-yellow-500 text-yellow-500' />
                <h2 className='text-lg font-semibold'>我的收藏</h2>
                {favoriteItems.length > 0 && (
                  <Badge variant='secondary'>{favoriteItems.length} 个</Badge>
                )}
              </div>
              {favoriteItems.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-2',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                      : 'grid-cols-1'
                  )}
                >
                  {favoriteItems.map((item) => (
                    <LinkCard key={item.id} item={item} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className='text-muted-foreground flex h-16 items-center justify-center rounded-lg border border-dashed'>
                  <p className='text-sm'>
                    暂无收藏系统，点击系统卡片右上角的⭐来收藏
                  </p>
                </div>
              )}
            </div>
          )}

          {/* 分类导航 */}
          {searchQuery ? (
            // 搜索模式：显示所有搜索结果
            filteredCategories.length > 0 ? (
              <div className='space-y-4'>
                {filteredCategories.map((category) => (
                  <div key={category.id}>
                    <div className='mb-3 flex items-center gap-2'>
                      <FileSpreadsheet className='h-4 w-4' />
                      <h2 className='text-base font-semibold'>
                        {category.name}
                      </h2>
                      <Badge variant='secondary' className='text-xs'>
                        {category.items.length} 个结果
                      </Badge>
                    </div>
                    <div
                      className={cn(
                        'grid gap-2',
                        viewMode === 'grid'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                          : 'grid-cols-1'
                      )}
                    >
                      {category.items.map((item) => (
                        <LinkCard
                          key={item.id}
                          item={item}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              // 无搜索结果
              <div className='bg-card rounded-lg border p-8 text-center'>
                <Search className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
                <h3 className='mb-2 text-base font-semibold'>未找到相关系统</h3>
                <p className='text-muted-foreground text-sm'>
                  尝试使用不同的关键词或检查拼写
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  className='mt-3'
                  onClick={() => setSearchQuery('')}
                >
                  清除搜索
                </Button>
              </div>
            )
          ) : (
            // 正常模式：显示分类标签页
            navigationData.length > 0 && (
              <Tabs defaultValue={navigationData[0]?.id} className='w-full'>
                <div className='overflow-x-auto'>
                  <TabsList className='flex w-max min-w-full'>
                    {navigationData.map((category) => (
                      <TabsTrigger
                        key={category.id}
                        value={category.id}
                        className='flex-shrink-0'
                      >
                        <div className='flex items-center gap-2'>
                          <FileSpreadsheet className='h-4 w-4' />
                          <span className='hidden sm:inline'>
                            {category.name}
                          </span>
                          <span className='sm:hidden'>
                            {category.name.slice(0, 2)}
                          </span>
                        </div>
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </div>

                {navigationData.map((category) => (
                  <TabsContent
                    key={category.id}
                    value={category.id}
                    className='mt-4'
                  >
                    <div className='mb-3 flex items-center gap-2'>
                      <FileSpreadsheet className='h-4 w-4' />
                      <h2 className='text-base font-semibold'>
                        {category.name}
                      </h2>
                      <Badge variant='secondary'>
                        {category.items.length} 个系统
                      </Badge>
                    </div>
                    <div>
                      <div
                        className={cn(
                          'grid gap-2',
                          viewMode === 'grid'
                            ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                            : 'grid-cols-1'
                        )}
                      >
                        {category.items.map((item) => (
                          <LinkCard
                            key={item.id}
                            item={item}
                            viewMode={viewMode}
                          />
                        ))}
                      </div>
                    </div>
                  </TabsContent>
                ))}
              </Tabs>
            )
          )}

          {/* 空状态 */}
          {navigationData.length === 0 && !searchQuery && (
            <div className='bg-card rounded-lg border p-8 text-center'>
              <FileSpreadsheet className='text-muted-foreground mx-auto mb-3 h-8 w-8' />
              <h3 className='mb-2 text-base font-semibold'>暂无导航数据</h3>
              <p className='text-muted-foreground text-sm'>
                请确保 Excel 监控服务正在运行并已处理导航文件
              </p>
              <p className='text-muted-foreground mt-2 text-xs'>
                监控目录: /tmp/test-navigation/navigation.xlsx
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
