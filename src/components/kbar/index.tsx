'use client';
import { navItems } from '@/constants/data';
import {
  KBarAnimator,
  KBarPortal,
  KBarPositioner,
  KBarProvider,
  KBarSearch
} from 'kbar';
import { useRouter, usePathname } from 'next/navigation';
import { useMemo, useState, useEffect } from 'react';
import RenderResults from './render-result';
import useThemeSwitching from './use-theme-switching';

interface Contact {
  id: string;
  fileName: string;
  sheetName: string;
  rowData: Record<string, any>;
  searchableText: string;
}

export default function KBar({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [contactsData, setContactsData] = useState<Contact[]>([]);
  const [isContactsPage, setIsContactsPage] = useState(false);

  // 检测是否在联系人页面并获取联系人数据
  useEffect(() => {
    const isOnContactsPage = pathname?.includes('/contacts');
    setIsContactsPage(isOnContactsPage || false);

    if (isOnContactsPage) {
      // 从全局或API获取联系人数据
      fetch('/api/excel?action=getData')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && data.data?.contacts) {
            setContactsData(data.data.contacts);
          }
        })
        // eslint-disable-next-line no-console
        .catch(() => {});
    }
  }, [pathname]);

  // These action are for the navigation
  const actions = useMemo(() => {
    // Define navigateTo inside the useMemo callback to avoid dependency array issues
    const navigateTo = (url: string) => {
      router.push(url);
    };

    const navigationActions = navItems.flatMap((navItem) => {
      // Only include base action if the navItem has a real URL and is not just a container
      const baseAction =
        navItem.url !== '#'
          ? {
              id: `${navItem.title.toLowerCase()}Action`,
              name: navItem.title,
              shortcut: navItem.shortcut,
              keywords: navItem.title.toLowerCase(),
              section: 'Navigation',
              subtitle: `Go to ${navItem.title}`,
              perform: () => navigateTo(navItem.url)
            }
          : null;

      // Map child items into actions
      const childActions =
        navItem.items?.map((childItem) => ({
          id: `${childItem.title.toLowerCase()}Action`,
          name: childItem.title,
          shortcut: childItem.shortcut,
          keywords: childItem.title.toLowerCase(),
          section: navItem.title,
          subtitle: `Go to ${childItem.title}`,
          perform: () => navigateTo(childItem.url)
        })) ?? [];

      // Return only valid actions (ignoring null base actions for containers)
      return baseAction ? [baseAction, ...childActions] : childActions;
    });

    // 添加联系人搜索actions
    const contactActions =
      isContactsPage && contactsData.length > 0
        ? contactsData.map((contact) => {
            // 获取联系人的主要显示信息
            const displayKeys = Object.keys(contact.rowData).slice(0, 3);
            const displayInfo = displayKeys
              .map((key) => contact.rowData[key])
              .filter(Boolean)
              .join(' • ');

            return {
              id: `contact-${contact.id}`,
              name: displayInfo || 'Contact',
              shortcut: [],
              keywords: contact.searchableText,
              section: 'Contacts',
              subtitle: `${contact.fileName.replace(/\.[^/.]+$/, '')} > ${contact.sheetName}`,
              perform: () => {
                // 导航到联系人页面并高亮该条目
                router.push(`/dashboard/contacts?highlight=${contact.id}`);
              }
            };
          })
        : [];

    return [...navigationActions, ...contactActions];
  }, [router, isContactsPage, contactsData]);

  return (
    <KBarProvider actions={actions}>
      <KBarComponent>{children}</KBarComponent>
    </KBarProvider>
  );
}
const KBarComponent = ({ children }: { children: React.ReactNode }) => {
  useThemeSwitching();

  return (
    <>
      <KBarPortal>
        <KBarPositioner className='bg-background/80 fixed inset-0 z-99999 p-0! backdrop-blur-sm'>
          <KBarAnimator className='bg-card text-card-foreground relative mt-64! w-full max-w-[600px] -translate-y-12! overflow-hidden rounded-lg border shadow-lg'>
            <div className='bg-card border-border sticky top-0 z-10 border-b'>
              <KBarSearch className='bg-card w-full border-none px-6 py-4 text-lg outline-hidden focus:ring-0 focus:ring-offset-0 focus:outline-hidden' />
            </div>
            <div className='max-h-[400px]'>
              <RenderResults />
            </div>
          </KBarAnimator>
        </KBarPositioner>
      </KBarPortal>
      {children}
    </>
  );
};
