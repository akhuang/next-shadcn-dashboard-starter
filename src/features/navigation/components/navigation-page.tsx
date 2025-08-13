'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
  frequentlyUsedLinks,
  navigationCategories,
  NavigationLink
} from '@/constants/navigation-links';
import {
  ExternalLink,
  Star,
  Clock,
  Grid,
  List,
  Trash2,
  Search
} from 'lucide-react';
import Link from 'next/link';
import { useState, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { useNavigationStore } from '@/stores/navigation-store';

export default function NavigationPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const {
    recentVisits,
    addRecentVisit,
    toggleFavorite,
    isFavorite,
    clearRecentVisits
  } = useNavigationStore();

  const handleLinkClick = (link: NavigationLink) => {
    addRecentVisit(link);
  };

  // 过滤链接基于搜索查询
  const filteredFrequentlyUsed = useMemo(() => {
    if (!searchQuery) return frequentlyUsedLinks;
    const query = searchQuery.toLowerCase();
    return frequentlyUsedLinks.filter(
      (link) =>
        link.title.toLowerCase().includes(query) ||
        link.description.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const filteredCategories = useMemo(() => {
    if (!searchQuery) return navigationCategories;
    const query = searchQuery.toLowerCase();
    return navigationCategories
      .map((category) => ({
        ...category,
        links: category.links.filter(
          (link) =>
            link.title.toLowerCase().includes(query) ||
            link.description.toLowerCase().includes(query)
        )
      }))
      .filter((category) => category.links.length > 0);
  }, [searchQuery]);

  const LinkCard = ({
    link,
    viewMode
  }: {
    link: NavigationLink;
    viewMode: 'grid' | 'list';
  }) => {
    const IconComponent = link.icon;
    const isFav = isFavorite(link.id);

    return (
      <div className='group relative'>
        <Link
          href={link.url}
          target={link.isExternal ? '_blank' : '_self'}
          rel={link.isExternal ? 'noopener noreferrer' : undefined}
          onClick={() => handleLinkClick(link)}
        >
          <div className='group bg-card text-card-foreground relative h-full cursor-pointer rounded-lg border shadow-sm transition-all hover:scale-[1.01] hover:shadow-md'>
            <div
              className={cn(
                'p-2',
                viewMode === 'list'
                  ? 'flex items-center gap-2'
                  : 'flex flex-col'
              )}
            >
              <div className='flex items-center gap-2'>
                {IconComponent && typeof IconComponent === 'function' && (
                  <div className='bg-primary/10 rounded-md p-1'>
                    <IconComponent className='text-primary h-3 w-3' />
                  </div>
                )}
                <div className='min-w-0 flex-1'>
                  <h3 className='flex items-center gap-1 truncate text-xs font-medium'>
                    <span className='truncate'>{link.title}</span>
                    {link.isExternal && (
                      <ExternalLink className='text-muted-foreground h-2 w-2 flex-shrink-0' />
                    )}
                  </h3>
                  {viewMode === 'grid' && (
                    <p className='text-muted-foreground mt-0.5 line-clamp-1 text-[10px] leading-tight'>
                      {link.description}
                    </p>
                  )}
                  {viewMode === 'list' && (
                    <p className='text-muted-foreground truncate text-[10px]'>
                      {link.description}
                    </p>
                  )}
                </div>
              </div>
            </div>
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
            toggleFavorite(link.id);
          }}
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
      <main className='flex-1 overflow-hidden p-4 md:p-6 lg:p-8'>
        <div className='mx-auto max-w-7xl space-y-6'>
          {/* 页面标题 */}
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>内部导航</h1>
              <p className='text-muted-foreground mt-2'>
                快速访问常用的内部系统和工具
              </p>
            </div>
            <div className='flex items-center gap-2'>
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

          {/* 常用链接 */}
          {(!searchQuery || filteredFrequentlyUsed.length > 0) && (
            <div>
              <div className='mb-4 flex items-center gap-2'>
                <Star className='h-5 w-5 text-yellow-500' />
                <h2 className='text-lg font-semibold'>常用链接</h2>
                {searchQuery && (
                  <Badge variant='secondary'>
                    {filteredFrequentlyUsed.length} 个结果
                  </Badge>
                )}
              </div>
              <div
                className={cn(
                  'grid gap-2',
                  viewMode === 'grid'
                    ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                    : 'grid-cols-1'
                )}
              >
                {filteredFrequentlyUsed.map((link) => (
                  <LinkCard key={link.id} link={link} viewMode={viewMode} />
                ))}
              </div>
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
                      {category.icon && <category.icon className='h-4 w-4' />}
                      <h2 className='text-base font-semibold'>
                        {category.title}
                      </h2>
                      <Badge variant='secondary' className='text-xs'>
                        {category.links.length} 个结果
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
                      {category.links.map((link) => (
                        <LinkCard
                          key={link.id}
                          link={link}
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
            <Tabs defaultValue={navigationCategories[0]?.id} className='w-full'>
              <div className='overflow-x-auto'>
                <TabsList className='flex w-max min-w-full'>
                  {navigationCategories.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className='flex-shrink-0'
                    >
                      <div className='flex items-center gap-2'>
                        {category.icon && <category.icon className='h-4 w-4' />}
                        <span className='hidden sm:inline'>
                          {category.title}
                        </span>
                        <span className='sm:hidden'>
                          {category.title.slice(0, 2)}
                        </span>
                      </div>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {navigationCategories.map((category) => (
                <TabsContent
                  key={category.id}
                  value={category.id}
                  className='mt-4'
                >
                  <div className='mb-3 flex items-center gap-2'>
                    {category.icon && <category.icon className='h-4 w-4' />}
                    <h2 className='text-base font-semibold'>
                      {category.title}
                    </h2>
                    {category.description && (
                      <span className='text-muted-foreground text-sm'>
                        · {category.description}
                      </span>
                    )}
                  </div>
                  <div className='max-h-[500px] overflow-y-auto'>
                    <div
                      className={cn(
                        'grid gap-2',
                        viewMode === 'grid'
                          ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                          : 'grid-cols-1'
                      )}
                    >
                      {category.links.map((link) => (
                        <LinkCard
                          key={link.id}
                          link={link}
                          viewMode={viewMode}
                        />
                      ))}
                    </div>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          )}

          {/* 最近访问 */}
          {!searchQuery && (
            <div>
              <div className='mb-4 flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  <Clock className='h-5 w-5' />
                  <h2 className='text-lg font-semibold'>最近访问</h2>
                </div>
                {recentVisits.length > 0 && (
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={clearRecentVisits}
                    className='flex items-center gap-1'
                  >
                    <Trash2 className='h-3 w-3' />
                    清空
                  </Button>
                )}
              </div>
              {recentVisits.length > 0 ? (
                <div
                  className={cn(
                    'grid gap-2',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8'
                      : 'grid-cols-1'
                  )}
                >
                  {recentVisits.map((visit) => (
                    <LinkCard key={visit.id} link={visit} viewMode={viewMode} />
                  ))}
                </div>
              ) : (
                <div className='text-muted-foreground flex h-16 items-center justify-center rounded-lg border border-dashed'>
                  <p className='text-sm'>暂无最近访问记录</p>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
