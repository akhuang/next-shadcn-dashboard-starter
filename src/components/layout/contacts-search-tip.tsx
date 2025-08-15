'use client';
import { usePathname } from 'next/navigation';

export default function ContactsSearchTip() {
  const pathname = usePathname();
  const show = pathname?.startsWith('/dashboard/contacts');
  if (!show) return null;
  return (
    <span className='text-muted-foreground text-xs whitespace-nowrap'>
      💡 使用右上角搜索框可搜索联系人数据
    </span>
  );
}
