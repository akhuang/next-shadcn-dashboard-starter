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
  FileSpreadsheet,
  User,
  LogIn,
  LogOut
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NavigationItem {
  id: string;
  category: string;
  name: string;
  url: string;
  description: string | null;
  isExternal: boolean;
  visitCount?: number;
  lastVisitAt?: string;
}

interface NavigationCategory {
  id: string;
  name: string;
  items: NavigationItem[];
}

interface UserData {
  user: {
    id: string;
    email: string;
    username: string;
    displayName: string | null;
  };
  favorites: NavigationItem[];
  recentVisits: NavigationItem[];
}

export default function NavigationDatabasePage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [navigationData, setNavigationData] = useState<NavigationCategory[]>(
    []
  );
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // 加载数据
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 加载导航数据
      const navResponse = await fetch('/api/navigation/items');
      if (navResponse.ok) {
        const navData = await navResponse.json();
        setNavigationData(navData);
      }

      // 加载用户数据
      const userResponse = await fetch('/api/navigation/user');
      if (userResponse.ok) {
        const userData = await userResponse.json();
        setUserData(userData);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟登录
  const handleMockLogin = async () => {
    try {
      const response = await fetch('/api/auth/mock-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@company.com' })
      });

      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error during login:', error);
    }
  };

  // 登出
  const handleLogout = async () => {
    try {
      await fetch('/api/auth/mock-login', { method: 'DELETE' });
      setUserData(null);
      await loadData();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  // 切换收藏
  const handleToggleFavorite = async (itemId: string) => {
    if (!userData) return;

    const isFavorite = userData.favorites.some((f) => f.id === itemId);

    try {
      if (isFavorite) {
        const response = await fetch(
          `/api/navigation/favorites?itemId=${itemId}`,
          {
            method: 'DELETE'
          }
        );
        if (response.ok) {
          await loadData();
        }
      } else {
        const response = await fetch('/api/navigation/favorites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ itemId })
        });
        if (response.ok) {
          await loadData();
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // 记录访问
  const handleLinkClick = async (item: NavigationItem) => {
    if (!userData) return;

    try {
      await fetch('/api/navigation/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id })
      });
      // 不等待响应，让用户快速跳转
    } catch (error) {
      console.error('Error recording visit:', error);
    }
  };

  // 清空访问记录
  const handleClearVisits = async () => {
    if (!userData) return;

    try {
      const response = await fetch('/api/navigation/visits', {
        method: 'DELETE'
      });
      if (response.ok) {
        await loadData();
      }
    } catch (error) {
      console.error('Error clearing visits:', error);
    }
  };

  // 获取所有导航项
  const allItems = useMemo(() => {
    const items: NavigationItem[] = [];
    navigationData.forEach((category) => {
      items.push(...category.items);
    });
    return items;
  }, [navigationData]);

  // 过滤分类
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return navigationData;
    const query = searchQuery.toLowerCase();
    return navigationData
      .map((category) => ({
        ...category,
        items: category.items.filter(
          (item) =>
            item.name.toLowerCase().includes(query) ||
            (item.description?.toLowerCase() || '').includes(query) ||
            item.category.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.items.length > 0);
  }, [navigationData, searchQuery]);

  const isFavorite = (itemId: string) => {
    return userData?.favorites.some((f) => f.id === itemId) || false;
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
                  {viewMode === 'grid' && item.description && (
                    <p className='text-muted-foreground mt-0.5 line-clamp-1 text-[10px] leading-tight'>
                      {item.description}
                    </p>
                  )}
                  {viewMode === 'list' && item.description && (
                    <p className='text-muted-foreground truncate text-[10px]'>
                      {item.description}
                    </p>
                  )}
                  {item.visitCount && (
                    <p className='text-muted-foreground mt-0.5 text-[9px]'>
                      访问 {item.visitCount} 次
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
          disabled={!userData}
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

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <div className='text-center'>
          <div className='border-primary mx-auto h-8 w-8 animate-spin rounded-full border-b-2'></div>
          <p className='text-muted-foreground mt-2 text-sm'>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col'>
      <main className='flex-1 overflow-auto p-4 md:p-6 lg:p-8'>
        <div className='mx-auto max-w-7xl space-y-6'>
          {/* 页面标题 */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>内部导航</h1>
              <p className='text-muted-foreground mt-2 flex items-center gap-2'>
                <FileSpreadsheet className='h-4 w-4' />
                企业内部系统导航门户
              </p>
            </div>
            <div className='flex items-center gap-2'>
              {userData ? (
                <div className='flex items-center gap-2'>
                  <div className='text-muted-foreground flex items-center gap-1 text-sm'>
                    <User className='h-4 w-4' />
                    {userData.user.displayName || userData.user.username}
                  </div>
                  <Button variant='outline' size='sm' onClick={handleLogout}>
                    <LogOut className='mr-1 h-4 w-4' />
                    登出
                  </Button>
                </div>
              ) : (
                <Button variant='outline' size='sm' onClick={handleMockLogin}>
                  <LogIn className='mr-1 h-4 w-4' />
                  模拟登录
                </Button>
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

          {/* 用户未登录提示 */}
          {!userData && !searchQuery && (
            <div className='rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/20'>
              <p className='text-sm text-amber-800 dark:text-amber-200'>
                请先登录以使用收藏和访问记录功能
              </p>
            </div>
          )}

          {/* 最近访问 */}
          {!searchQuery && userData && userData.recentVisits.length > 0 && (
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-5 w-5 text-blue-500' />
                  <h2 className='text-lg font-semibold'>最近访问</h2>
                </div>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleClearVisits}
                  className='flex items-center gap-1'
                >
                  <Trash2 className='h-3 w-3' />
                  清空
                </Button>
              </div>
              <div
                className={cn(
                  'grid gap-2',
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                    : 'grid-cols-1'
                )}
              >
                {userData.recentVisits.slice(0, 16).map((item) => (
                  <LinkCard key={item.id} item={item} viewMode={viewMode} />
                ))}
              </div>
            </div>
          )}

          {/* 我的收藏 */}
          {!searchQuery && userData && userData.favorites.length > 0 && (
            <div>
              <div className='mb-4 flex items-center gap-2'>
                <Star className='h-5 w-5 fill-yellow-500 text-yellow-500' />
                <h2 className='text-lg font-semibold'>我的收藏</h2>
                <Badge variant='secondary'>
                  {userData.favorites.length} 个
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
                {userData.favorites.map((item) => (
                  <LinkCard key={item.id} item={item} viewMode={viewMode} />
                ))}
              </div>
            </div>
          )}

          {/* 分类导航 */}
          {searchQuery ? (
            // 搜索模式
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
            // 正常模式：标签页
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
                        <FileSpreadsheet className='mr-2 h-4 w-4' />
                        {category.name}
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
                请先运行数据库迁移并导入数据
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
